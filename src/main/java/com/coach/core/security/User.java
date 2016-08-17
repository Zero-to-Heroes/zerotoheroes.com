package com.coach.core.security;

import java.util.Date;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.userdetails.UserDetails;

import com.coach.coaches.CoachInformation;
import com.coach.profile.Superpowers;
import com.coach.reputation.UserReputation;
import com.coach.review.Review.Sport;
import com.coach.user.Stats;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@SuppressWarnings("serial")
@Getter
@Setter
@ToString
@Document
public class User implements UserDetails {

	public User() {
	}

	public User(String username) {
		this.username = username;
	}

	public User(String username, Date expires) {
		this.username = username;
		this.expires = expires.getTime();
	}

	@Id
	private String id;
	@Indexed
	private String username;
	private String password;
	@Indexed
	private String email;
	@CreatedDate
	private Date creationDate;
	private long expires;
	private boolean accountExpired;
	private boolean accountLocked;
	boolean credentialsExpired;
	private final boolean accountEnabled = true;
	private String newPassword;
	private Set<UserAuthority> authorities;
	private Date lastLoginDate;

	private String registerLocation;
	private int reputation;
	private String frame;
	private String preferredLanguage;
	private UserReputation explodedReputation;
	private Stats stats = new Stats();
	private boolean canEdit;
	private boolean betaTester;

	private CoachInformation coachInformation;
	private Superpowers powers = new Superpowers();

	@Override
	@JsonIgnore
	public String getPassword() {
		return password;
	}

	@JsonProperty
	public void setPassword(String password) {
		this.password = password;
	}

	@Override
	@JsonIgnore
	public Set<UserAuthority> getAuthorities() {
		return authorities;
	}

	// Use Roles as external API
	public Set<UserRole> getRoles() {
		Set<UserRole> roles = EnumSet.noneOf(UserRole.class);
		if (authorities != null) {
			for (UserAuthority authority : authorities) {
				roles.add(UserRole.valueOf(authority));
			}
		}
		return roles;
	}

	public void setRoles(Set<UserRole> roles) {
		for (UserRole role : roles) {
			grantRole(role);
		}
	}

	public void grantRole(UserRole role) {
		if (authorities == null) {
			authorities = new HashSet<UserAuthority>();
		}
		authorities.add(role.asAuthorityFor(this));
	}

	public void revokeRole(UserRole role) {
		if (authorities != null) {
			authorities.remove(role.asAuthorityFor(this));
		}
	}

	public boolean hasRole(UserRole role) {
		return authorities.contains(role.asAuthorityFor(this));
	}

	@Override
	@JsonIgnore
	public boolean isAccountNonExpired() {
		return !accountExpired;
	}

	@Override
	@JsonIgnore
	public boolean isAccountNonLocked() {
		return !accountLocked;
	}

	@Override
	@JsonIgnore
	public boolean isCredentialsNonExpired() {
		return !credentialsExpired;
	}

	@Override
	@JsonIgnore
	public boolean isEnabled() {
		return accountEnabled;
	}

	public void modifyReputation(Sport sport, int amount) {
		reputation += amount;
		if (explodedReputation == null) {
			explodedReputation = new UserReputation();
		}
		explodedReputation.modifyReputation(sport, amount);
	}

	public int getReputation(Sport sport) {
		if (explodedReputation == null) {
			explodedReputation = new UserReputation();
		}
		return explodedReputation.getReputation(sport);
	}

	public Stats getStats() {
		if (stats == null) {
			stats = new Stats();
		}
		return stats;
	}

	public boolean canEdit() {
		return canEdit;
	}

	public void addWatchedReview(String sport, String reviewId) {
		stats.addWatchedReview(sport, reviewId);
	}

	public void addPostedReview(String sport, String reviewId) {
		stats.addPostedReview(sport, reviewId);
	}

	public void addPostedComment(String sport, String reviewId) {
		stats.addPostedComment(sport, reviewId);
	}
}
