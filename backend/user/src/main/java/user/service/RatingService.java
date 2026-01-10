package user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.auction.entities.database.Review;
import com.auction.proto.rating.AddUserRatingRequest;
import com.auction.proto.rating.AddUserRatingResponse;
import com.auction.proto.rating.DeleteUserRatingRequest;
import com.auction.proto.rating.DeleteUserRatingResponse;
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
     * Increment positive review count for a user
     */
    private Mono<Void> incrementPositiveReview(Integer userId) {
        log.info("Incrementing positive review count for user {}", userId);
        return userRepository.incrementPositiveReviews(userId)
                .doOnSuccess(count -> log.info("Updated positive reviews for user {}", userId))
                .doOnError(error -> log.error("Error incrementing positive reviews for user {}", userId, error))
                .then();
    }

    /**
     * Increment negative review count for a user
     */
    private Mono<Void> incrementNegativeReview(Integer userId) {
        log.info("Incrementing negative review count for user {}", userId);
        return userRepository.incrementNegativeReviews(userId)
                .doOnSuccess(count -> log.info("Updated negative reviews for user {}", userId))
                .doOnError(error -> log.error("Error incrementing negative reviews for user {}", userId, error))
                .then();
    }

    /**
     * Add or update user rating (1-5 stars)
     * Also updates rating_percent, positive_reviews, negative_reviews in users table
     */
    public Mono<AddUserRatingResponse> addUserRating(AddUserRatingRequest request) {
        log.info("Processing rating from user {} to user {} for product {}",
                request.getFromUserId(), request.getToUserId(), request.getProductId());

        // Check if rating already exists
        return reviewRepository.findByFromUserIdAndToUserIdAndProductId(
                request.getFromUserId(),
                request.getToUserId(),
                request.getProductId()
        )
        .flatMap(existing -> {
            // Update existing rating
            log.info("Updating existing rating {}", existing.getId());
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
                        .comment(request.getComment())
                        .build();
                
                // Save review and update user statistics based on like/dislike
                return reviewRepository.save(review)
                        .flatMap(savedReview -> {
                            if (request.getLike()) {
                                return incrementPositiveReview(request.getToUserId())
                                        .thenReturn(savedReview);
                            } else {
                                return incrementNegativeReview(request.getToUserId())
                                        .thenReturn(savedReview);
                            }
                        });
            })
        )
        .flatMap(savedReview -> {
            log.info("Rating saved successfully with id {}", savedReview.getId());
            // Recalculate and update user rating statistics from all reviews
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
     * Build rating detail with user information
     */
    private Mono<RatingDetail> buildRatingDetail(Review review) {
        return userRepository.findByUserId(review.getFromUserId())
                .map(fromUser -> RatingDetail.newBuilder()
                        .setReviewId(review.getId())
                        .setFromUserId(review.getFromUserId())
                        .setFromUserName(fromUser != null ? fromUser.getFullName() : "Unknown")
                        .setProductId(review.getProductId())
                        .setProductTitle("")
                        .setComment(review.getComment() != null ? review.getComment() : "")
                        .setCreatedAt(review.getCreatedAt() != null ? review.getCreatedAt().getSecond() : 0)
                        .build())
                .switchIfEmpty(Mono.just(RatingDetail.newBuilder()
                        .setReviewId(review.getId())
                        .setFromUserId(review.getFromUserId())
                        .setFromUserName("Unknown")
                        .setProductId(review.getProductId())
                        .setComment(review.getComment() != null ? review.getComment() : "")
                        .build()))
                .onErrorResume(error -> {
                    log.warn("Error building rating detail for review {}", review.getId(), error);
                    return Mono.just(RatingDetail.newBuilder()
                            .setReviewId(review.getId())
                            .setFromUserId(review.getFromUserId())
                            .setFromUserName("Unknown")
                            .setProductId(review.getProductId())
                            .build());
                });
    }
}
