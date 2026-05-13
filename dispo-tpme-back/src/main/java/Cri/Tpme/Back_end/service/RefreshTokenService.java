package Cri.Tpme.Back_end.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Cri.Tpme.Back_end.entity.RefreshToken;
import Cri.Tpme.Back_end.entity.User;
import Cri.Tpme.Back_end.exception.TokenRefreshException;
import Cri.Tpme.Back_end.repository.RefreshTokenRepository;
import Cri.Tpme.Back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository         userRepository;

    // ── Create (or rotate) ────────────────────────────────────────────────────
    /*@Transactional
    public RefreshToken createRefreshToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Delete existing token for this user (one-token-per-user policy)
        refreshTokenRepository.deleteByUser(user);

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshExpirationMs))
                .build();

        return refreshTokenRepository.save(token); }*/
    @Transactional
public RefreshToken createRefreshToken(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

    RefreshToken token = refreshTokenRepository.findByUser(user)
            .orElse(new RefreshToken());

    token.setUser(user);
    token.setToken(UUID.randomUUID().toString());
    token.setExpiryDate(Instant.now().plusMillis(refreshExpirationMs));

    return refreshTokenRepository.save(token);
}

    // ── Verify ────────────────────────────────────────────────────────────────
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException(token.getToken(),
                    "Refresh token has expired. Please sign in again.");
        }
        return token;
    }

    // ── Find ──────────────────────────────────────────────────────────────────
    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new TokenRefreshException(token, "Token not found"));
    }

    // ── Delete (logout) ───────────────────────────────────────────────────────
    @Transactional
    public void deleteByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        refreshTokenRepository.deleteByUser(user);
    }
}
