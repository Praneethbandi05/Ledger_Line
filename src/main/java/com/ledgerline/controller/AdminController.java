package com.ledgerline.controller;

import com.ledgerline.dto.ApiResponse;
import com.ledgerline.dto.auth.UserProfileResponse;
import com.ledgerline.entity.User;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> users = userRepository.findAll()
                .stream()
                .map(u -> new UserProfileResponse(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getRole()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Users retrieved for admin", users));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<UserProfileResponse>> toggleUserStatus(
            @PathVariable Long userId,
            @RequestParam boolean enabled) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setEnabled(enabled);
        User saved = userRepository.save(user);

        UserProfileResponse profile = new UserProfileResponse(
                saved.getId(), saved.getUsername(), saved.getEmail(), saved.getFullName(), saved.getRole());

        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", profile));
    }
}
