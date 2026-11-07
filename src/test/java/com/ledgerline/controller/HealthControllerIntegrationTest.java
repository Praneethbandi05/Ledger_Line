package com.ledgerline.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/health - should return 200 OK and UP status")
    void shouldReturnHealthStatusUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("ledgerline-backend"))
                .andExpect(jsonPath("$.components.database.status").value("UP"))
                .andExpect(jsonPath("$.components.runtime.javaVersion").isNotEmpty())
                .andExpect(jsonPath("$.components.memory.totalMb").isNumber());
    }

    @Test
    @DisplayName("GET /api/v1/health/db - should return 200 OK and database metadata")
    void shouldReturnDatabaseHealth() throws Exception {
        mockMvc.perform(get("/api/v1/health/db"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.database").isNotEmpty())
                .andExpect(jsonPath("$.data.validationQuery").value("SELECT 1 (SUCCESS)"));
    }

    @Test
    @DisplayName("POST /api/v1/health/validate-sample - should accept valid request")
    void shouldAcceptValidRequest() throws Exception {
        String payload = """
            {
                "accountNumber": "ACC-100234",
                "amount": 250.50
            }
            """;

        mockMvc.perform(post("/api/v1/health/validate-sample")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountNumber").value("ACC-100234"))
                .andExpect(jsonPath("$.data.amount").value(250.50));
    }

    @Test
    @DisplayName("POST /api/v1/health/validate-sample - should reject negative amount and blank account")
    void shouldRejectInvalidPayload() throws Exception {
        String invalidPayload = """
            {
                "accountNumber": "",
                "amount": -50.00
            }
            """;

        mockMvc.perform(post("/api/v1/health/validate-sample")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.validationErrors", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("POST /api/v1/health/validate-sample - should reject zero amount")
    void shouldRejectZeroAmount() throws Exception {
        String zeroAmountPayload = """
            {
                "accountNumber": "ACC-9999",
                "amount": 0.00
            }
            """;

        mockMvc.perform(post("/api/v1/health/validate-sample")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(zeroAmountPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors[?(@.field == 'amount')].message").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/v1/health/validate-sample - should reject malformed JSON syntax")
    void shouldRejectMalformedJson() throws Exception {
        String malformedJson = "{ accountNumber: 'ACC-123', amount: }";

        mockMvc.perform(post("/api/v1/health/validate-sample")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Malformed JSON"));
    }

    @Test
    @DisplayName("DELETE /api/v1/health - should return 405 Method Not Allowed")
    void shouldReturn405ForUnsupportedMethod() throws Exception {
        mockMvc.perform(delete("/api/v1/health"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.error").value("Method Not Allowed"));
    }
}
