package com.auction.platform.mysql.config;

import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.pool.ConnectionPoolConfiguration;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactory;
import io.r2dbc.spi.ConnectionFactoryOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.config.AbstractR2dbcConfiguration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.r2dbc.connection.R2dbcTransactionManager;
import org.springframework.transaction.ReactiveTransactionManager;

import java.time.Duration;

import static io.r2dbc.spi.ConnectionFactoryOptions.*;

/**
 * R2DBC MySQL Configuration for Reactive Database Operations
 * Provides connection factory with connection pooling
 * Create by Nhan Nguyen on 2025-12-1
 */
@Configuration
@EnableR2dbcRepositories(basePackages = "com.auction.platform")
public class R2dbcMySQLConfig extends AbstractR2dbcConfiguration {

    @Value("${spring.r2dbc.host:localhost}")
    private String host;

    @Value("${spring.r2dbc.port:3306}")
    private int port;

    @Value("${spring.r2dbc.database}")
    private String database;

    @Value("${spring.r2dbc.username}")
    private String username;

    @Value("${spring.r2dbc.password}")
    private String password;

    @Value("${spring.r2dbc.pool.initial-size:10}")
    private int initialSize;

    @Value("${spring.r2dbc.pool.max-size:20}")
    private int maxSize;

    @Value("${spring.r2dbc.pool.max-idle-time:30m}")
    private Duration maxIdleTime;

    @Value("${spring.r2dbc.pool.max-acquire-time:3s}")
    private Duration maxAcquireTime;

    @Value("${spring.r2dbc.pool.max-create-connection-time:3s}")
    private Duration maxCreateConnectionTime;

    @Override
    @Bean
    public ConnectionFactory connectionFactory() {
        ConnectionFactoryOptions options = ConnectionFactoryOptions.builder()
                .option(DRIVER, "mysql")
                .option(HOST, host)
                .option(PORT, port)
                .option(USER, username)
                .option(PASSWORD, password)
                .option(DATABASE, database)
                .option(CONNECT_TIMEOUT, Duration.ofSeconds(3))
                .build();

        ConnectionFactory connectionFactory = ConnectionFactories.get(options);

        ConnectionPoolConfiguration poolConfiguration = ConnectionPoolConfiguration.builder(connectionFactory)
                .initialSize(initialSize)
                .maxSize(maxSize)
                .maxIdleTime(maxIdleTime)
                .maxAcquireTime(maxAcquireTime)
                .maxCreateConnectionTime(maxCreateConnectionTime)
                .validationQuery("SELECT 1")
                .build();

        return new ConnectionPool(poolConfiguration);
    }

    @Bean
    public ReactiveTransactionManager transactionManager(ConnectionFactory connectionFactory) {
        return new R2dbcTransactionManager(connectionFactory);
    }
}
