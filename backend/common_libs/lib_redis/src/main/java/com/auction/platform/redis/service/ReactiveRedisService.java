package com.auction.platform.redis.service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reactive Redis Service Interface
 * Provides common Redis operations for WebFlux applications
 * Create by Nhan Nguyen on 2025-12-1
 */
public interface ReactiveRedisService {

    // ===== Key Operations =====
    
    /**
     * Set a key-value pair
     * 
     * @param key the key
     * @param value the value
     * @return Mono<Boolean> true if successful
     */
    Mono<Boolean> set(String key, Object value);

    /**
     * Set a key-value pair with expiration
     * 
     * @param key the key
     * @param value the value
     * @param timeout the expiration duration
     * @return Mono<Boolean> true if successful
     */
    Mono<Boolean> set(String key, Object value, Duration timeout);

    /**
     * Get value by key
     * 
     * @param key the key
     * @return Mono<Object> the value
     */
    Mono<Object> get(String key);

    /**
     * Get value by key with type casting
     * 
     * @param key the key
     * @param clazz the target class type
     * @param <T> the type parameter
     * @return Mono<T> the value cast to specified type
     */
    <T> Mono<T> get(String key, Class<T> clazz);

    /**
     * Delete a key
     * 
     * @param key the key
     * @return Mono<Boolean> true if key was deleted
     */
    Mono<Boolean> delete(String key);

    /**
     * Delete multiple keys
     * 
     * @param keys the keys to delete
     * @return Mono<Long> number of keys deleted
     */
    Mono<Long> delete(List<String> keys);

    /**
     * Check if key exists
     * 
     * @param key the key
     * @return Mono<Boolean> true if key exists
     */
    Mono<Boolean> exists(String key);

    /**
     * Set expiration time for a key
     * 
     * @param key the key
     * @param timeout the expiration duration
     * @return Mono<Boolean> true if successful
     */
    Mono<Boolean> expire(String key, Duration timeout);

    /**
     * Get time to live for a key
     * 
     * @param key the key
     * @return Mono<Duration> remaining time to live
     */
    Mono<Duration> getExpire(String key);

    // ===== Hash Operations =====

    /**
     * Set a field in a hash
     * 
     * @param key the key
     * @param hashKey the hash field
     * @param value the value
     * @return Mono<Boolean> true if successful
     */
    Mono<Boolean> hSet(String key, String hashKey, Object value);

    /**
     * Get a field from a hash
     * 
     * @param key the key
     * @param hashKey the hash field
     * @return Mono<Object> the value
     */
    Mono<Object> hGet(String key, String hashKey);

    /**
     * Get all fields and values from a hash
     * 
     * @param key the key
     * @return Mono<Map<String, Object>> map of all fields and values
     */
    Mono<Map<Object, Object>> hGetAll(String key);

    /**
     * Delete a field from a hash
     * 
     * @param key the key
     * @param hashKeys the hash fields to delete
     * @return Mono<Long> number of fields deleted
     */
    Mono<Long> hDelete(String key, Object... hashKeys);

    /**
     * Check if field exists in hash
     * 
     * @param key the key
     * @param hashKey the hash field
     * @return Mono<Boolean> true if field exists
     */
    Mono<Boolean> hExists(String key, String hashKey);

    /**
     * Increment a hash field by value
     * 
     * @param key the key
     * @param hashKey the hash field
     * @param delta the increment value
     * @return Mono<Long> the new value
     */
    Mono<Long> hIncrement(String key, String hashKey, long delta);

    // ===== List Operations =====

    /**
     * Push value to the left of a list
     * 
     * @param key the key
     * @param value the value
     * @return Mono<Long> list length after operation
     */
    Mono<Long> lPush(String key, Object value);

    /**
     * Push multiple values to the left of a list
     * 
     * @param key the key
     * @param values the values
     * @return Mono<Long> list length after operation
     */
    Mono<Long> lPushAll(String key, Object... values);

    /**
     * Pop value from the left of a list
     * 
     * @param key the key
     * @return Mono<Object> the popped value
     */
    Mono<Object> lPop(String key);

    /**
     * Push value to the right of a list
     * 
     * @param key the key
     * @param value the value
     * @return Mono<Long> list length after operation
     */
    Mono<Long> rPush(String key, Object value);

    /**
     * Pop value from the right of a list
     * 
     * @param key the key
     * @return Mono<Object> the popped value
     */
    Mono<Object> rPop(String key);

    /**
     * Get list range
     * 
     * @param key the key
     * @param start start index
     * @param end end index
     * @return Flux<Object> stream of values in range
     */
    Flux<Object> lRange(String key, long start, long end);

    /**
     * Get list size
     * 
     * @param key the key
     * @return Mono<Long> list size
     */
    Mono<Long> lSize(String key);

    // ===== Set Operations =====

    /**
     * Add members to a set
     * 
     * @param key the key
     * @param values the values to add
     * @return Mono<Long> number of members added
     */
    Mono<Long> sAdd(String key, Object... values);

    /**
     * Remove members from a set
     * 
     * @param key the key
     * @param values the values to remove
     * @return Mono<Long> number of members removed
     */
    Mono<Long> sRemove(String key, Object... values);

    /**
     * Check if member exists in set
     * 
     * @param key the key
     * @param value the value to check
     * @return Mono<Boolean> true if member exists
     */
    Mono<Boolean> sIsMember(String key, Object value);

    /**
     * Get all members of a set
     * 
     * @param key the key
     * @return Flux<Object> stream of all members
     */
    Flux<Object> sMembers(String key);

    /**
     * Get set size
     * 
     * @param key the key
     * @return Mono<Long> set size
     */
    Mono<Long> sSize(String key);

    // ===== Sorted Set Operations =====

    /**
     * Add member to sorted set with score
     * 
     * @param key the key
     * @param value the value
     * @param score the score
     * @return Mono<Boolean> true if member was added
     */
    Mono<Boolean> zAdd(String key, Object value, double score);

    /**
     * Remove member from sorted set
     * 
     * @param key the key
     * @param values the values to remove
     * @return Mono<Long> number of members removed
     */
    Mono<Long> zRemove(String key, Object... values);

    /**
     * Get members in sorted set by score range
     * 
     * @param key the key
     * @param min minimum score
     * @param max maximum score
     * @return Flux<Object> stream of members in range
     */
    Flux<Object> zRangeByScore(String key, double min, double max);

    /**
     * Get members in sorted set by rank range
     * 
     * @param key the key
     * @param start start index
     * @param end end index
     * @return Flux<Object> stream of members in range
     */
    Flux<Object> zRange(String key, long start, long end);

    /**
     * Get sorted set size
     * 
     * @param key the key
     * @return Mono<Long> sorted set size
     */
    Mono<Long> zSize(String key);

    /**
     * Get member score
     * 
     * @param key the key
     * @param value the member
     * @return Mono<Double> member score
     */
    Mono<Double> zScore(String key, Object value);

    /**
     * Increment member score
     * 
     * @param key the key
     * @param value the member
     * @param delta the increment value
     * @return Mono<Double> new score
     */
    Mono<Double> zIncrementScore(String key, Object value, double delta);
}
