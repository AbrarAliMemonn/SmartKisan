package com.smartagri.security;

import com.smartagri.entity.Role;
import com.smartagri.entity.User;
import com.smartagri.entity.UserType;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Spring Security principal wrapping our {@link User} entity.
 * Exposes the user id/role so controllers can use @AuthenticationPrincipal.
 * Grants authorities for both the security-level {@link Role} (ADMIN/USER)
 * and the business-level {@link UserType} (ADMIN/FARMER), matching
 * the downstream services' lightweight JWT-based UserPrincipal.
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String name;
    private final String passwordHash;
    private final Role role;
    private final UserType userType;
    private final boolean seller;
    private final boolean enabled;
    private final boolean suspended;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.passwordHash = user.getPasswordHash();
        this.role = user.getRole();
        this.userType = user.getUserType();
        this.seller = user.isSeller();
        this.enabled = user.isEnabled();
        this.suspended = user.isSuspended();
    }

    public static UserPrincipal create(User user) {
        return new UserPrincipal(user);
    }

    public boolean hasSellerProfile() {
        return seller;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        if (userType != null) authorities.add(new SimpleGrantedAuthority("ROLE_" + userType.name()));
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return !suspended; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return enabled; }
}
