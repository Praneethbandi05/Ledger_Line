package com.ledgerline.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe, in-memory sliding-window rate limiting filter.
 * Defends against brute-force password cracking, credential stuffing, and API flooding/DoS attacks.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    @Value("${ledgerline.rate-limiting.enabled:true}")
    private boolean enabled;

    @Value("${ledgerline.rate-limiting.auth-limit:30}")
    private int authLimit;

    @Value("${ledgerline.rate-limiting.financial-limit:60}")
    private int financialLimit;

    @Value("${ledgerline.rate-limiting.general-limit:180}")
    private int generalLimit;

    private static final long WINDOW_MS = 60_000L; // 1-minute window

    private final ConcurrentHashMap<String, RequestBucket> buckets = new ConcurrentHashMap<>();
    private final AtomicInteger requestCounter = new AtomicInteger(0);

    public RateLimitingFilter() {
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!enabled || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String uri = request.getRequestURI();

        // Bypass health probes, actuator, and internal error dispatching
        if (uri.startsWith("/actuator") || uri.startsWith("/api/v1/health") || uri.startsWith("/error")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = extractClientIp(request);
        int limit = resolveLimit(uri);
        String bucketKey = resolveCategory(uri) + ":" + clientIp;

        long now = System.currentTimeMillis();
        RequestBucket bucket = buckets.computeIfAbsent(bucketKey, k -> new RequestBucket(now));

        if (!bucket.tryAcquire(limit, WINDOW_MS, now)) {
            log.warn("Rate limit exceeded for IP {} on endpoint {} (limit: {}/min)", clientIp, uri, limit);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");

            String jsonPayload = String.format(
                    "{\"success\":false,\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please wait a moment before retrying.\",\"path\":\"%s\",\"timestamp\":\"%s\"}",
                    escapeJson(uri),
                    Instant.now().toString()
            );

            response.getWriter().write(jsonPayload);
            return;
        }

        // Opportunistic periodic cleanup of expired buckets to prevent memory accumulation
        if (requestCounter.incrementAndGet() % 500 == 0 || buckets.size() > 5000) {
            cleanupExpiredBuckets(now);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveCategory(String uri) {
        if (uri.contains("/api/v1/auth/")) {
            return "AUTH";
        }
        if (uri.contains("/api/v1/transactions/")) {
            return "FINANCIAL";
        }
        return "GENERAL";
    }

    private int resolveLimit(String uri) {
        if (uri.contains("/api/v1/auth/")) {
            return authLimit;
        }
        if (uri.contains("/api/v1/transactions/")) {
            return financialLimit;
        }
        return generalLimit;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void cleanupExpiredBuckets(long now) {
        buckets.entrySet().removeIf(entry -> entry.getValue().isExpired(now, WINDOW_MS));
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static class RequestBucket {
        private final AtomicInteger counter = new AtomicInteger(0);
        private volatile long windowStart;

        public RequestBucket(long windowStart) {
            this.windowStart = windowStart;
        }

        public synchronized boolean tryAcquire(int limit, long windowDuration, long now) {
            if (now - windowStart >= windowDuration) {
                windowStart = now;
                counter.set(1);
                return true;
            }
            return counter.incrementAndGet() <= limit;
        }

        public boolean isExpired(long now, long windowDuration) {
            return (now - windowStart) > (windowDuration * 2);
        }
    }
}
