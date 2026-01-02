package gateway.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/payment")
@Tag(name = "Payment", description = "Payment endpoints - requires authentication")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {
    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Value("${stripe.secret.key:sk_test_YOUR_SECRET_KEY}")
    private String stripeSecretKey;

    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }

    @PostMapping("/create-payment-intent")
    @Operation(summary = "Create payment intent", description = "Create a Stripe payment intent for checkout. Requires authentication.")
    public ResponseEntity<Map<String, Object>> createPaymentIntent(
            @RequestBody Map<String, Object> requestBody) {
        
        int userId = getUserId();
        Double amount = Double.parseDouble(requestBody.get("amount").toString());
        String currency = requestBody.getOrDefault("currency", "usd").toString();
        
        log.info("Create payment intent request - userId: {}, amount: {}, currency: {}", userId, amount, currency);

        try {
            // Initialize Stripe with secret key
            Stripe.apiKey = stripeSecretKey;

            // Convert amount to cents (Stripe uses smallest currency unit)
            long amountInCents = Math.round(amount * 100);

            // Create payment intent
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(currency.toLowerCase())
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build())
                    .putMetadata("userId", String.valueOf(userId))
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientSecret", paymentIntent.getClientSecret());
            response.put("paymentIntentId", paymentIntent.getId());

            log.info("Payment intent created successfully - paymentIntentId: {}", paymentIntent.getId());
            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create payment intent: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            log.error("Error creating payment intent: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create payment intent: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/confirm-payment")
    @Operation(summary = "Confirm payment", description = "Confirm a payment after successful Stripe payment. Requires authentication.")
    public ResponseEntity<Map<String, Object>> confirmPayment(
            @RequestBody Map<String, Object> requestBody) {
        
        int userId = getUserId();
        String paymentIntentId = requestBody.get("paymentIntentId").toString();
        
        log.info("Confirm payment request - userId: {}, paymentIntentId: {}", userId, paymentIntentId);

        try {
            Stripe.apiKey = stripeSecretKey;
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

            Map<String, Object> response = new HashMap<>();
            
            if ("succeeded".equals(paymentIntent.getStatus())) {
                response.put("success", true);
                response.put("message", "Payment confirmed successfully");
                response.put("paymentIntentId", paymentIntentId);
                response.put("amount", paymentIntent.getAmount() / 100.0);
                
                // TODO: Update order status in database here
                // Example: orderService.updateOrderStatus(orderId, "paid");
                
                log.info("Payment confirmed successfully - paymentIntentId: {}", paymentIntentId);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Payment not succeeded. Status: " + paymentIntent.getStatus());
                return ResponseEntity.badRequest().body(response);
            }

        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to confirm payment: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            log.error("Error confirming payment: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to confirm payment: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

