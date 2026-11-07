package com.ledgerline.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataRetrievalFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DatabaseHealthServiceTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private Connection connection;

    @Mock
    private DatabaseMetaData metaData;

    @Test
    @DisplayName("Should report UP when database connection and query probe succeed")
    void shouldReportUpWhenDbProbeSucceeds() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(anyInt())).thenReturn(true);
        when(connection.getMetaData()).thenReturn(metaData);
        when(metaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(metaData.getDatabaseProductVersion()).thenReturn("16.2");
        when(metaData.getURL()).thenReturn("jdbc:postgresql://localhost:5432/ledgerline");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);

        DatabaseHealthService service = new DatabaseHealthService(dataSource, jdbcTemplate);
        Map<String, Object> health = service.checkDatabaseHealth();

        assertThat(health).isNotNull();
        assertThat(health.get("status")).isEqualTo("UP");
        assertThat(health.get("database")).isEqualTo("PostgreSQL");
        assertThat(health.get("version")).isEqualTo("16.2");
        assertThat(health.get("latencyMs")).isNotNull();
    }

    @Test
    @DisplayName("Should report DOWN when query probe fails")
    void shouldReportDownWhenQueryProbeFails() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(anyInt())).thenReturn(true);
        when(connection.getMetaData()).thenReturn(metaData);
        when(metaData.getDatabaseProductName()).thenReturn("PostgreSQL");
        when(metaData.getDatabaseProductVersion()).thenReturn("16.2");
        when(metaData.getURL()).thenReturn("jdbc:postgresql://localhost:5432/ledgerline");
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class)))
                .thenThrow(new DataRetrievalFailureException("Simulated connection timeout"));

        DatabaseHealthService service = new DatabaseHealthService(dataSource, jdbcTemplate);
        Map<String, Object> health = service.checkDatabaseHealth();

        assertThat(health).isNotNull();
        assertThat(health.get("status")).isEqualTo("DOWN");
        assertThat(health.get("error")).toString().contains("Simulated connection timeout");
    }

    @Test
    @DisplayName("Should report DOWN when database connection cannot be obtained")
    void shouldReportDownWhenConnectionFails() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("Network unreachable"));

        DatabaseHealthService service = new DatabaseHealthService(dataSource, jdbcTemplate);
        Map<String, Object> health = service.checkDatabaseHealth();

        assertThat(health).isNotNull();
        assertThat(health.get("status")).isEqualTo("DOWN");
        assertThat(health.get("error")).isEqualTo("Network unreachable");
    }
}
