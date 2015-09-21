package com.coach.core.security;

import java.util.Collection;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import org.springframework.security.core.GrantedAuthority;

@SuppressWarnings("serial")
@Getter
@Setter
@EqualsAndHashCode(of = "authority")
@ToString(of = "authority")
public class UserAuthority implements GrantedAuthority {

	private String authority;

	public static boolean isAnonymous(Collection<? extends GrantedAuthority> authorities) {
		boolean anonymous = true;
		for (GrantedAuthority grantedAuthority : authorities) {
			if (grantedAuthority != null && !"ROLE_ANONYMOUS".equals(grantedAuthority.getAuthority())) {
				anonymous = false;
				break;
			}
		}
		return anonymous;
	}

}
