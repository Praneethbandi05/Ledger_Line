package com.ledgerline.controller;

import com.ledgerline.dto.ApiResponse;
import com.ledgerline.dto.HealthResponse;
import com.ledgerline.dto.ValidationSampleRequest;
import com.ledgerline.service.DatabaseHealthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final DatabaseHealthService databaseHealthService;

    public HealthController(DatabaseHealthService databaseHealthService) {
        this.databaseHealthService = databaseHealthService;
    }

    @GetMapping
    public ResponseEntity<HealthResponse> getSystemHealth() {
        Map<String, Object> dbHealth = databaseHealthService.checkDatabaseHealth();
        boolean isDbUp = "UP".equals(dbHealth.get("status"));

        Map<String, Object> components = new HashMap<>();
        components.put("database", dbHealth);
        components.put("memory", getMemoryStatus());
        components.put("runtime", Map.of(
                "javaVersion", System.getProperty("java.version"),
                "javaVendor", System.getProperty("java.vendor"),
                "os", System.getProperty("os.name") + " " + System.getProperty("os.arch")
        ));

        String overallStatus = isDbUp ? "UP" : "DEGRADED";
        HealthResponse response = new HealthResponse(overallStatus, "ledgerline-backend", components);

        return ResponseEntity.status(isDbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/db")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDatabaseHealth() {
        Map<String, Object> dbHealth = databaseHealthService.checkDatabaseHealth();
        boolean isDbUp = "UP".equals(dbHealth.get("status"));

        if (isDbUp) {
            return ResponseEntity.ok(ApiResponse.success("Database connection is healthy", dbHealth));
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ApiResponse<>(false, "Database connection is unavailable", dbHealth));
        }
    }

    @PostMapping("/validate-sample")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateSample(
            @Valid @RequestBody ValidationSampleRequest request) {

        Map<String, Object> result = new HashMap<>();
        result.put("accountNumber", request.getAccountNumber());
        result.put("amount", request.getAmount());
        result.put("validatedAt", Instant.now());

        return ResponseEntity.ok(ApiResponse.success("Payload successfully validated", result));
    }

    private Map<String, Object> getMemoryStatus() {
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();

        Map<String, Object> memory = new HashMap<>();
        memory.put("totalMb", totalMemory / (1024 * 1024));
        memory.put("freeMb", freeMemory / (1024 * 1024));
        memory.put("usedMb", (totalMemory - freeMemory) / (1024 * 1024));
        memory.put("maxMb", maxMemory / (1024 * 1024));
        return memory;
    }
}
