package com.auction.platform.mysql.client;

import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.function.BiFunction;

/**
 * Reactive MySQL Database Client
 * Provides reactive database operations using R2DBC
 * Create by Nhan Nguyen on 2025-12-1
 */
@Component
@RequiredArgsConstructor
public class ReactiveMySQLClient {

    private final DatabaseClient databaseClient;

    /**
     * Execute a SELECT query and return multiple results
     * 
     * @param sql SQL query
     * @param mapper function to map row to entity
     * @param <T> entity type
     * @return Flux of entities
     */
    public <T> Flux<T> query(String sql, BiFunction<io.r2dbc.spi.Row, io.r2dbc.spi.RowMetadata, T> mapper) {
        return databaseClient.sql(sql)
                .map(mapper)
                .all()
                .onErrorResume(e -> Flux.empty());
    }

    /**
     * Execute a SELECT query with parameters and return multiple results
     * 
     * @param sql SQL query with named parameters
     * @param params parameter map
     * @param mapper function to map row to entity
     * @param <T> entity type
     * @return Flux of entities
     */
    public <T> Flux<T> query(String sql, Map<String, Object> params, BiFunction<io.r2dbc.spi.Row, io.r2dbc.spi.RowMetadata, T> mapper) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.map(mapper)
                .all()
                .onErrorResume(e -> Flux.empty());
    }

    /**
     * Execute a SELECT query and return a single result
     * 
     * @param sql SQL query
     * @param mapper function to map row to entity
     * @param <T> entity type
     * @return Mono of entity
     */
    public <T> Mono<T> queryOne(String sql, BiFunction<io.r2dbc.spi.Row, io.r2dbc.spi.RowMetadata, T> mapper) {
        return databaseClient.sql(sql)
                .map(mapper)
                .one()
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * Execute a SELECT query with parameters and return a single result
     * 
     * @param sql SQL query with named parameters
     * @param params parameter map
     * @param mapper function to map row to entity
     * @param <T> entity type
     * @return Mono of entity
     */
    public <T> Mono<T> queryOne(String sql, Map<String, Object> params, BiFunction<io.r2dbc.spi.Row, io.r2dbc.spi.RowMetadata, T> mapper) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.map(mapper)
                .one()
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * Execute an INSERT, UPDATE, or DELETE statement
     * 
     * @param sql SQL statement
     * @return Mono of rows affected count
     */
    public Mono<Long> execute(String sql) {
        return databaseClient.sql(sql)
                .fetch()
                .rowsUpdated()
                .onErrorResume(e -> Mono.just(0L));
    }

    /**
     * Execute an INSERT, UPDATE, or DELETE statement with parameters
     * 
     * @param sql SQL statement with named parameters
     * @param params parameter map
     * @return Mono of rows affected count
     */
    public Mono<Long> execute(String sql, Map<String, Object> params) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.fetch()
                .rowsUpdated()
                .onErrorResume(e -> Mono.just(0L));
    }

    /**
     * Execute an INSERT statement and return generated key
     * 
     * @param sql INSERT SQL statement
     * @param params parameter map
     * @return Mono of generated key
     */
    public Mono<Long> insert(String sql, Map<String, Object> params) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.filter((statement, next) -> statement.returnGeneratedValues("id").execute())
                .map((row, metadata) -> row.get("id", Long.class))
                .one()
                .onErrorResume(e -> Mono.empty());
    }

    /**
     * Check if a record exists
     * 
     * @param sql SELECT COUNT query
     * @param params parameter map
     * @return Mono of boolean (true if exists)
     */
    public Mono<Boolean> exists(String sql, Map<String, Object> params) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.map((row, metadata) -> row.get(0, Long.class))
                .one()
                .map(count -> count > 0)
                .defaultIfEmpty(false)
                .onErrorResume(e -> Mono.just(false));
    }

    /**
     * Count records
     * 
     * @param sql SELECT COUNT query
     * @return Mono of count
     */
    public Mono<Long> count(String sql) {
        return databaseClient.sql(sql)
                .map((row, metadata) -> row.get(0, Long.class))
                .one()
                .defaultIfEmpty(0L)
                .onErrorResume(e -> Mono.just(0L));
    }

    /**
     * Count records with parameters
     * 
     * @param sql SELECT COUNT query with named parameters
     * @param params parameter map
     * @return Mono of count
     */
    public Mono<Long> count(String sql, Map<String, Object> params) {
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            spec = spec.bind(entry.getKey(), entry.getValue());
        }
        return spec.map((row, metadata) -> row.get(0, Long.class))
                .one()
                .defaultIfEmpty(0L)
                .onErrorResume(e -> Mono.just(0L));
    }

    /**
     * Execute batch operations
     * 
     * @param sqls list of SQL statements
     * @return Flux of rows affected for each statement
     */
    public Flux<Long> executeBatch(String... sqls) {
        return Flux.fromArray(sqls)
                .flatMap(this::execute);
    }
}
