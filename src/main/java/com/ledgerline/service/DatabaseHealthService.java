package com.ledgerline.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.HashMap;
import java.util.Map;

@Service
public class DatabaseHealthService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseHealthService.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthService(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> checkDatabaseHealth() {
        Map<String, Object> dbHealth = new HashMap<>();
        long startTime = System.currentTimeMillis();

        try (Connection conn = dataSource.getConnection()) {
            boolean isValid = conn.isValid(2);
            long latencyMs = System.currentTimeMillis() - startTime;

            DatabaseMetaData metaData = conn.getMetaData();
            String productName = metaData.getDatabaseProductName();
            String productVersion = metaData.getDatabaseProductVersion();
            String url = metaData.getURL();

            // Run a quick probe query
            Integer probeResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

            dbHealth.put("status", (isValid && probeResult != null && probeResult == 1) ? "UP" : "DOWN");
            dbHealth.put("database", productName);
            dbHealth.put("version", productVersion);
            dbHealth.put("latencyMs", latencyMs);
            dbHealth.put("url", maskDbUrl(url));
            dbHealth.put("validationQuery", "SELECT 1 (SUCCESS)");
        } catch (DataAccessException dae) {
            long latencyMs = System.currentTimeMillis() - startTime;
            log.error("Database query probe failed: {}", dae.getMessage());
            dbHealth.put("status", "DOWN");
            dbHealth.put("latencyMs", latencyMs);
            dbHealth.put("error", "Database query execution failed: " + dae.getMostSpecificCause().getMessage());
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - startTime;
            log.error("Database connection probe failed: {}", e.getMessage());
            dbHealth.put("status", "DOWN");
            dbHealth.put("latencyMs", latencyMs);
            dbHealth.put("error", e.getMessage());
        }

        return dbHealth;
    }

    private String maskDbUrl(String url) {
        if (url == null) return "unknown";
        // Sanitize credentials if present in URL
        return url.replaceAll("(?<=://)[^:@]+:[^@]+@", "***:***@");
    }
}
