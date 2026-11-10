package com.ledgerline.service;

import com.ledgerline.dto.auth.AuthResponse;
import com.ledgerline.dto.auth.ChangePasswordRequest;
import com.ledgerline.dto.auth.LoginRequest;
import com.ledgerline.dto.auth.RegisterRequest;
import com.ledgerline.dto.auth.UpdateProfileRequest;
import com.ledgerline.dto.auth.UserProfileResponse;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.User;
import com.ledgerline.enums.AccountType;
import com.ledgerline.enums.Role;
import com.ledgerline.exception.LedgerLineException;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.CustomUserDetails;
import com.ledgerline.security.JwtTokenProvider;
import com.ledgerline.security.SecurityContextHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final SecurityContextHelper securityContextHelper;
    private final AuditService auditService;

    public AuthService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider,
            TokenBlacklistService tokenBlacklistService,
            SecurityContextHelper securityContextHelper,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenBlacklistService = tokenBlacklistService;
        this.securityContextHelper = securityContextHelper;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new LedgerLineException("Username is already taken: " + username, HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByEmail(email)) {
            throw new LedgerLineException("Email is already registered: " + email, HttpStatus.BAD_REQUEST);
        }

        // STRICT SECURITY RULE: Registration enforces CUSTOMER role.
        // Prevents privilege escalation.
        User user = new User(
                username,
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                Role.CUSTOMER
        );

        User savedUser = userRepository.save(user);

        // Account onboarding workflow: Newly registered users onboard with 0 accounts
        // and must request an account for Administrator review & approval
        log.info("Registered new customer user {}", savedUser.getUsername());
        auditService.recordEvent(savedUser.getUsername(), savedUser.getRole().name(), "USER_REGISTER",
                "USER", savedUser.getUsername(), "SUCCESS", "Customer registered successfully awaiting account request");

        String token = jwtTokenProvider.generateTokenFromUser(savedUser);
        UserProfileResponse profile = new UserProfileResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getRole()
        );

        return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), profile);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername().trim(), request.getPassword())
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(authentication);

            UserProfileResponse profile = new UserProfileResponse(
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    userDetails.getFullName(),
                    userDetails.getRole()
            );

            log.info("User {} successfully authenticated with role {}", userDetails.getUsername(), userDetails.getRole());
            auditService.recordEvent(userDetails.getUsername(), userDetails.getRole().name(), "LOGIN_SUCCESS",
                    "AUTH", userDetails.getUsername(), "SUCCESS", "User authenticated successfully");

            return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), profile);
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for username: {}", request.getUsername());
            auditService.recordSecurityEvent(request.getUsername().trim(), "ANONYMOUS", "LOGIN_FAILED",
                    "AUTH", request.getUsername().trim(), "FAILURE", "Invalid credentials provided");
            throw new LedgerLineException("Invalid username or password", HttpStatus.UNAUTHORIZED);
        }
    }

    @Transactional
    public void logout(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                String username = jwtTokenProvider.getUsernameFromToken(token);
                tokenBlacklistService.blacklistToken(token);
                auditService.recordEvent(username, "USER", "LOGOUT",
                        "AUTH", username, "SUCCESS", "User logged out; JWT invalidated");
                log.info("User {} successfully logged out; token blacklisted", username);
            }
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        String username = securityContextHelper.getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new LedgerLineException("Authenticated user not found", HttpStatus.NOT_FOUND));

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        String username = securityContextHelper.getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new LedgerLineException("Authenticated user not found", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            auditService.recordSecurityEvent(username, user.getRole().name(), "PASSWORD_CHANGE_FAILED",
                    "AUTH", username, "FAILURE", "Current password does not match");
            throw new LedgerLineException("Current password does not match records", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.recordEvent(username, user.getRole().name(), "PASSWORD_CHANGE",
                "AUTH", username, "SUCCESS", "User changed account password successfully");
        log.info("User {} changed password successfully", username);
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        String username = securityContextHelper.getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new LedgerLineException("Authenticated user not found", HttpStatus.NOT_FOUND));

        user.setFullName(request.getFullName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        User saved = userRepository.save(user);

        auditService.recordEvent(username, user.getRole().name(), "PROFILE_UPDATE",
                "USER", username, "SUCCESS", "User updated profile information");

        return new UserProfileResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getFullName(),
                saved.getRole()
        );
    }

    private String generateUniqueAccountNumber() {
        SecureRandom random = new SecureRandom();
        String accountNumber;
        do {
            int randomPart = 10000000 + random.nextInt(90000000);
            accountNumber = "ACC-" + randomPart;
        } while (accountRepository.existsByAccountNumber(accountNumber));
        return accountNumber;
    }
}
