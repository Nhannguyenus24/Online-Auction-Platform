package redis.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import redis.service.ReactiveRedisService;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Implementation of ReactiveRedisService
 * Provides reactive Redis operations for WebFlux applications
 */
@Service
@RequiredArgsConstructor
public class ReactiveRedisServiceImpl implements ReactiveRedisService {

    private final ReactiveRedisTemplate<String, Object> redisTemplate;

    // ===== Key Operations =====

    @Override
    public Mono<Boolean> set(String key, Object value) {
        return redisTemplate.opsForValue()
                .set(key, value)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Boolean> set(String key, Object value, Duration timeout) {
        return redisTemplate.opsForValue()
                .set(key, value, timeout)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Object> get(String key) {
        return redisTemplate.opsForValue()
                .get(key)
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> Mono<T> get(String key, Class<T> clazz) {
        return redisTemplate.opsForValue()
                .get(key)
                .<T>handle((value, sink) -> {
                    if (clazz.isInstance(value)) {
                        sink.next((T) value);
                        return;
                    }
                    sink.error(new ClassCastException("Cannot cast to " + clazz.getName()));
                })
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public Mono<Boolean> delete(String key) {
        return redisTemplate.opsForValue()
                .delete(key)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Long> delete(List<String> keys) {
        return redisTemplate.delete(Flux.fromIterable(keys))
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Boolean> exists(String key) {
        return redisTemplate.hasKey(key)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Boolean> expire(String key, Duration timeout) {
        return redisTemplate.expire(key, timeout)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Duration> getExpire(String key) {
        return redisTemplate.getExpire(key)
                .onErrorResume(e -> Mono.empty());
    }

    // ===== Hash Operations =====

    @Override
    public Mono<Boolean> hSet(String key, String hashKey, Object value) {
        return redisTemplate.opsForHash()
                .put(key, hashKey, value)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Object> hGet(String key, String hashKey) {
        return redisTemplate.opsForHash()
                .get(key, hashKey)
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public Mono<Map<Object, Object>> hGetAll(String key) {
        return redisTemplate.opsForHash()
                .entries(key)
                .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public Mono<Long> hDelete(String key, Object... hashKeys) {
        return redisTemplate.opsForHash()
                .remove(key, hashKeys)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Boolean> hExists(String key, String hashKey) {
        return redisTemplate.opsForHash()
                .hasKey(key, hashKey)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Long> hIncrement(String key, String hashKey, long delta) {
        return redisTemplate.opsForHash()
                .increment(key, hashKey, delta)
                .onErrorResume(e -> Mono.empty());
    }

    // ===== List Operations =====

    @Override
    public Mono<Long> lPush(String key, Object value) {
        return redisTemplate.opsForList()
                .leftPush(key, value)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Long> lPushAll(String key, Object... values) {
        return redisTemplate.opsForList()
                .leftPushAll(key, values)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Object> lPop(String key) {
        return redisTemplate.opsForList()
                .leftPop(key)
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public Mono<Long> rPush(String key, Object value) {
        return redisTemplate.opsForList()
                .rightPush(key, value)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Object> rPop(String key) {
        return redisTemplate.opsForList()
                .rightPop(key)
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public Flux<Object> lRange(String key, long start, long end) {
        return redisTemplate.opsForList()
                .range(key, start, end)
                .onErrorResume(e -> Flux.empty());
    }

    @Override
    public Mono<Long> lSize(String key) {
        return redisTemplate.opsForList()
                .size(key)
                .onErrorResume(e -> Mono.just(0L));
    }

    // ===== Set Operations =====

    @Override
    public Mono<Long> sAdd(String key, Object... values) {
        return redisTemplate.opsForSet()
                .add(key, values)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Long> sRemove(String key, Object... values) {
        return redisTemplate.opsForSet()
                .remove(key, values)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Boolean> sIsMember(String key, Object value) {
        return redisTemplate.opsForSet()
                .isMember(key, value)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Flux<Object> sMembers(String key) {
        return redisTemplate.opsForSet()
                .members(key)
                .onErrorResume(e -> Flux.empty());
    }

    @Override
    public Mono<Long> sSize(String key) {
        return redisTemplate.opsForSet()
                .size(key)
                .onErrorResume(e -> Mono.just(0L));
    }

    // ===== Sorted Set Operations =====

    @Override
    public Mono<Boolean> zAdd(String key, Object value, double score) {
        return redisTemplate.opsForZSet()
                .add(key, value, score)
                .onErrorResume(e -> Mono.just(false));
    }

    @Override
    public Mono<Long> zRemove(String key, Object... values) {
        return redisTemplate.opsForZSet()
                .remove(key, values)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Flux<Object> zRangeByScore(String key, double min, double max) {
        return redisTemplate.opsForZSet()
                .rangeByScore(key, org.springframework.data.domain.Range.closed(min, max))
                .onErrorResume(e -> Flux.empty());
    }

    @Override
    public Flux<Object> zRange(String key, long start, long end) {
        return redisTemplate.opsForZSet()
                .range(key, org.springframework.data.domain.Range.closed(start, end))
                .onErrorResume(e -> Flux.empty());
    }

    @Override
    public Mono<Long> zSize(String key) {
        return redisTemplate.opsForZSet()
                .size(key)
                .onErrorResume(e -> Mono.just(0L));
    }

    @Override
    public Mono<Double> zScore(String key, Object value) {
        return redisTemplate.opsForZSet()
                .score(key, value)
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public Mono<Double> zIncrementScore(String key, Object value, double delta) {
        return redisTemplate.opsForZSet()
                .incrementScore(key, value, delta)
                .onErrorResume(e -> Mono.empty());
    }
}
