package com.ledgerline.controller;

import com.ledgerline.dto.ApiResponse;
import com.ledgerline.dto.auth.AuthResponse;
import com.ledgerline.dto.auth.LoginRequest;
import com.ledgerline.dto.auth.RegisterRequest;
import com.ledgerline.dto.auth.UserProfileResponse;
import com.ledgerline.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully as CUSTOMER", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        authService.logout(authorizationHeader);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully; token invalidated", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser() {
        UserProfileResponse profile = authService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved", profile));
    }
}
