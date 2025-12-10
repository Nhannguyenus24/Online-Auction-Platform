package user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

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
     * Gửi email text đơn giản (Reactive)
     */
    public Mono<Void> sendSimpleEmail(String to, String subject, String text) {
        return Mono.fromRunnable(() -> {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
        })
        .subscribeOn(Schedulers.boundedElastic())
        .doOnSuccess(v -> log.info("Simple email sent successfully to: {} with subject: {}", to, subject))
        .doOnError(e -> log.error("Failed to send simple email to: {}. Error: {}", to, e.getMessage(), e))
        .onErrorMap(e -> new RuntimeException("Failed to send email", e))
        .then();
    }
}
