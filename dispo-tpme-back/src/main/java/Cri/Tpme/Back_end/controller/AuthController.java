package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.dto.*;
import Cri.Tpme.Back_end.service.AuthService;
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

    // ── POST /api/auth/register ───────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // ── POST /api/auth/admin/login ────────────────────────────────────────────
    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(authService.adminLogin(request.getUsername(), request.getPassword()));
    }

    // ── POST /api/auth/refresh ────────────────────────────────────────────────
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
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
}
