package Cri.Tpme.Back_end.service;

import Cri.Tpme.Back_end.dto.*;
import Cri.Tpme.Back_end.entity.RefreshToken;
import Cri.Tpme.Back_end.entity.User;
import Cri.Tpme.Back_end.repository.UserRepository;
import Cri.Tpme.Back_end.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtTokenProvider      tokenProvider;
    private final RefreshTokenService   refreshTokenService;

    // ── Register ──────────────────────────────────────────────────────────────
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(User.AuthProvider.LOCAL)
                .build();
        userRepository.save(user);

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        String accessToken   = tokenProvider.generateToken(auth);
        RefreshToken refresh = refreshTokenService.createRefreshToken(user.getEmail());
        return new AuthResponse(accessToken, refresh.getToken(), user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        String accessToken   = tokenProvider.generateToken(auth);
        User   user          = userRepository.findByEmail(request.getEmail()).orElseThrow();
        RefreshToken refresh = refreshTokenService.createRefreshToken(user.getEmail());
        return new AuthResponse(accessToken, refresh.getToken(), user);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────
    public AuthResponse refreshToken(String requestToken) {
        if (requestToken == null || requestToken.isBlank()) {
            throw new BadCredentialsException("Refresh token is missing");
        }
        RefreshToken refreshToken = refreshTokenService.findByToken(requestToken);
        refreshTokenService.verifyExpiration(refreshToken);
        User   user        = refreshToken.getUser();
        String accessToken = tokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthResponse(accessToken, requestToken, user);
    }

    // ── Admin Login ───────────────────────────────────────────────────────────
    public AuthResponse adminLogin(String username, String password) {
        if (!"admin".equals(username)) {
            throw new BadCredentialsException("Access denied: admin only");
        }
        User admin = userRepository.findByEmail("admin@cri.local")
                .orElseThrow(() -> new UsernameNotFoundException("Admin user not configured"));
        if (admin.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("Access denied: admin only");
        }
        if (!passwordEncoder.matches(password, admin.getPassword())) {
            throw new BadCredentialsException("Access denied: admin only");
        }
        String accessToken   = tokenProvider.generateTokenFromEmail(admin.getEmail());
        RefreshToken refresh = refreshTokenService.createRefreshToken(admin.getEmail());
        return new AuthResponse(accessToken, refresh.getToken(), admin);
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    @Transactional
    public void logout(String email) {
        refreshTokenService.deleteByUser(email);
    }

    // ── Get Current User ──────────────────────────────────────────────────────
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
