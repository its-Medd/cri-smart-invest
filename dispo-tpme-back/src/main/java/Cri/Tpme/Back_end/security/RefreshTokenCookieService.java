package Cri.Tpme.Back_end.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Component
public class RefreshTokenCookieService {

    @Value("${app.auth.refresh-cookie-name:refreshToken}")
    private String cookieName;

    @Value("${app.auth.refresh-cookie-path:/api/auth}")
    private String cookiePath;

    @Value("${app.auth.refresh-cookie-secure:false}")
    private boolean secureCookie;

    @Value("${app.auth.refresh-cookie-same-site:Lax}")
    private String sameSite;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    public String getCookieName() {
        return cookieName;
    }

    public ResponseCookie createCookie(String refreshToken) {
        return ResponseCookie.from(cookieName, refreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .path(cookiePath)
                .sameSite(sameSite)
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .build();
    }

    public ResponseCookie clearCookie() {
        return ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(secureCookie)
                .path(cookiePath)
                .sameSite(sameSite)
                .maxAge(Duration.ZERO)
                .build();
    }

    public String readCookieValue(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        Optional<Cookie> refreshCookie = Arrays.stream(cookies)
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .findFirst();
        return refreshCookie.map(Cookie::getValue).orElse(null);
    }
}
