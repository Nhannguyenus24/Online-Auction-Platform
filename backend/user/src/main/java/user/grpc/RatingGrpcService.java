package user.grpc;

import com.auction.proto.rating.*;
import org.springframework.grpc.server.service.GrpcService;
import reactor.core.publisher.Mono;
import user.service.RatingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.auction.utils.JsonUtils;

/**
 * gRPC implementation of RatingService
 * Handles user rating operations for products and sellers
 */
@GrpcService
public class RatingGrpcService extends ReactorRatingServiceGrpc.RatingServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(RatingGrpcService.class);
    private final RatingService ratingService;

    public RatingGrpcService(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @Override
    public Mono<AddUserRatingResponse> addUserRating(Mono<AddUserRatingRequest> request) {
        return request.doOnNext(req -> log.info("Raw add user rating request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            ratingService.addUserRating(req)
                .map(result -> result)
                .onErrorResume(e -> {
                    log.error("Add user rating error: {}", e.getMessage());
                    return Mono.just(AddUserRatingResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Failed to add rating: " + e.getMessage())
                        .build());
                })
        );
    }

    @Override
    public Mono<DeleteUserRatingResponse> deleteUserRating(Mono<DeleteUserRatingRequest> request) {
        return request.doOnNext(req -> log.info("Raw delete user rating request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            ratingService.deleteUserRating(req)
                .map(result -> result)
                .onErrorResume(e -> {
                    log.error("Delete user rating error: {}", e.getMessage());
                    return Mono.just(DeleteUserRatingResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Failed to delete rating: " + e.getMessage())
                        .build());
                })
        );
    }

    @Override
    public Mono<GetUserRatingsResponse> getUserRatings(Mono<GetUserRatingsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get user ratings request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            ratingService.getUserRatings(req)
                .map(result -> result)
                .onErrorResume(e -> {
                    log.error("Get user ratings error: {}", e.getMessage());
                    return Mono.just(GetUserRatingsResponse.newBuilder()
                        .setMessage("Failed to fetch ratings: " + e.getMessage())
                        .build());
                })
        );
    }

    @Override
    public Mono<GetRatingStatsResponse> getRatingStats(Mono<GetRatingStatsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get rating stats request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            ratingService.getRatingStats(req)
                .map(result -> result)
                .onErrorResume(e -> {
                    log.error("Get rating stats error: {}", e.getMessage());
                    return Mono.just(GetRatingStatsResponse.newBuilder()
                        .setMessage("Failed to fetch rating stats: " + e.getMessage())
                        .build());
                })
        );
    }
}
