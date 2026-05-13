package Cri.Tpme.Back_end.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    // ── Key ───────────────────────────────────────────────────────────────────
    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // ── Generate ──────────────────────────────────────────────────────────────
    public String generateToken(Authentication auth) {
        return build(((UserDetails) auth.getPrincipal()).getUsername());
    }

    public String generateTokenFromEmail(String email) {
        return build(email);
    }

    private String build(String subject) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);
        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key())
                .compact();
    }

    // ── Parse ─────────────────────────────────────────────────────────────────
    public String getEmailFromToken(String token) {
        return Jwts.parser().verifyWith(key()).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    // ── Validate ──────────────────────────────────────────────────────────────
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException   e) { log.warn("Invalid JWT: {}",    e.getMessage()); }
        catch   (ExpiredJwtException     e) { log.warn("Expired JWT: {}",    e.getMessage()); }
        catch   (UnsupportedJwtException e) { log.warn("Unsupported JWT: {}", e.getMessage()); }
        catch   (IllegalArgumentException e){ log.warn("Empty JWT claims: {}", e.getMessage()); }
        return false;
    }
}
