package notification.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auction.entities.msg.RabbitMessage;
import com.auction.rabbitmq.model.MessageWrapper;
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
            case TASK_SEND_MAIL_SUCCESS_BID -> handleBidSuccessEvent(message);
            case TASK_SEND_MAIL_OUTBID -> handleBidOutbidEvent(message);
            case TASK_SEND_MAIL_ACCOUNT_VIOLATION -> handleAccountViolationEvent(message);
            case TASK_SEND_NOTIFICATION, TASK_DELETE_NOTIFICATION, TASK_READ_NOTIFICATION -> Mono.empty().then();
            default -> {
                log.error("Unknown event type: {}", message.getEventType());
                yield Mono.empty().then();
            }
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
            Integer expiryMinutes = Integer.parseInt(expiryMinutesStr);

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
     * Xử lý event bid success
     */
    private Mono<Void> handleBidSuccessEvent(RabbitMessage message) {
        try {
            Map<String, String> payload = message.getPayload();
            
            String email = payload.get("email");
            String userName = payload.get("userName");
            String productName = payload.get("productName");
            String productId = payload.get("productId");
            String bidAmount = payload.get("bidAmount");
            String bidTime = payload.get("bidTime");
            String auctionEndTime = payload.get("auctionEndTime");

            if (email == null || userName == null || productName == null || 
                productId == null || bidAmount == null || bidTime == null || auctionEndTime == null) {
                log.error("Missing required fields in BidSuccess event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in bid success event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending bid success email: email={}, userId={}, productId={}", 
                email, userId, productId);
            
            return emailService.sendBidSuccessEmailWithNotification(
                    email, userId, userName, productName, bidAmount, productId, bidTime, auctionEndTime
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
            
            String email = payload.get("email");
            String userName = payload.get("userName");
            String productName = payload.get("productName");
            String productId = payload.get("productId");
            String yourBidAmount = payload.get("yourBidAmount");
            String newHighestBid = payload.get("newHighestBid");
            String bidDifference = payload.get("bidDifference");
            String outbidTime = payload.get("outbidTime");
            String auctionEndTime = payload.get("auctionEndTime");
            String timeRemaining = payload.get("timeRemaining");
            String auctionLink = payload.get("auctionLink");

            if (email == null || userName == null || productName == null || 
                productId == null || yourBidAmount == null || newHighestBid == null || 
                bidDifference == null || outbidTime == null || auctionEndTime == null || 
                timeRemaining == null || auctionLink == null) {
                log.error("Missing required fields in BidOutbid event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in bid outbid event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending bid outbid email: email={}, userId={}, productId={}", 
                email, userId, productId);
            
            return emailService.sendBidOutbidEmailWithNotification(
                    email, userId, userName, productName, yourBidAmount, newHighestBid,
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
            
            String email = payload.get("email");
            String userName = payload.get("userName");
            String violationType = payload.get("violationType");
            String violationDescription = payload.get("violationDescription");
            String detectionDate = payload.get("detectionDate");
            String warningLevel = payload.get("warningLevel");
            String referenceNumber = payload.get("referenceNumber");
            String termsLink = payload.get("termsLink");
            String guidelinesLink = payload.get("guidelinesLink");

            if (email == null || userName == null || violationType == null || 
                violationDescription == null || detectionDate == null || warningLevel == null || 
                referenceNumber == null || termsLink == null || guidelinesLink == null) {
                log.error("Missing required fields in AccountViolation event: eventId={}", message.getEventId());
                return Mono.error(new IllegalArgumentException("Missing required fields in account violation event"));
            }

            Integer userId = Integer.parseInt(message.getUserId());

            log.debug("Sending account violation warning email: email={}, userId={}, refNumber={}", 
                email, userId, referenceNumber);
            
            return emailService.sendAccountViolationWarningEmailWithNotification(
                    email, userId, userName, violationType, violationDescription,
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
     * Consume RabbitMessage từ queue
     */
    public Mono<Void> startConsumingMessages(String queueName) {
        return Mono.fromRunnable(() -> {
            // Consume MessageWrapper from user service (OTP emails)
            rabbitConsumer.consumeMessages(
                    queueName,
                    MessageWrapper.class,
                    this::handleMessageWrapper
            ).subscribe(
                unused -> {},
                error -> log.error("Error consuming MessageWrapper from queue: {}", queueName, error)
            );
            
            // Also consume legacy RabbitMessage format
            rabbitConsumer.consumeMessages(
                    queueName,
                    RabbitMessage.class,
                    this::handleRabbitMessage
            ).subscribe(
                unused -> {},
                error -> log.error("Error consuming RabbitMessage from queue: {}", queueName, error)
            );
        });
    }
    
    /**
     * Handle MessageWrapper from user service (new format)
     */
    @SuppressWarnings("unchecked")
    private Mono<Void> handleMessageWrapper(MessageWrapper<?> wrapper) {
        log.info("Processing MessageWrapper: messageId={}, messageType={}, source={}", 
            wrapper.getMessageId(), wrapper.getMessageType(), wrapper.getSource());

        if (wrapper.getPayload() == null) {
            log.error("Invalid payload in MessageWrapper: messageId={}, messageType={}", 
                wrapper.getMessageId(), wrapper.getMessageType());
            return Mono.error(new IllegalArgumentException("Payload cannot be null"));
        }

        return (switch (wrapper.getMessageType()) {
            case "EMAIL_OTP" -> handleEmailOtpMessage((MessageWrapper<Map<String, Object>>) wrapper);
            default -> {
                log.warn("Unknown message type: {}", wrapper.getMessageType());
                yield Mono.empty();
            }
        })
        .then()
        .doOnError(e -> log.error("Error processing MessageWrapper: messageId={}, error={}", 
            wrapper.getMessageId(), e.getMessage(), e))
        .onErrorResume(e -> Mono.empty()); // Continue processing even if error
    }
    
    /**
     * Handle EMAIL_OTP message from user service
     */
    private Mono<Void> handleEmailOtpMessage(MessageWrapper<Map<String, Object>> wrapper) {
        try {
            Map<String, Object> payload = wrapper.getPayload();
            
            String email = (String) payload.get("to");
            String otp = (String) payload.get("otp");
            String type = (String) payload.get("type");

            if (email == null || otp == null) {
                log.error("Missing required fields in EMAIL_OTP message: messageId={}", wrapper.getMessageId());
                return Mono.error(new IllegalArgumentException("Missing required fields: to, otp"));
            }

            log.info("Sending OTP email to: {}, OTP: {}", email, otp);
            
            // Send simple OTP email without notification
            return emailService.sendOtpVerificationEmail(email, email, otp, 10)
                .doOnSuccess(v -> log.info("OTP email sent successfully: messageId={}, email={}", 
                    wrapper.getMessageId(), email))
                .doOnError(e -> log.error("Failed to send OTP email: messageId={}, email={}", 
                    wrapper.getMessageId(), email, e));
        } catch (Exception e) {
            log.error("Unexpected error in EMAIL_OTP handler: messageId={}, error={}", 
                wrapper.getMessageId(), e.getMessage(), e);
            return Mono.error(e);
        }
    }
}
