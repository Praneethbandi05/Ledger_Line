package com.ledgerline.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("RateLimitingFilter - Unit Tests")
class RateLimitingFilterTest {

    private RateLimitingFilter rateLimitingFilter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitingFilter = new RateLimitingFilter();
        ReflectionTestUtils.setField(rateLimitingFilter, "enabled", true);
        ReflectionTestUtils.setField(rateLimitingFilter, "authLimit", 5);
        ReflectionTestUtils.setField(rateLimitingFilter, "financialLimit", 10);
        ReflectionTestUtils.setField(rateLimitingFilter, "generalLimit", 20);

        filterChain = mock(FilterChain.class);
    }

    @Test
    @DisplayName("Allows requests within the threshold")
    void shouldAllowRequestsWithinLimit() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("192.168.1.100");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(request, response, filterChain);

        assertEquals(200, response.getStatus());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("Blocks requests exceeding threshold with HTTP 429")
    void shouldBlockExcessiveRequestsWith429() throws ServletException, IOException {
        String clientIp = "192.168.1.200";

        // Consume all 5 allowed requests for auth
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitingFilter.doFilter(req, res, filterChain);
            assertEquals(200, res.getStatus());
        }

        // 6th request must be rejected with 429
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(blockedReq, blockedRes, filterChain);

        assertEquals(429, blockedRes.getStatus());
        assertEquals("60", blockedRes.getHeader("Retry-After"));
        assertTrue(blockedRes.getContentAsString().contains("Too Many Requests"));
        verify(filterChain, times(5)).doFilter(any(), any());
    }

    @Test
    @DisplayName("Bypasses OPTIONS requests and health checks")
    void shouldBypassOptionsAndHealthChecks() throws ServletException, IOException {
        MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/v1/transactions/transfer");
        MockHttpServletResponse optionsRes = new MockHttpServletResponse();
        rateLimitingFilter.doFilter(optionsReq, optionsRes, filterChain);
        verify(filterChain, times(1)).doFilter(optionsReq, optionsRes);

        MockHttpServletRequest healthReq = new MockHttpServletRequest("GET", "/api/v1/health");
        MockHttpServletResponse healthRes = new MockHttpServletResponse();
        rateLimitingFilter.doFilter(healthReq, healthRes, filterChain);
        verify(filterChain, times(1)).doFilter(healthReq, healthRes);
    }
}
