package notification.service;


import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final NotificationService notificationService;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    private EmailService(JavaMailSender mailSender, TemplateEngine templateEngine,
                         NotificationService notificationService) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.notificationService = notificationService;
    }
    /**
     * Gửi email HTML với template (Reactive)
     */
    public Mono<Void> sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        return Mono.fromCallable(() -> {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);

            // Tạo context cho template
            Context context = new Context();
            context.setVariables(variables);

            // Process template
            String htmlContent = templateEngine.process(templateName, context);
            helper.setText(htmlContent, true);

            return message;
        })
        .flatMap(message -> Mono.fromRunnable(() -> mailSender.send(message))
            .subscribeOn(Schedulers.boundedElastic()))
        .doOnSuccess(v -> log.info("Email sent successfully to: {} with subject: {}", to, subject))
        .doOnError(e -> log.error("Failed to send email to: {}. Error: {}", to, e.getMessage(), e))
        .onErrorMap(MessagingException.class, e -> new RuntimeException("Failed to send email", e))
        .then();
    }

    /**
     * Gửi email OTP khi đăng ký tài khoản (Reactive)
     */
    public Mono<Void> sendOtpVerificationEmail(String to, String userName, String otp, int expiryMinutes) {
        Map<String, Object> variables = Map.of(
                "userName", userName,
                "otp", otp,
                "expiryMinutes", expiryMinutes
        );

        return sendHtmlEmail(to, "Verify Your Account - OTP Code", "otp-verification", variables);
    }

    /**
     * Gửi email thông báo bid thành công (Reactive)
     */
    public Mono<Void> sendBidSuccessEmail(String to, String userName, String productName, 
                                          String bidAmount, String productId, String bidTime, 
                                          String auctionEndTime) {
        Map<String, Object> variables = Map.of(
                "userName", userName,
                "productName", productName,
                "bidAmount", bidAmount,
                "productId", productId,
                "bidTime", bidTime,
                "auctionEndTime", auctionEndTime
        );

        return sendHtmlEmail(to, "Your Bid Has Been Successfully Placed", "bid-success", variables);
    }

    /**
     * Gửi email thông báo bid bị vượt (Reactive)
     */
    public Mono<Void> sendBidOutbidEmail(String to, String userName, String productName,
                                         String yourBidAmount, String newHighestBid, 
                                         String bidDifference, String outbidTime, 
                                         String auctionEndTime, String timeRemaining,
                                         String auctionLink) {
        Map<String, Object> variables = Map.of(
                "userName", userName,
                "productName", productName,
                "yourBidAmount", yourBidAmount,
                "newHighestBid", newHighestBid,
                "bidDifference", bidDifference,
                "outbidTime", outbidTime,
                "auctionEndTime", auctionEndTime,
                "timeRemaining", timeRemaining,
                "auctionLink", auctionLink
        );

        return sendHtmlEmail(to, "You Have Been Outbid", "bid-outbid", variables);
    }

    /**
     * Gửi email cảnh báo tài khoản vi phạm (Reactive)
     */
    public Mono<Void> sendAccountViolationWarningEmail(String to, String userName, 
                                                       String violationType, String violationDescription,
                                                       String detectionDate, String warningLevel,
                                                       String referenceNumber, String termsLink,
                                                       String guidelinesLink) {
        Map<String, Object> variables = Map.of(
                "userName", userName,
                "violationType", violationType,
                "violationDescription", violationDescription,
                "detectionDate", detectionDate,
                "warningLevel", warningLevel,
                "referenceNumber", referenceNumber,
                "termsLink", termsLink,
                "guidelinesLink", guidelinesLink
        );

        return sendHtmlEmail(to, "Account Violation Warning - Immediate Action Required", 
                            "account-violation-warning", variables);
    }

    /**
     * Lưu notification vào database (Helper method)
     */
    private Mono<Void> saveNotificationToDatabase(Integer userId, String notificationType, Map<String, Object> payloadMap) {
        return notificationService.saveNotificationWithJson(userId, notificationType, payloadMap)
                .doOnError(e -> log.warn("Failed to save notification to database: userId={}, type={}, error={}", 
                    userId, notificationType, e.getMessage()))
                .onErrorResume(e -> Mono.empty()) // Continue even if DB save fails
                .then();
    }

    /**
     * Gửi OTP email và lưu notification vào DB
     */
    public Mono<Void> sendOtpVerificationEmailWithNotification(String to, Integer userId, String userName, 
                                                               String otp, int expiryMinutes) {
        Map<String, Object> notificationPayload = Map.of(
                "email", to,
                "userName", userName,
                "type", "otp_verification",
                "timestamp", System.currentTimeMillis()
        );

        return sendOtpVerificationEmail(to, userName, otp, expiryMinutes)
                .then(saveNotificationToDatabase(userId, "OTP_VERIFICATION", notificationPayload));
    }

    /**
     * Gửi bid success email và lưu notification vào DB
     */
    public Mono<Void> sendBidSuccessEmailWithNotification(String to, Integer userId, String userName, 
                                                          String productName, String bidAmount, String productId, 
                                                          String bidTime, String auctionEndTime) {
        Map<String, Object> notificationPayload = Map.of(
                "email", to,
                "userName", userName,
                "productName", productName,
                "bidAmount", bidAmount,
                "productId", productId,
                "bidTime", bidTime,
                "auctionEndTime", auctionEndTime,
                "type", "bid_success"
        );

        return sendBidSuccessEmail(to, userName, productName, bidAmount, productId, bidTime, auctionEndTime)
                .then(saveNotificationToDatabase(userId, "BID_SUCCESS", notificationPayload));
    }

    /**
     * Gửi bid outbid email và lưu notification vào DB
     */
    public Mono<Void> sendBidOutbidEmailWithNotification(String to, Integer userId, String userName, 
                                                         String productName, String yourBidAmount, 
                                                         String newHighestBid, String bidDifference, 
                                                         String outbidTime, String auctionEndTime, 
                                                         String timeRemaining, String auctionLink) {
        Map<String, Object> notificationPayload = Map.of(
                "email", to,
                "userName", userName,
                "productName", productName,
                "yourBidAmount", yourBidAmount,
                "newHighestBid", newHighestBid,
                "bidDifference", bidDifference,
                "outbidTime", outbidTime,
                "auctionEndTime", auctionEndTime,
                "timeRemaining", timeRemaining,
                "type", "bid_outbid"
        );

        return sendBidOutbidEmail(to, userName, productName, yourBidAmount, newHighestBid, 
                bidDifference, outbidTime, auctionEndTime, timeRemaining, auctionLink)
                .then(saveNotificationToDatabase(userId, "BID_OUTBID", notificationPayload));
    }

    /**
     * Gửi account violation warning email và lưu notification vào DB
     */
    public Mono<Void> sendAccountViolationWarningEmailWithNotification(String to, Integer userId, String userName, 
                                                                       String violationType, String violationDescription,
                                                                       String detectionDate, String warningLevel,
                                                                       String referenceNumber, String termsLink,
                                                                       String guidelinesLink) {
        Map<String, Object> notificationPayload = Map.of(
                "email", to,
                "userName", userName,
                "violationType", violationType,
                "violationDescription", violationDescription,
                "detectionDate", detectionDate,
                "warningLevel", warningLevel,
                "referenceNumber", referenceNumber,
                "type", "account_violation_warning"
        );

        return sendAccountViolationWarningEmail(to, userName, violationType, violationDescription,
                detectionDate, warningLevel, referenceNumber, termsLink, guidelinesLink)
                .then(saveNotificationToDatabase(userId, "ACCOUNT_VIOLATION_WARNING", notificationPayload));
    }

    /**
     * Gửi product banned user email và lưu notification vào DB
     * Note: Cần fetch thông tin user (email, userName) từ user service
     * Tạm thời sử dụng userId để gửi thông báo
     */
    public Mono<Void> sendProductBannedUserEmailWithNotification(Integer userId, String productName,
                                                                 String productId, String reason, String banTime) {
        // TODO: Fetch user info from user service to get email and userName
        // For now, we'll just save notification to database
        // When user service integration is ready, add email sending
        
        Map<String, Object> notificationPayload = Map.of(
                "userId", userId,
                "productName", productName,
                "productId", productId,
                "reason", reason,
                "banTime", banTime,
                "type", "product_banned_user"
        );

        log.info("Saving product ban notification for userId={}, productId={}", userId, productId);
        
        // Only save notification for now, email will be added when user service integration is ready
        return saveNotificationToDatabase(userId, "PRODUCT_BANNED_USER", notificationPayload)
                .doOnSuccess(v -> log.info("Product ban notification saved: userId={}, productId={}", userId, productId));
        
        // Uncomment below when user service is integrated:
        /*
        return userServiceClient.getUserById(userId)
            .flatMap(user -> sendProductBannedUserEmail(
                user.getEmail(), user.getFullName(), productName, productId, reason, banTime
            ))
            .then(saveNotificationToDatabase(userId, "PRODUCT_BANNED_USER", notificationPayload));
        */
    }

    /**
     * Gửi auction ended email và lưu notification vào DB
     * Note: Cần fetch thông tin user (email, userName) từ user service
     * Tạm thời sử dụng userId để gửi thông báo
     */
    public Mono<Void> sendAuctionEndedEmailWithNotification(Integer userId, String productName,
                                                            String productId, boolean isWinner,
                                                            String winningAmount, String yourBidAmount,
                                                            String auctionEndTime, String totalBids) {
        // TODO: Fetch user info from user service to get email and userName
        // For now, we'll just save notification to database
        // When user service integration is ready, add email sending
        
        Map<String, Object> notificationPayload = Map.of(
                "userId", userId,
                "productName", productName,
                "productId", productId,
                "isWinner", isWinner,
                "winningAmount", winningAmount,
                "yourBidAmount", yourBidAmount != null ? yourBidAmount : "0",
                "auctionEndTime", auctionEndTime,
                "totalBids", totalBids,
                "type", "auction_ended"
        );

        log.info("Saving auction ended notification for userId={}, productId={}, isWinner={}", 
            userId, productId, isWinner);
        
        // Only save notification for now, email will be added when user service is integrated
        String notificationType = isWinner ? "AUCTION_WON" : "AUCTION_ENDED";
        return saveNotificationToDatabase(userId, notificationType, notificationPayload)
                .doOnSuccess(v -> log.info("Auction ended notification saved: userId={}, productId={}, isWinner={}", 
                    userId, productId, isWinner));
        
        // Uncomment below when user service is integrated:
        /*
        return userServiceClient.getUserById(userId)
            .flatMap(user -> sendAuctionEndedEmail(
                user.getEmail(), user.getFullName(), productName, productId, 
                isWinner, winningAmount, yourBidAmount, auctionEndTime, totalBids
            ))
            .then(saveNotificationToDatabase(userId, notificationType, notificationPayload));
        */
    }

    /**
     * Gửi auction ended seller email và lưu notification vào DB
     * Note: Cần fetch thông tin seller từ user service
     * Tạm thời sử dụng sellerId để gửi thông báo
     */
    public Mono<Void> sendAuctionEndedSellerEmailWithNotification(Integer sellerId, String productName,
                                                                  String productId, boolean isSold,
                                                                  String finalPrice, String winnerName,
                                                                  String totalBids, String auctionEndTime) {
        // TODO: Fetch seller info from user service to get email and userName
        // For now, we'll just save notification to database
        // When user service integration is ready, add email sending
        
        Map<String, Object> notificationPayload = Map.of(
                "sellerId", sellerId,
                "productName", productName,
                "productId", productId,
                "isSold", isSold,
                "finalPrice", finalPrice,
                "winnerName", winnerName != null ? winnerName : "N/A",
                "totalBids", totalBids,
                "auctionEndTime", auctionEndTime,
                "type", "auction_ended_seller"
        );

        log.info("Saving auction ended seller notification for sellerId={}, productId={}, isSold={}", 
            sellerId, productId, isSold);
        
        // Only save notification for now, email will be added when user service is integrated
        String notificationType = isSold ? "AUCTION_SOLD" : "AUCTION_ENDED_NO_SALE";
        return saveNotificationToDatabase(sellerId, notificationType, notificationPayload)
                .doOnSuccess(v -> log.info("Auction ended seller notification saved: sellerId={}, productId={}, isSold={}", 
                    sellerId, productId, isSold));
        
        // Uncomment below when user service is integrated:
        /*
        return userServiceClient.getUserById(sellerId)
            .flatMap(seller -> sendAuctionEndedSellerEmail(
                seller.getEmail(), seller.getFullName(), productName, productId,
                isSold, finalPrice, winnerName, totalBids, auctionEndTime
            ))
            .then(saveNotificationToDatabase(sellerId, notificationType, notificationPayload));
        */
    }
}

