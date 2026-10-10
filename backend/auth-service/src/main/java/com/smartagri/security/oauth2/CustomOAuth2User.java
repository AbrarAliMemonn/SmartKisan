package com.smartagri.security.oauth2;

import lombok.Getter;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

/** Wraps the default OAuth2User to carry our internal local user id along. */
@Getter
public class CustomOAuth2User implements OAuth2User {

    private final OAuth2User delegate;
    private final Long localUserId;

    public CustomOAuth2User(OAuth2User delegate, Long localUserId) {
        this.delegate = delegate;
        this.localUserId = localUserId;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }

    @Override
    public String getName() {
        return delegate.getName();
    }
}
