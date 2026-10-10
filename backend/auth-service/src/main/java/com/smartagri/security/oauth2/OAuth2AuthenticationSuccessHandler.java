package com.smartagri.security.oauth2;

import com.smartagri.entity.User;
import com.smartagri.repository.UserRepository;
import com.smartagri.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * On successful Google login, issues our own JWT (access + refresh) and
 * redirects the browser back to the React app with the token(s) as query
 * params, e.g. http://localhost:5173/oauth2/redirect?token=...&refreshToken=...
 * The frontend is expected to read these from the URL, store them the same
 * way it stores tokens after a normal /auth/login call, then route to the
 * dashboard.
 */
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = userRepository.findById(oAuth2User.getLocalUserId())
                .orElseThrow(() -> new IllegalStateException("OAuth2 user not found after provisioning"));

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getName(),
                user.getRole().name(), user.getUserType().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
