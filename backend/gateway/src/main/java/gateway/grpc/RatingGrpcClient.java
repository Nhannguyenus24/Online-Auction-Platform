package gateway.grpc;

import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.proto.rating.*;
import com.auction.utils.JsonUtils;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

@Component
public class RatingGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(RatingGrpcClient.class);
    
    @Value("${grpc.user-service.host:localhost}")
    private String userServiceHost;

    @Value("${grpc.user-service.port:9090}")
    private int userServicePort;

    private ManagedChannel channel;
    private ReactorRatingServiceGrpc.ReactorRatingServiceStub ratingServiceStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(userServiceHost, userServicePort)
                .usePlaintext()
                .keepAliveTime(10, TimeUnit.SECONDS)
                .keepAliveTimeout(10, TimeUnit.SECONDS)
                .build();
        
        ratingServiceStub = ReactorRatingServiceGrpc.newReactorStub(channel);
        
        log.info("gRPC Rating Service client initialized: {}:{}", userServiceHost, userServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC Rating Service channel shutdown");
        }
    }

    // Add or update user rating
    public Mono<AddUserRatingResponse> addUserRating(AddUserRatingRequest request) {
        log.info("gRPC addUserRating request: {}", JsonUtils.toJson(request));
        return ratingServiceStub.addUserRating(Mono.just(request));
    }

    // Delete user rating
    public Mono<DeleteUserRatingResponse> deleteUserRating(DeleteUserRatingRequest request) {
        log.info("gRPC deleteUserRating request: {}", JsonUtils.toJson(request));
        return ratingServiceStub.deleteUserRating(Mono.just(request));
    }

    // Get user ratings
    public Mono<GetUserRatingsResponse> getUserRatings(GetUserRatingsRequest request) {
        log.info("gRPC getUserRatings request: {}", JsonUtils.toJson(request));
        return ratingServiceStub.getUserRatings(Mono.just(request));
    }

    // Get rating statistics
    public Mono<GetRatingStatsResponse> getRatingStats(GetRatingStatsRequest request) {
        log.info("gRPC getRatingStats request: {}", JsonUtils.toJson(request));
        return ratingServiceStub.getRatingStats(Mono.just(request));
    }
}
