package com.smartagri.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

/**
 * Lightweight principal built entirely from verified JWT claims - no DB
 * lookup. Populated by JwtAuthenticationFilter in every downstream service.
 */
@Getter
public class UserPrincipal {

    private final Long id;
    private final String email;
    private final String name;
    private final String role;

    public UserPrincipal(Long id, String email, String name, String role) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}
