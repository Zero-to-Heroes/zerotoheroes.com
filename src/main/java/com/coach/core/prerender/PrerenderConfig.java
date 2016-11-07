package com.coach.core.prerender;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.http.HttpHost;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.DefaultProxyRoutePlanner;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;

import com.amazonaws.util.StringUtils;
import com.google.common.collect.Lists;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PrerenderConfig {
	public static final String PRERENDER_IO_SERVICE_URL = "http://service.prerender.io/";
	private final Map<String, String> config;

	public PrerenderConfig(Map<String, String> config) {
		this.config = config;
	}

	public PreRenderEventHandler getEventHandler() {
		final String preRenderEventHandler = config.get("preRenderEventHandler");
		if (!StringUtils.isNullOrEmpty(preRenderEventHandler)) {
			try {
				return (PreRenderEventHandler) Class.forName(preRenderEventHandler).newInstance();
			}
			catch (Exception e) {
				log.error("PreRenderEventHandler class not find or can not new a instance", e);
			}
		}
		return null;
	}

	public CloseableHttpClient getHttpClient() {
		HttpClientBuilder builder = HttpClients.custom().setConnectionManager(new PoolingHttpClientConnectionManager())
				.disableRedirectHandling();

		configureProxy(builder);
		configureTimeout(builder);
		return builder.build();
	}

	private HttpClientBuilder configureProxy(HttpClientBuilder builder) {
		final String proxy = config.get("proxy");
		if (!StringUtils.isNullOrEmpty(proxy)) {
			final int proxyPort = Integer.parseInt(config.get("proxyPort"));
			DefaultProxyRoutePlanner routePlanner = new DefaultProxyRoutePlanner(new HttpHost(proxy, proxyPort));
			builder.setRoutePlanner(routePlanner);
		}
		return builder;
	}

	private HttpClientBuilder configureTimeout(HttpClientBuilder builder) {
		final String socketTimeout = getSocketTimeout();
		if (socketTimeout != null) {
			RequestConfig config = RequestConfig.custom().setSocketTimeout(Integer.parseInt(socketTimeout)).build();
			builder.setDefaultRequestConfig(config);
		}
		return builder;
	}

	public String getSocketTimeout() {
		return config.get("socketTimeout");
	}

	public String getPrerenderToken() {
		return config.get("prerenderToken");
	}

	public String getForwardedURLHeader() {
		return config.get("forwardedURLHeader");
	}

	public List<String> getCrawlerUserAgents() {
		List<String> crawlerUserAgents = Lists.newArrayList("baiduspider", "facebookexternalhit", "twitterbot",
				"rogerbot", "linkedinbot", "embedly", "quora link preview", "showyoubo", "outbrain", "pinterest",
				"pinterest/0.", "developers.google.com/+/web/snippet", "slackbot", "vkShare", "W3C_Validator",
				"redditbot", "Applebot", "WhatsApp", "flipboard", "tumblr", "bitlybot", "SkypeUriPreview", "nuzzel",
				"Discordbot");
		final String crawlerUserAgentsFromConfig = config.get("crawlerUserAgents");
		if (!StringUtils.isNullOrEmpty(crawlerUserAgentsFromConfig)) {
			crawlerUserAgents.addAll(Arrays.asList(crawlerUserAgentsFromConfig.trim().split(",")));
		}

		return crawlerUserAgents;
	}

	public List<String> getExtensionsToIgnore() {
		List<String> extensionsToIgnore = Lists.newArrayList(".js", ".json", ".css", ".xml", ".less", ".png", ".jpg",
				".jpeg", ".gif", ".pdf", ".doc", ".txt", ".ico", ".rss", ".zip", ".mp3", ".rar", ".exe", ".wmv", ".doc",
				".avi", ".ppt", ".mpg", ".mpeg", ".tif", ".wav", ".mov", ".psd", ".ai", ".xls", ".mp4", ".m4a", ".swf",
				".dat", ".dmg", ".iso", ".flv", ".m4v", ".torrent", ".woff", ".ttf");
		final String extensionsToIgnoreFromConfig = config.get("extensionsToIgnore");
		if (!StringUtils.isNullOrEmpty(extensionsToIgnoreFromConfig)) {
			extensionsToIgnore.addAll(Arrays.asList(extensionsToIgnoreFromConfig.trim().split(",")));
		}

		return extensionsToIgnore;
	}

	public List<String> getWhitelist() {
		final String whitelist = config.get("whitelist");
		if (!StringUtils.isNullOrEmpty(whitelist)) { return Arrays.asList(whitelist.trim().split(",")); }
		return null;
	}

	public List<String> getBlacklist() {
		final String blacklist = config.get("blacklist");
		if (!StringUtils.isNullOrEmpty(blacklist)) { return Arrays.asList(blacklist.trim().split(",")); }
		return null;
	}

	public String getPrerenderServiceUrl() {
		final String prerenderServiceUrl = config.get("prerenderServiceUrl");
		return !StringUtils.isNullOrEmpty(prerenderServiceUrl) ? prerenderServiceUrl
				: getDefaultPrerenderIoServiceUrl();
	}

	private String getDefaultPrerenderIoServiceUrl() {
		final String prerenderServiceUrlInEnv = System.getProperty("PRERENDER_SERVICE_URL");
		return !StringUtils.isNullOrEmpty(prerenderServiceUrlInEnv) ? prerenderServiceUrlInEnv
				: PRERENDER_IO_SERVICE_URL;
	}
}