package com.coach.core.security;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import org.springframework.security.core.GrantedAuthority;

@Getter
@Setter
@EqualsAndHashCode(of = "authority")
@ToString(of = "authority")
public class UserAuthority implements GrantedAuthority {

	private static final long serialVersionUID = 1L;
	private String authority;

}
