package com.ledgerline.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.dto.auth.LoginRequest;
import com.ledgerline.dto.auth.RegisterRequest;
import com.ledgerline.entity.User;
import com.ledgerline.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("Valid Login - should authenticate admin and return signed JWT token")
    void shouldAuthenticateWithValidCredentialsAndReturnJwt() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin", "Admin@12345");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.username").value("admin"))
                .andExpect(jsonPath("$.data.user.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Invalid Password - should reject login with 401 Unauthorized")
    void shouldRejectLoginWithInvalidPassword() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin", "WrongPassword!999");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    @DisplayName("Non-existent User - should reject login with 401 Unauthorized")
    void shouldRejectLoginWithNonExistentUser() throws Exception {
        LoginRequest loginRequest = new LoginRequest("ghostuser_999", "Password@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("User Registration - should register customer and auto-provision initial account")
    void shouldRegisterCustomerSuccessfully() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "charlie_new",
                "charlie@customer.com",
                "SecurePass@123",
                "Charlie Brown"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.username").value("charlie_new"))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"));

        User user = userRepository.findByUsername("charlie_new").orElseThrow();
        assertThat(user.getRole().name()).isEqualTo("CUSTOMER");
        // Verify password is encrypted with BCrypt
        assertThat(user.getPassword()).startsWith("$2a$");
    }

    @Test
    @DisplayName("Duplicate Registration - should reject already taken username")
    void shouldRejectDuplicateUsernameRegistration() throws Exception {
        RegisterRequest duplicate = new RegisterRequest(
                "alice",
                "alice_different@customer.com",
                "SecurePass@123",
                "Alice Clone"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", containsString("Username is already taken")));
    }

    @Test
    @DisplayName("Expired Token - should reject request with 401 Unauthorized")
    void shouldRejectExpiredToken() throws Exception {
        User user = userRepository.findByUsername("alice").orElseThrow();
        // Generate token with negative expiration (already expired)
        String expiredToken = jwtTokenProvider.generateTokenWithExpiry(user, -5000);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Invalid / Tampered Token - should reject request with 401 Unauthorized")
    void shouldRejectInvalidOrTamperedToken() throws Exception {
        String tamperedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiJ9.FAKE_SIGNATURE_DATA";

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Logout / Token Invalidation - should blacklist token and reject subsequent requests")
    void shouldInvalidateTokenOnLogout() throws Exception {
        LoginRequest loginRequest = new LoginRequest("bob", "Customer@123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).path("data").path("token").asText();

        // Verify token works initially
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("bob"));

        // Logout
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Subsequent request with the same token must be rejected with 401 Unauthorized
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
