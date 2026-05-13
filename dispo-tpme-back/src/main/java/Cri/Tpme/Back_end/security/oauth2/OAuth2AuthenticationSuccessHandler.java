package Cri.Tpme.Back_end.security.oauth2;

import Cri.Tpme.Back_end.security.JwtTokenProvider;
import Cri.Tpme.Back_end.service.RefreshTokenService;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider   tokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.oauth2.authorized-redirect-uri}")
    private String authorizedRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest  request,
                                        HttpServletResponse response,
                                        Authentication      authentication) throws IOException {
        if (response.isCommitted()) return;

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email          = oAuth2User.getAttribute("email");
        String accessToken    = tokenProvider.generateTokenFromEmail(email);
        String refreshToken   = refreshTokenService.createRefreshToken(email).getToken();

        String redirectUrl = UriComponentsBuilder.fromUriString(authorizedRedirectUri)
                .queryParam("token",        accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
