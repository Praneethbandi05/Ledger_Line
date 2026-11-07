package com.ledgerline.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerline.entity.Account;
import com.ledgerline.entity.User;
import com.ledgerline.repository.AccountRepository;
import com.ledgerline.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String aliceToken;
    private String bobToken;
    private String adminToken;
    private String auditorToken;

    private Long aliceAccountId;
    private Long bobAccountId;

    @BeforeEach
    void setUp() {
        User alice = userRepository.findByUsername("alice").orElseThrow();
        User bob = userRepository.findByUsername("bob").orElseThrow();
        User admin = userRepository.findByUsername("admin").orElseThrow();
        User auditor = userRepository.findByUsername("auditor").orElseThrow();

        aliceToken = jwtTokenProvider.generateTokenFromUser(alice);
        bobToken = jwtTokenProvider.generateTokenFromUser(bob);
        adminToken = jwtTokenProvider.generateTokenFromUser(admin);
        auditorToken = jwtTokenProvider.generateTokenFromUser(auditor);

        Account aliceAccount = accountRepository.findByAccountNumber("ACC-ALICE-01").orElseThrow();
        Account bobAccount = accountRepository.findByAccountNumber("ACC-BOB-01").orElseThrow();

        aliceAccountId = aliceAccount.getId();
        bobAccountId = bobAccount.getId();
    }

    @Test
    @DisplayName("Unauthenticated Request - accessing protected endpoint without token must return 401 Unauthorized")
    void shouldRejectUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/api/v1/accounts/my"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Authorized Customer - Alice can access her own account details")
    void shouldAllowCustomerToAccessOwnAccount() throws Exception {
        mockMvc.perform(get("/api/v1/accounts/" + aliceAccountId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value("ACC-ALICE-01"))
                .andExpect(jsonPath("$.data.ownerUsername").value("alice"));
    }

    @Test
    @DisplayName("IDOR Prevention - Customer Alice attempting to access Bob's account must return 403 Forbidden")
    void shouldPreventCustomerFromAccessingAnotherCustomerAccount() throws Exception {
        // Alice attempts to access Bob's account
        mockMvc.perform(get("/api/v1/accounts/" + bobAccountId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message", containsString("You do not have ownership of account ACC-BOB-01")));
    }

    @Test
    @DisplayName("Account Boundary - Customer Alice can only see her own accounts in account list")
    void shouldReturnOnlyOwnedAccountsForCustomer() throws Exception {
        mockMvc.perform(get("/api/v1/accounts/my")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[*].ownerUsername", everyItem(is("alice"))));
    }

    @Test
    @DisplayName("Privilege Escalation Prevention - Customer Alice accessing Admin API must return 403 Forbidden")
    void shouldPreventCustomerFromAccessingAdminApis() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Admin Role - Admin can access admin management APIs")
    void shouldAllowAdminToAccessAdminApis() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(4))));
    }

    @Test
    @DisplayName("Auditor Read-Only - Auditor can read account details across customers")
    void shouldAllowAuditorToReadAccountDetails() throws Exception {
        mockMvc.perform(get("/api/v1/accounts/" + aliceAccountId)
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value("ACC-ALICE-01"));
    }

    @Test
    @DisplayName("Auditor Financial Restriction - Auditor attempting financial operation must return 403 Forbidden")
    void shouldPreventAuditorFromExecutingFinancialOperations() throws Exception {
        // Auditor attempts to perform financial operation on Alice's account
        mockMvc.perform(post("/api/v1/accounts/" + aliceAccountId + "/financial-operation-check")
                        .header("Authorization", "Bearer " + auditorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message", containsString("Auditors hold strictly read-only permissions")));
    }
}
