package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.dto.*;
import Cri.Tpme.Back_end.security.RefreshTokenCookieService;
import Cri.Tpme.Back_end.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenCookieService refreshTokenCookieService;

    // ── POST /api/auth/register ───────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return withRefreshCookie(ResponseEntity.status(HttpStatus.CREATED), response);
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return withRefreshCookie(ResponseEntity.ok(), response);
    }

    // ── POST /api/auth/admin/login ────────────────────────────────────────────
    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        AuthResponse response = authService.adminLogin(request.getUsername(), request.getPassword());
        return withRefreshCookie(ResponseEntity.ok(), response);
    }

    // ── POST /api/auth/refresh ────────────────────────────────────────────────
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        String refreshToken = refreshTokenCookieService.readCookieValue(request);
        AuthResponse response = authService.refreshToken(refreshToken);
        return withRefreshCookie(ResponseEntity.ok(), response);
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletResponse response) {
        authService.logout(userDetails.getUsername());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookieService.clearCookie().toString());
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }

    // ── GET  /api/auth/me ─────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> me(
            @AuthenticationPrincipal UserDetails userDetails) {
        // Re-use UserDto (no tokens needed here)
        Cri.Tpme.Back_end.entity.User user =
                authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(new AuthResponse.UserDto(user));
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(ResponseEntity.BodyBuilder builder,
                                                           AuthResponse response) {
        return builder
                .header(HttpHeaders.SET_COOKIE,
                        refreshTokenCookieService.createCookie(response.getRefreshToken()).toString())
                .body(response);
    }
}
