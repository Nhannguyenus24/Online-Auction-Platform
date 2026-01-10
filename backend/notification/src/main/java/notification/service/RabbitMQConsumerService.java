package notification.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auction.entities.msg.RabbitMessage;
import com.auction.rabbitmq.services.ReactiveRabbitConsumer;

import jakarta.annotation.PostConstruct;
import reactor.core.publisher.Mono;

/**
 * RabbitMQ Message Consumer Service
 * Xử lý các event từ các microservice khác
 */
@Service
public class RabbitMQConsumerService {
    private static final Logger log = LoggerFactory.getLogger(RabbitMQConsumerService.class);
    private final ReactiveRabbitConsumer rabbitConsumer;
    private final EmailService emailService;
    
    @Value("${rabbitmq.notification.queue}")
    private String queueName;

    private RabbitMQConsumerService(
            ReactiveRabbitConsumer rabbitConsumer,
            EmailService emailService
    ) {
        this.rabbitConsumer = rabbitConsumer;
        this.emailService = emailService;
    }

    /**
     * Khởi động RabbitMQ consumer khi application start
     */
    @PostConstruct
    public void startConsuming() {
        log.info("=== Starting RabbitMQ Consumer ===");
        log.info("Queue name: {}", queueName);
        
        rabbitConsumer.consumeMessages(queueName, RabbitMessage.class, this::handleRabbitMessage)
            .doOnSubscribe(s -> log.info("Subscribed to RabbitMQ queue: {}", queueName))
            .doOnNext(v -> log.debug("Message processed successfully"))
            .doOnError(e -> log.error("Error in RabbitMQ consumer: {}", e.getMessage(), e))
            .doOnComplete(() -> log.warn("RabbitMQ consumer completed (should not happen)"))
            .retry()
            .subscribe(
                null,
                error -> log.error("Fatal error in RabbitMQ consumer subscription: {}", error.getMessage(), error),
                () -> log.warn("RabbitMQ consumer subscription completed")
            );
        
        log.info("=== RabbitMQ Consumer Started Successfully ===");
    }
    /**
     * Xử lý RabbitMessage từ queue
     * Phân loại theo EventType và xử lý tương ứng
     */
    public Mono<Void> handleRabbitMessage(RabbitMessage message) {
        log.info("Processing RabbitMessage: eventId={}, eventType={}, userId={}", 
            message.getEventId(), message.getEventType(), message.getUserId());

        if (message.getPayload() == null || message.getPayload().isEmpty()) {
            log.error("Invalid payload in message: eventId={}, eventType={}", 
                message.getEventId(), message.getEventType());
            return Mono.error(new IllegalArgumentException("Payload cannot be null or empty"));
        }

        return (switch (message.getEventType()) {
            case TASK_SEND_MAIL_OTP -> handleOtpEvent(message);
            case TASK_SEND_MAIL_RESET_PASSWORD -> handleResetPasswordEvent(message);
            case TASK_SEND_MAIL_SUCCESS_BID -> handleBidSuccessEvent(message);
            case TASK_SEND_MAIL_OUTBID -> handleBidOutbidEvent(message);
            case TASK_SEND_MAIL_ACCOUNT_VIOLATION -> handleAccountViolationEvent(message);
            case TASK_SEND_MAIL_PRODUCT_BANNED_USER -> handleProductBannedUserEvent(message);
            case TASK_SEND_MAIL_ENDED_AUCTION -> handleAuctionEndedEvent(message);
            case TASK_SEND_MAIL_CHANGE_DESCRIPTION -> handleDescriptionChangeEvent(message);
            case TASK_SEND_NOTIFICATION, TASK_DELETE_NOTIFICATION, TASK_READ_NOTIFICATION -> Mono.empty().then();
        })
        .doOnError(e -> log.error("Error processing RabbitMessage: eventId={}, error={}", 
            message.getEventId(), e.getMessage(), e))
        .onErrorResume(e -> Mono.empty()); // Continue processing even if error
    }

    /**
     * Xử lý event OTP verification
     */
    private Mono<Void> handleOtpEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String email = payload.get("email");
            String userName = payload.get("userName");
            String otp = payload.get("otp");
            String expiryMinutesStr = payload.get("expiryMinutes");

            if (email == null || userName == null || otp == null || expiryMinutesStr == null) {
                log.error("Missing required fields in OTP event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields: email, userName, otp, expiryMinutes"));
            }

            Integer userId = Integer.parseInt(message.getUserId());
            int expiryMinutes = Integer.parseInt(expiryMinutesStr);

            log.debug("Sending OTP email: email={}, userName={}, userId={}", email, userName, userId);
            
            return emailService.sendOtpVerificationEmailWithNotification(
                    email, userId, userName, otp, expiryMinutes
            )
            .doOnSuccess(v -> log.info("OTP email sent successfully: eventId={}, userId={}", 
                message.getEventId(), userId));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in OTP event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId or expiryMinutes format", e));
        } catch (Exception e) {
            log.error("Unexpected error in OTP event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event Reset Password OTP
     */
    private Mono<Void> handleResetPasswordEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String email = payload.get("email");
            String userName = payload.get("userName");
            String otp = payload.get("otp");
            String expiryMinutesStr = payload.get("expiryMinutes");

            if (email == null || userName == null || otp == null || expiryMinutesStr == null) {
                log.error("Missing required fields in Reset Password event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields: email, userName, otp, expiryMinutes"));
            }

            Integer userId = Integer.parseInt(message.getUserId());
            int expiryMinutes = Integer.parseInt(expiryMinutesStr);

            log.debug("Sending Reset Password OTP email: email={}, userName={}, userId={}", email, userName, userId);
            
            return emailService.sendResetPasswordOtpEmail(
                    email, userName, otp, expiryMinutes
            )
            .doOnSuccess(v -> log.info("Reset Password OTP email sent successfully: eventId={}, userId={}", 
                message.getEventId(), userId));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in Reset Password event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId or expiryMinutes format", e));
        } catch (Exception e) {
            log.error("Unexpected error in Reset Password event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event bid success
     */
    private Mono<Void> handleBidSuccessEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String productName = payload.get("productName");
            String productId = payload.get("productId");
            String bidAmount = payload.get("bidAmount");
            String bidTime = payload.get("bidTime");
            String auctionEndTime = payload.get("auctionEndTime");

            if (productName == null || 
                productId == null || bidAmount == null || bidTime == null || auctionEndTime == null) {
                log.error("Missing required fields in BidSuccess event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in bid success event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending bid success email: userId={}, productId={}", 
                userId, productId);
            
            return emailService.sendBidSuccessEmailWithNotification(
                    userId, productName, bidAmount, productId, bidTime, auctionEndTime
            )
            .doOnSuccess(v -> log.info("Bid success email sent: eventId={}, userId={}, productId={}", 
                message.getEventId(), userId, productId));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in BidSuccess event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId format", e));
        } catch (Exception e) {
            log.error("Unexpected error in BidSuccess event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event bid outbid
     */
    private Mono<Void> handleBidOutbidEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            String productName = payload.get("productName");
            String productId = payload.get("productId");
            String yourBidAmount = payload.get("yourBidAmount");
            String newHighestBid = payload.get("newHighestBid");
            String bidDifference = payload.get("bidDifference");
            String outbidTime = payload.get("outbidTime");
            String auctionEndTime = payload.get("auctionEndTime");
            String timeRemaining = payload.get("timeRemaining");
            String auctionLink = payload.get("auctionLink");

            if (productName == null ||
                productId == null || yourBidAmount == null || newHighestBid == null || 
                bidDifference == null || outbidTime == null || auctionEndTime == null || 
                timeRemaining == null || auctionLink == null) {
                log.error("Missing required fields in BidOutbid event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in bid outbid event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending bid outbid email: userId={}, productId={}", 
                userId, productId);
            
            return emailService.sendBidOutbidEmailWithNotification(
                    userId, productName, yourBidAmount, newHighestBid,
                    bidDifference, outbidTime, auctionEndTime, timeRemaining, auctionLink
            )
            .doOnSuccess(v -> log.info("Bid outbid email sent: eventId={}, userId={}, productId={}", 
                message.getEventId(), userId, productId));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in BidOutbid event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId format", e));
        } catch (Exception e) {
            log.error("Unexpected error in BidOutbid event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event account violation warning
     */
    private Mono<Void> handleAccountViolationEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String violationType = payload.get("violationType");
            String violationDescription = payload.get("violationDescription");
            String detectionDate = payload.get("detectionDate");
            String warningLevel = payload.get("warningLevel");
            String referenceNumber = payload.get("referenceNumber");
            String termsLink = payload.get("termsLink");
            String guidelinesLink = payload.get("guidelinesLink");

            if (violationType == null || 
                violationDescription == null || detectionDate == null || warningLevel == null || 
                referenceNumber == null || termsLink == null || guidelinesLink == null) {
                log.error("Missing required fields in AccountViolation event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in account violation event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending account violation warning email: userId={}, refNumber={}", 
                userId, referenceNumber);
            
            return emailService.sendAccountViolationWarningEmailWithNotification(
                    userId, violationType, violationDescription,
                    detectionDate, warningLevel, referenceNumber, termsLink, guidelinesLink
            )
            .doOnSuccess(v -> log.info("Account violation warning email sent: eventId={}, userId={}", 
                message.getEventId(), userId));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in AccountViolation event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId format", e));
        } catch (Exception e) {
            log.error("Unexpected error in AccountViolation event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event user bị ban khỏi sản phẩm
     */
    private Mono<Void> handleProductBannedUserEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String productId = payload.get("productId");
            String productName = payload.get("productName");
            String reason = payload.get("reason");
            String banTime = payload.get("banTime");

            if (productId == null || productName == null || 
                reason == null || banTime == null) {
                log.error("Missing required fields in ProductBannedUser event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in ProductBannedUser event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending product banned user email: userId={}, productId={}", userId, productId);
            
            return emailService.sendProductBannedUserEmailWithNotification(
                    userId, productName, productId, reason, banTime
            )
            .doOnSuccess(v -> log.info("Product banned user email sent: eventId={}, userId={}, productId={}", 
                message.getEventId(), userId, productId));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in ProductBannedUser event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId format", e));
        } catch (Exception e) {
            log.error("Unexpected error in ProductBannedUser event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event đấu giá kết thúc
     */
    private Mono<Void> handleAuctionEndedEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            // Check if this is for seller or bidder
            String recipientType = payload.get("recipientType"); // "seller" or "bidder"
            
            if ("seller".equals(recipientType)) {
                return handleAuctionEndedSellerEvent(message);
            } else {
                return handleAuctionEndedBidderEvent(message);
            }
        } catch (Exception e) {
            log.error("Unexpected error in AuctionEnded event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event đấu giá kết thúc cho bidder
     */
    private Mono<Void> handleAuctionEndedBidderEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String productId = payload.get("productId");
            String productName = payload.get("productName");
            String isWinnerStr = payload.get("isWinner");
            String winningAmount = payload.get("winningAmount");
            String yourBidAmount = payload.get("yourBidAmount");
            String auctionEndTime = payload.get("auctionEndTime");
            String totalBids = payload.get("totalBids");

            if (productId == null || 
                productName == null || isWinnerStr == null || winningAmount == null || 
                auctionEndTime == null || totalBids == null) {
                log.error("Missing required fields in AuctionEnded bidder event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in AuctionEnded bidder event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());
            boolean isWinner = Boolean.parseBoolean(isWinnerStr);

            log.debug("Sending auction ended email to bidder: userId={}, productId={}, isWinner={}", 
                userId, productId, isWinner);
            
            return emailService.sendAuctionEndedEmailWithNotification(
                    userId, productName, productId, isWinner, 
                    winningAmount, yourBidAmount, auctionEndTime, totalBids
            )
            .doOnSuccess(v -> log.info("Auction ended email sent to bidder: eventId={}, userId={}, productId={}, isWinner={}", 
                message.getEventId(), userId, productId, isWinner));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in AuctionEnded bidder event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId format", e));
        } catch (Exception e) {
            log.error("Unexpected error in AuctionEnded bidder event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event thay đổi mô tả sản phẩm
     */
    private Mono<Void> handleDescriptionChangeEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String productId = payload.get("productId");
            String productName = payload.get("productName");
            String newDescription = payload.get("newDescription");
            String changeTime = payload.get("changeTime");
            String auctionEndTime = payload.get("auctionEndTime");

            if (productId == null || productName == null || 
                newDescription == null || changeTime == null || auctionEndTime == null) {
                log.error("Missing required fields in DescriptionChange event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in DescriptionChange event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending description change email: userId={}, productId={}", userId, productId);
            
            return emailService.sendDescriptionChangeEmailWithNotification(
                    userId, productName, productId, newDescription, changeTime, auctionEndTime
            )
            .doOnSuccess(v -> log.info("Description change email sent: eventId={}, userId={}, productId={}", 
                message.getEventId(), userId, productId));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in DescriptionChange event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid userId format", e));
        } catch (Exception e) {
            log.error("Unexpected error in DescriptionChange event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }

    /**
     * Xử lý event đấu giá kết thúc cho seller
     */
    private Mono<Void> handleAuctionEndedSellerEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String productId = payload.get("productId");
            String productName = payload.get("productName");
            String isSoldStr = payload.get("isSold");
            String finalPrice = payload.get("finalPrice");
            String totalBids = payload.get("totalBids");
            String auctionEndTime = payload.get("auctionEndTime");

            if (productId == null || 
                productName == null || isSoldStr == null || finalPrice == null || 
                auctionEndTime == null || totalBids == null) {
                log.error("Missing required fields in AuctionEnded seller event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in AuctionEnded seller event"));
            }

            Integer sellerId = Integer.parseInt(message.getUserId());
            boolean isSold = Boolean.parseBoolean(isSoldStr);

            log.debug("Sending auction ended email to seller: sellerId={}, productId={}, isSold={}", 
                sellerId, productId, isSold);
            
            return emailService.sendAuctionEndedSellerEmailWithNotification(
                    sellerId, productName, productId, isSold, 
                    finalPrice, totalBids, auctionEndTime
            )
            .doOnSuccess(v -> log.info("Auction ended email sent to seller: eventId={}, sellerId={}, productId={}, isSold={}", 
                message.getEventId(), sellerId, productId, isSold));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in AuctionEnded seller event: eventId={}, error={}", 
                message.getEventId(), e.getMessage());
            return Mono.error(new IllegalArgumentException("Invalid sellerId format", e));
        } catch (Exception e) {
            log.error("Unexpected error in AuctionEnded seller event handler: eventId={}, error={}", 
                message.getEventId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }
}
