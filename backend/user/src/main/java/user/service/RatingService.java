package user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.auction.entities.database.Review;
import com.auction.entities.database.User;
import com.auction.proto.rating.AddUserRatingRequest;
import com.auction.proto.rating.AddUserRatingResponse;
import com.auction.proto.rating.DeleteUserRatingRequest;
import com.auction.proto.rating.DeleteUserRatingResponse;
import com.auction.proto.rating.GetRatingStatsRequest;
import com.auction.proto.rating.GetRatingStatsResponse;
import com.auction.proto.rating.GetUserRatingsRequest;
import com.auction.proto.rating.GetUserRatingsResponse;
import com.auction.proto.rating.RatingDetail;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import user.repository.ReviewRepository;
import user.repository.UserRepository;

@Service
public class RatingService {

    private static final Logger log = LoggerFactory.getLogger(RatingService.class);

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public RatingService(ReviewRepository reviewRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    /**
     * Add or update user rating (1-5 stars)
     */
    public Mono<AddUserRatingResponse> addUserRating(AddUserRatingRequest request) {
        log.info("Processing rating from user {} to user {} for product {} with score {}",
                request.getFromUserId(), request.getToUserId(), request.getProductId(), request.getScore());

        // Check if rating already exists
        return reviewRepository.findByFromUserIdAndToUserIdAndProductId(
                request.getFromUserId(),
                request.getToUserId(),
                request.getProductId()
        )
        .flatMap(existing -> {
            // Update existing rating
            log.info("Updating existing rating {}", existing.getId());
            existing.setScore(request.getScore());
            existing.setComment(request.getComment());
            return reviewRepository.save(existing);
        })
        .switchIfEmpty(
            // Create new rating
            Mono.defer(() -> {
                Review review = Review.builder()
                        .fromUserId(request.getFromUserId())
                        .toUserId(request.getToUserId())
                        .productId(request.getProductId())
                        .score(request.getScore())
                        .comment(request.getComment())
                        .build();

                return reviewRepository.save(review);
            })
        )
        .flatMap(savedReview -> {
            log.info("Rating saved successfully with id {}", savedReview.getId());
            return Mono.just(AddUserRatingResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Rating added successfully")
                    .setReviewId(savedReview.getId())
                    .build());
        })
        .onErrorResume(error -> {
            log.error("Error saving rating", error);
            return Mono.just(AddUserRatingResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to save rating: " + error.getMessage())
                    .build());
        });
    }

    /**
     * Delete user rating
     */
    public Mono<DeleteUserRatingResponse> deleteUserRating(DeleteUserRatingRequest request) {
        log.info("Processing delete rating from user {} to user {} for product {}",
                request.getFromUserId(), request.getToUserId(), request.getProductId());

        return reviewRepository.deleteByFromUserIdAndToUserIdAndProductId(
                request.getFromUserId(),
                request.getToUserId(),
                request.getProductId()
        )
        .then(Mono.just(DeleteUserRatingResponse.newBuilder()
                .setSuccess(true)
                .setMessage("Rating deleted successfully")
                .build()))
        .onErrorResume(error -> {
            log.error("Error deleting rating", error);
            return Mono.just(DeleteUserRatingResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to delete rating: " + error.getMessage())
                    .build());
        });
    }

    /**
     * Get all ratings for a user with pagination
     */
    public Mono<GetUserRatingsResponse> getUserRatings(GetUserRatingsRequest request) {
        log.info("Fetching ratings for user {} page {} size {}", 
                request.getUserId(), request.getPage(), request.getPageSize());

        int page = request.getPage() > 0 ? request.getPage() : 1;
        int pageSize = request.getPageSize() > 0 ? request.getPageSize() : 20;
        int skip = (page - 1) * pageSize;

        return reviewRepository.findByToUserIdOrderByCreatedAtDesc(request.getUserId())
                .skip(skip)
                .take(pageSize)
                .collectList()
                .flatMap(reviews -> {
                    // Build response
                    GetUserRatingsResponse.Builder responseBuilder = GetUserRatingsResponse.newBuilder()
                            .setUserId(request.getUserId());

                    // For each review, add details
                    Flux<RatingDetail> ratingDetails = Flux.fromIterable(reviews)
                            .flatMap(this::buildRatingDetail);

                    return ratingDetails.collectList()
                            .map(details -> {
                                details.forEach(responseBuilder::addRatings);
                                return responseBuilder.setTotalRatings(details.size()).build();
                            });
                })
                .switchIfEmpty(
                    Mono.just(GetUserRatingsResponse.newBuilder()
                            .setUserId(request.getUserId())
                            .setTotalRatings(0)
                            .build())
                );
    }

    /**
     * Get rating statistics for a user
     */
    public Mono<GetRatingStatsResponse> getRatingStats(GetRatingStatsRequest request) {
        log.info("Fetching rating statistics for user {}", request.getUserId());

        Integer userId = request.getUserId();

        return Mono.zip(
                reviewRepository.countRatingsByUserId(userId),
                reviewRepository.getAverageScore(userId),
                reviewRepository.countRatingsByScore(userId, 5),
                reviewRepository.countRatingsByScore(userId, 4),
                reviewRepository.countRatingsByScore(userId, 3),
                reviewRepository.countRatingsByScore(userId, 2),
                reviewRepository.countRatingsByScore(userId, 1)
        )
        .map(tuple -> {
            int totalRatings = tuple.getT1() != null ? tuple.getT1() : 0;
            double avgScore = tuple.getT2() != null ? tuple.getT2() : 0.0;
            int fiveStar = tuple.getT3() != null ? tuple.getT3() : 0;
            int fourStar = tuple.getT4() != null ? tuple.getT4() : 0;
            int threeStar = tuple.getT5() != null ? tuple.getT5() : 0;
            int twoStar = tuple.getT6() != null ? tuple.getT6() : 0;
            int oneStar = tuple.getT7() != null ? tuple.getT7() : 0;

            return GetRatingStatsResponse.newBuilder()
                    .setUserId(userId)
                    .setTotalRatings(totalRatings)
                    .setAverageScore(avgScore)
                    .setFiveStar(fiveStar)
                    .setFourStar(fourStar)
                    .setThreeStar(threeStar)
                    .setTwoStar(twoStar)
                    .setOneStar(oneStar)
                    .build();
        })
        .onErrorResume(error -> {
            log.error("Error fetching rating statistics", error);
            return Mono.just(GetRatingStatsResponse.newBuilder()
                    .setUserId(userId)
                    .setTotalRatings(0)
                    .build());
        });
    }

    /**
     * Build rating detail with user information
     */
    private Mono<RatingDetail> buildRatingDetail(Review review) {
        return userRepository.findByUserId(review.getFromUserId())
                .map(fromUser -> {
                    return RatingDetail.newBuilder()
                            .setReviewId(review.getId())
                            .setFromUserId(review.getFromUserId())
                            .setFromUserName(fromUser != null ? fromUser.getFullName() : "Unknown")
                            .setProductId(review.getProductId())
                            .setProductTitle("")
                            .setScore(review.getScore())
                            .setComment(review.getComment() != null ? review.getComment() : "")
                            .setCreatedAt(review.getCreatedAt() != null ? review.getCreatedAt().getSecond() : 0)
                            .build();
                })
                .switchIfEmpty(Mono.just(RatingDetail.newBuilder()
                        .setReviewId(review.getId())
                        .setFromUserId(review.getFromUserId())
                        .setFromUserName("Unknown")
                        .setProductId(review.getProductId())
                        .setScore(review.getScore())
                        .setComment(review.getComment() != null ? review.getComment() : "")
                        .build()))
                .onErrorResume(error -> {
                    log.warn("Error building rating detail for review {}", review.getId(), error);
                    return Mono.just(RatingDetail.newBuilder()
                            .setReviewId(review.getId())
                            .setFromUserId(review.getFromUserId())
                            .setFromUserName("Unknown")
                            .setProductId(review.getProductId())
                            .setScore(review.getScore())
                            .build());
                });
    }
}
