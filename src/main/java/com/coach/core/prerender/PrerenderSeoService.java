package com.coach.core.prerender;

import static com.google.common.collect.FluentIterable.*;
import static org.apache.http.HttpHeaders.*;

import java.io.Closeable;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import lombok.extern.slf4j.Slf4j;

import org.apache.http.Header;
import org.apache.http.HeaderElement;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHost;
import org.apache.http.HttpRequest;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.ParseException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIUtils;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.message.BasicHeader;
import org.apache.http.message.HeaderGroup;
import org.apache.http.util.EntityUtils;

import com.amazonaws.util.StringUtils;
import com.google.common.base.Function;
import com.google.common.base.Predicate;

@Slf4j
public class PrerenderSeoService {
	/**
	 * These are the "hop-by-hop" headers that should not be copied.
	 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html I use an
	 * HttpClient HeaderGroup class instead of Set<String> because this approach
	 * does case insensitive lookup faster.
	 */
	private static final HeaderGroup hopByHopHeaders;
	public static final String ESCAPED_FRAGMENT_KEY = "_escaped_fragment_";
	private final CloseableHttpClient httpClient;
	private final PrerenderConfig prerenderConfig;
	private PreRenderEventHandler preRenderEventHandler;

	public PrerenderSeoService(Map<String, String> config) {
		prerenderConfig = new PrerenderConfig(config);
		httpClient = getHttpClient();
	}

	static {
		hopByHopHeaders = new HeaderGroup();
		String[] headers = new String[] { "Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization",
				"TE", "Trailers", "Transfer-Encoding", "Upgrade" };
		for (String header : headers) {
			hopByHopHeaders.addHeader(new BasicHeader(header, null));
		}
	}

	public void destroy() {
		if (preRenderEventHandler != null) {
			preRenderEventHandler.destroy();
		}
		closeQuietly(httpClient);
	}

	public boolean prerenderIfEligible(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
		try {
			if (handlePrerender(servletRequest, servletResponse)) { return true; }
		}
		catch (Exception e) {
			log.error("Prerender service error", e);
		}
		return false;
	}

	private boolean handlePrerender(HttpServletRequest servletRequest, HttpServletResponse servletResponse)
			throws URISyntaxException, IOException {
		if (shouldShowPrerenderedPage(servletRequest)) {
			preRenderEventHandler = prerenderConfig.getEventHandler();
			if (beforeRender(servletRequest, servletResponse)
					|| proxyPrerenderedPageResponse(servletRequest, servletResponse)) { return true; }
		}
		return false;
	}

	private boolean shouldShowPrerenderedPage(HttpServletRequest request) throws URISyntaxException {
		final String userAgent = request.getHeader("User-Agent");
		final String url = getRequestURL(request);
		final String referer = request.getHeader("Referer");

		log.debug(String.format("checking request for %s from User-Agent %s and referer %s", url, userAgent, referer));

		if (!HttpGet.METHOD_NAME.equals(request.getMethod())) {
			log.debug("Request is not HTTP GET; intercept: no");
			return false;
		}

		if (isInResources(url)) {
			log.debug("request is for a (static) resource; intercept: no");
			return false;
		}

		final List<String> whiteList = prerenderConfig.getWhitelist();
		if (whiteList != null && !isInWhiteList(url, whiteList)) {
			log.debug("Whitelist is enabled, but this request is not listed; intercept: no");
			return false;
		}

		final List<String> blacklist = prerenderConfig.getBlacklist();
		if (blacklist != null && isInBlackList(url, referer, blacklist)) {
			log.debug("Blacklist is enabled, and this request is listed; intercept: no");
			return false;
		}

		log.debug("Parameter map " + request.getParameterMap());
		if (hasEscapedFragment(request)) {
			log.debug("Request Has _escaped_fragment_; intercept: yes");
			return true;
		}

		if (StringUtils.isNullOrEmpty(userAgent)) {
			log.debug("Request has blank userAgent; intercept: no");
			return false;
		}

		if (!isInSearchUserAgent(userAgent)) {
			log.debug("Request User-Agent is not a search bot; intercept: no");
			return false;
		}

		log.debug(String.format("Defaulting to request intercept(user-agent=%s): yes", userAgent));
		return true;
	}

	protected HttpGet getHttpGet(String apiUrl) {
		return new HttpGet(apiUrl);
	}

	protected CloseableHttpClient getHttpClient() {
		return prerenderConfig.getHttpClient();
	}

	/**
	 * Copy request headers from the servlet client to the proxy request.
	 *
	 * @throws java.net.URISyntaxException
	 */
	private void copyRequestHeaders(HttpServletRequest servletRequest, HttpRequest proxyRequest)
			throws URISyntaxException {
		// Get an Enumeration of all of the header names sent by the client
		Enumeration<?> enumerationOfHeaderNames = servletRequest.getHeaderNames();
		while (enumerationOfHeaderNames.hasMoreElements()) {
			String headerName = (String) enumerationOfHeaderNames.nextElement();
			// Instead the content-length is effectively set via
			// InputStreamEntity
			if (!headerName.equalsIgnoreCase(CONTENT_LENGTH) && !hopByHopHeaders.containsHeader(headerName)) {
				Enumeration<?> headers = servletRequest.getHeaders(headerName);
				while (headers.hasMoreElements()) {// sometimes more than one
													// value
					String headerValue = (String) headers.nextElement();
					// In case the proxy host is running multiple virtual
					// servers,
					// rewrite the Host header to ensure that we get content
					// from
					// the correct virtual server
					if (headerName.equalsIgnoreCase(HOST)) {
						HttpHost host = URIUtils.extractHost(new URI(prerenderConfig.getPrerenderServiceUrl()));
						headerValue = host.getHostName();
						if (host.getPort() != -1) {
							headerValue += ":" + host.getPort();
						}
					}
					proxyRequest.addHeader(headerName, headerValue);
				}
			}
		}
	}

	private String getRequestURL(HttpServletRequest request) {
		if (prerenderConfig.getForwardedURLHeader() != null) {
			String url = request.getHeader(prerenderConfig.getForwardedURLHeader());
			if (url != null) { return url; }
		}
		return request.getRequestURL().toString();
	}

	private String getApiUrl(String url) {
		String prerenderServiceUrl = prerenderConfig.getPrerenderServiceUrl();
		if (!prerenderServiceUrl.endsWith("/")) {
			prerenderServiceUrl += "/";
		}
		return prerenderServiceUrl + url;
	}

	/**
	 * Copy proxied response headers back to the servlet client.
	 */
	private void copyResponseHeaders(HttpResponse proxyResponse, final HttpServletResponse servletResponse) {
		servletResponse.setCharacterEncoding(getContentCharSet(proxyResponse.getEntity()));
		from(Arrays.asList(proxyResponse.getAllHeaders())).filter(new Predicate<Header>() {
			@Override
			public boolean apply(Header header) {
				return !hopByHopHeaders.containsHeader(header.getName());
			}
		}).transform(new Function<Header, Boolean>() {
			@Override
			public Boolean apply(Header header) {
				servletResponse.addHeader(header.getName(), header.getValue());
				return true;
			}
		}).toList();
	}

	/**
	 * Get the charset used to encode the http entity.
	 */
	private String getContentCharSet(final HttpEntity entity) throws ParseException {
		if (entity == null) { return null; }
		String charset = null;
		if (entity.getContentType() != null) {
			HeaderElement values[] = entity.getContentType().getElements();
			if (values.length > 0) {
				NameValuePair param = values[0].getParameterByName("charset");
				if (param != null) {
					charset = param.getValue();
				}
			}
		}
		return charset;
	}

	private String getResponseHtml(HttpResponse proxyResponse) throws IOException {
		HttpEntity entity = proxyResponse.getEntity();
		return entity != null ? EntityUtils.toString(entity) : "";
	}

	/**
	 * Copy response body data (the entity) from the proxy to the servlet
	 * client.
	 */
	private void responseEntity(String html, HttpServletResponse servletResponse) throws IOException {
		PrintWriter printWriter = servletResponse.getWriter();
		try {
			printWriter.write(html);
			printWriter.flush();
		}
		finally {
			closeQuietly(printWriter);
		}
	}

	protected void closeQuietly(Closeable closeable) {
		try {
			if (closeable != null) {
				closeable.close();
			}
		}
		catch (IOException e) {
			log.error("Close proxy error", e);
		}
	}

	private boolean hasEscapedFragment(HttpServletRequest request) {
		return request.getParameterMap().containsKey(ESCAPED_FRAGMENT_KEY);
	}

	private boolean isInBlackList(final String url, final String referer, List<String> blacklist) {
		return from(blacklist).anyMatch(new Predicate<String>() {
			@Override
			public boolean apply(String regex) {
				final Pattern pattern = Pattern.compile(regex);
				return pattern.matcher(url).matches() || !StringUtils.isNullOrEmpty(referer)
						&& pattern.matcher(referer).matches();
			}
		});
	}

	private boolean isInSearchUserAgent(final String userAgent) {
		return from(prerenderConfig.getCrawlerUserAgents()).anyMatch(new Predicate<String>() {
			@Override
			public boolean apply(String item) {
				return userAgent.toLowerCase().contains(item.toLowerCase());
			}
		});
	}

	private boolean isInResources(final String url) {
		return from(prerenderConfig.getExtensionsToIgnore()).anyMatch(new Predicate<String>() {
			@Override
			public boolean apply(String item) {
				return (url.indexOf('?') >= 0 ? url.substring(0, url.indexOf('?')) : url).toLowerCase().endsWith(item);
			}
		});
	}

	private boolean isInWhiteList(final String url, List<String> whitelist) {
		return from(whitelist).anyMatch(new Predicate<String>() {
			@Override
			public boolean apply(String regex) {
				return Pattern.compile(regex).matcher(url).matches();
			}
		});
	}

	private boolean beforeRender(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if (preRenderEventHandler != null) {
			final String html = preRenderEventHandler.beforeRender(request);
			if (!StringUtils.isNullOrEmpty(html)) {
				final PrintWriter writer = response.getWriter();
				writer.write(html);
				writer.flush();
				closeQuietly(writer);
				return true;
			}
		}
		return false;
	}

	private boolean proxyPrerenderedPageResponse(HttpServletRequest request, HttpServletResponse response)
			throws IOException, URISyntaxException {
		final String apiUrl = getApiUrl(getFullUrl(request));
		log.debug(String.format("Prerender proxy will send request to:%s", apiUrl));
		final HttpGet getMethod = getHttpGet(apiUrl);
		copyRequestHeaders(request, getMethod);
		withPrerenderToken(getMethod);
		CloseableHttpResponse prerenderServerResponse = null;

		try {
			prerenderServerResponse = httpClient.execute(getMethod);
			response.setStatus(prerenderServerResponse.getStatusLine().getStatusCode());
			copyResponseHeaders(prerenderServerResponse, response);
			String html = getResponseHtml(prerenderServerResponse);
			html = afterRender(request, response, prerenderServerResponse, html);
			responseEntity(html, response);
			return true;
		}
		finally {
			closeQuietly(prerenderServerResponse);
		}
	}

	private String afterRender(HttpServletRequest clientRequest, HttpServletResponse clientResponse,
			CloseableHttpResponse prerenderServerResponse, String responseHtml) {
		if (preRenderEventHandler != null) { return preRenderEventHandler.afterRender(clientRequest, clientResponse,
				prerenderServerResponse, responseHtml); }
		return responseHtml;
	}

	private void withPrerenderToken(HttpRequest proxyRequest) {
		final String token = prerenderConfig.getPrerenderToken();
		// for new version prerender with token.
		if (!StringUtils.isNullOrEmpty(token)) {
			proxyRequest.addHeader("X-Prerender-Token", token);
		}
	}

	private String getFullUrl(HttpServletRequest request) {
		final String url = getRequestURL(request);
		final String queryString = request.getQueryString();
		return !StringUtils.isNullOrEmpty(queryString) ? String.format("%s?%s", url, queryString) : url;
	}
}