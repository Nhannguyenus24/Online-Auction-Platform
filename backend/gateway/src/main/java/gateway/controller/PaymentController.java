package gateway.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.auction.proto.user.GetOrderByIdRequest;
import com.auction.proto.user.GetOrderByIdResponse;
import com.auction.proto.user.UpdateOrderPaymentIntentRequest;
import com.auction.proto.user.UpdateOrderPaymentIntentResponse;
import com.stripe.exception.StripeException;

import gateway.grpc.BidderGrpcClient;
import gateway.service.StripeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Payment", description = "Payment endpoints - requires authentication")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {
    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    
    private final StripeService stripeService;
    private final BidderGrpcClient bidderGrpcClient;
    
    public PaymentController(StripeService stripeService, BidderGrpcClient bidderGrpcClient) {
        this.stripeService = stripeService;
        this.bidderGrpcClient = bidderGrpcClient;
    }
    
    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }
    
    @PostMapping("/create-payment-intent")
    @Operation(summary = "Create payment intent", description = "Create a Stripe payment intent for an order. Requires authentication.")
    public ResponseEntity<Map<String, Object>> createPaymentIntent(
            @RequestBody Map<String, Object> requestBody) {
        
        int userId = getUserId();
        log.info("Create payment intent request - userId: {}", userId);
        
        try {
            // Extract parameters
            Integer orderId = null;
            Double amount = null;
            String currency = "usd";
            
            if (requestBody.containsKey("orderId")) {
                Object orderIdObj = requestBody.get("orderId");
                if (orderIdObj != null) {
                    orderId = Integer.parseInt(orderIdObj.toString());
                }
            }
            
            if (requestBody.containsKey("amount")) {
                Object amountObj = requestBody.get("amount");
                if (amountObj != null) {
                    amount = Double.parseDouble(amountObj.toString());
                }
            }
            
            if (requestBody.containsKey("currency")) {
                currency = requestBody.get("currency").toString();
            }
            
            // Validate input
            if (orderId == null && amount == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Either orderId or amount must be provided");
                return ResponseEntity.badRequest().body(error);
            }
            
            // If orderId is provided, fetch order to get amount
            if (orderId != null) {
                log.info("Fetching order {} to get amount", orderId);
                GetOrderByIdRequest grpcRequest = GetOrderByIdRequest.newBuilder()
                    .setOrderId(orderId)
                    .setUserId(userId)
                    .build();
                
                GetOrderByIdResponse grpcResponse = bidderGrpcClient.getOrderById(grpcRequest)
                    .block(java.time.Duration.ofSeconds(10));
                
                if (grpcResponse == null || !grpcResponse.getSuccess()) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", grpcResponse != null ? grpcResponse.getMessage() : "Failed to fetch order");
                    return ResponseEntity.badRequest().body(error);
                }
                
                // Verify user is the buyer
                if (grpcResponse.getOrder().getBuyerId() != userId) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Unauthorized: You don't have access to this order");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
                }
                
                // Use order amount if amount not provided
                if (amount == null) {
                    amount = grpcResponse.getOrder().getAmount();
                }
                
                log.info("Order {} found - amount: {}, buyerId: {}", orderId, amount, grpcResponse.getOrder().getBuyerId());
            }
            
            // Validate amount
            if (amount == null || amount <= 0) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Invalid amount: amount must be greater than 0");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Create Stripe payment intent
            com.stripe.model.PaymentIntent paymentIntent = stripeService.createPaymentIntent(
                amount, currency, orderId, userId);
            
            // Update order with payment intent ID if orderId was provided
            if (orderId != null) {
                log.info("Updating order {} with payment intent ID: {}", orderId, paymentIntent.getId());
                UpdateOrderPaymentIntentRequest updateRequest = UpdateOrderPaymentIntentRequest.newBuilder()
                    .setOrderId(orderId)
                    .setUserId(userId)
                    .setStripePaymentIntentId(paymentIntent.getId())
                    .setPaymentStatus("pending")
                    .build();
                
                UpdateOrderPaymentIntentResponse updateResponse = bidderGrpcClient.updateOrderPaymentIntent(updateRequest)
                    .block(java.time.Duration.ofSeconds(10));
                
                if (updateResponse == null || !updateResponse.getSuccess()) {
                    log.warn("Failed to update order with payment intent ID, but payment intent was created. " +
                        "OrderId: {}, PaymentIntentId: {}", orderId, paymentIntent.getId());
                    // Continue anyway - payment intent was created successfully
                }
            }
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment intent created successfully");
            response.put("clientSecret", paymentIntent.getClientSecret());
            response.put("paymentIntentId", paymentIntent.getId());
            response.put("amount", amount);
            response.put("currency", currency);
            if (orderId != null) {
                response.put("orderId", orderId);
            }
            
            log.info("Payment intent created successfully - paymentIntentId: {}, orderId: {}", 
                paymentIntent.getId(), orderId);
            return ResponseEntity.ok(response);
            
        } catch (StripeException e) {
            log.error("Stripe error creating payment intent: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create payment intent: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (NumberFormatException e) {
            log.error("Invalid number format in request: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid number format: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Error creating payment intent: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create payment intent: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
