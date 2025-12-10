package redis.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis Configuration for Reactive/WebFlux applications
 * Provides ReactiveRedisTemplate with JSON serialization support
 * Create by Nhan Nguyen on 2025-12-1
 */
@Configuration
public class RedisConfig {

    /**
     * Creates ObjectMapper configured for Redis serialization
     * 
     * @return configured ObjectMapper
     */
    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        return objectMapper;
    }

    /**
     * Creates ReactiveRedisTemplate for String keys and Object values
     * Uses JSON serialization for values
     * 
     * @param connectionFactory the reactive Redis connection factory
     * @param redisObjectMapper the object mapper for JSON serialization
     * @return configured ReactiveRedisTemplate
     */
    @Bean
    public ReactiveRedisTemplate<String, Object> reactiveRedisTemplate(
            ReactiveRedisConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {
        
        // String serializer for keys
        StringRedisSerializer keySerializer = new StringRedisSerializer();
        
        // JSON serializer for values
        Jackson2JsonRedisSerializer<Object> valueSerializer = 
            new Jackson2JsonRedisSerializer<>(redisObjectMapper, Object.class);
        
        // Build serialization context
        RedisSerializationContext<String, Object> serializationContext = 
            RedisSerializationContext.<String, Object>newSerializationContext()
                .key(keySerializer)
                .value(valueSerializer)
                .hashKey(keySerializer)
                .hashValue(valueSerializer)
                .build();
        
        return new ReactiveRedisTemplate<>(connectionFactory, serializationContext);
    }

    /**
     * Creates ReactiveRedisTemplate for String keys and String values
     * Useful for simple string operations
     * 
     * @param connectionFactory the reactive Redis connection factory
     * @return configured ReactiveRedisTemplate for strings
     */
    @Bean
    public ReactiveRedisTemplate<String, String> reactiveStringRedisTemplate(
            ReactiveRedisConnectionFactory connectionFactory) {
        
        StringRedisSerializer serializer = new StringRedisSerializer();
        
        RedisSerializationContext<String, String> serializationContext = 
            RedisSerializationContext.<String, String>newSerializationContext()
                .key(serializer)
                .value(serializer)
                .hashKey(serializer)
                .hashValue(serializer)
                .build();
        
        return new ReactiveRedisTemplate<>(connectionFactory, serializationContext);
    }
}
