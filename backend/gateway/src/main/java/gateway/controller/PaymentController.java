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

import com.auction.proto.user.ConfirmPaymentRequest;
import com.auction.proto.user.ConfirmPaymentResponse;
import com.auction.proto.user.GetOrderByIdRequest;
import com.auction.proto.user.GetOrderByIdResponse;
import com.auction.proto.user.UpdateOrderPaymentIntentRequest;
import com.auction.proto.user.UpdateOrderPaymentIntentResponse;
import com.auction.dto.ApiResponse;
import com.auction.utils.ValidationUtils;
import com.stripe.exception.StripeException;
import org.springframework.web.bind.annotation.PathVariable;

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
    private static final String INVALID_AMOUNT = "Invalid amount: amount must be greater than 0";
    private static final String PAYMENT_INTENT_REQUIRED = "Either orderId or amount must be provided";
    private static final String ORDER_ID_REQUIRED = "orderId is required";
    private static final String PAYMENT_INTENT_ID_REQUIRED = "paymentIntentId is required";

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
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPaymentIntent(
            @RequestBody Map<String, Object> requestBody) {

        int userId = getUserId();
        log.info("Create payment intent request [userId={}]", userId);

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
                log.warn("Neither orderId nor amount provided [userId={}]", userId);
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(PAYMENT_INTENT_REQUIRED));
            }

            // If orderId is provided, fetch order to get amount
            if (orderId != null) {
                log.debug("Fetching order [userId={}, orderId={}] to get amount", userId, orderId);
                GetOrderByIdRequest grpcRequest = GetOrderByIdRequest.newBuilder()
                    .setOrderId(orderId)
                    .setUserId(userId)
                    .build();

                GetOrderByIdResponse grpcResponse = bidderGrpcClient.getOrderById(grpcRequest)
                    .block(java.time.Duration.ofSeconds(10));

                if (grpcResponse == null || !grpcResponse.getSuccess()) {
                    log.warn("Failed to fetch order [userId={}, orderId={}]", userId, orderId);
                    String message = grpcResponse != null ? grpcResponse.getMessage() : "Failed to fetch order";
                    return ResponseEntity.badRequest().body(ApiResponse.badRequest(message));
                }

                // Verify user is the buyer
                if (grpcResponse.getOrder().getBuyerId() != userId) {
                    log.error("Unauthorized access to order [userId={}, orderId={}, buyerId={}]", userId, orderId, grpcResponse.getOrder().getBuyerId());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.forbidden("You don't have access to this order"));
                }

                // Use order amount if amount not provided
                if (amount == null) {
                    amount = grpcResponse.getOrder().getAmount();
                }

                log.debug("Order found [userId={}, orderId={}, amount={}]", userId, orderId, amount);
            }

            // Validate amount
            if (amount == null || amount <= 0) {
                log.warn("Invalid amount [userId={}, amount={}]", userId, amount);
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_AMOUNT));
            }

            // Create Stripe payment intent
            com.stripe.model.PaymentIntent paymentIntent = stripeService.createPaymentIntent(
                amount, currency, orderId, userId);

            // Extract shipping address if provided
            String shippingAddress = null;
            if (requestBody.containsKey("shippingAddress")) {
                Object shippingAddressObj = requestBody.get("shippingAddress");
                if (shippingAddressObj != null) {
                    shippingAddress = shippingAddressObj.toString();
                }
            }

            // Update order with payment intent ID if orderId was provided
            if (orderId != null) {
                log.debug("Updating order [userId={}, orderId={}] with payment intent", userId, orderId);
                UpdateOrderPaymentIntentRequest.Builder updateRequestBuilder = UpdateOrderPaymentIntentRequest.newBuilder()
                    .setOrderId(orderId)
                    .setUserId(userId)
                    .setStripePaymentIntentId(paymentIntent.getId())
                    .setPaymentStatus("pending");

                if (shippingAddress != null && !shippingAddress.trim().isEmpty()) {
                    updateRequestBuilder.setShippingAddress(shippingAddress);
                }

                UpdateOrderPaymentIntentResponse updateResponse = bidderGrpcClient.updateOrderPaymentIntent(updateRequestBuilder.build())
                    .block(java.time.Duration.ofSeconds(10));

                if (updateResponse == null || !updateResponse.getSuccess()) {
                    log.warn("Failed to update order [userId={}, orderId={}], continuing with payment intent", userId, orderId);
                }
            }

            // Build response
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("clientSecret", paymentIntent.getClientSecret());
            responseData.put("paymentIntentId", paymentIntent.getId());
            responseData.put("amount", amount);
            responseData.put("currency", currency);
            if (orderId != null) {
                responseData.put("orderId", orderId);
            }

            log.info("Payment intent created successfully [userId={}, paymentIntentId={}, orderId={}]",
                userId, paymentIntent.getId(), orderId);
            return ResponseEntity.ok(ApiResponse.ok(responseData));

        } catch (StripeException e) {
            log.error("Stripe error creating payment intent [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to create payment intent: " + e.getMessage()));
        } catch (NumberFormatException e) {
            log.error("Invalid number format in request [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.badRequest("Invalid number format: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating payment intent [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to create payment intent: " + e.getMessage()));
        }
    }
    
    @PostMapping("/confirm-payment")
    @Operation(summary = "Confirm payment", description = "Confirm a successful payment and update order status. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmPayment(
            @RequestBody Map<String, Object> requestBody) {

        int userId = getUserId();
        log.info("Confirm payment request [userId={}]", userId);

        try {
            // Extract parameters
            Integer orderId = null;
            String paymentIntentId = null;

            if (requestBody.containsKey("orderId")) {
                Object orderIdObj = requestBody.get("orderId");
                if (orderIdObj != null) {
                    orderId = Integer.parseInt(orderIdObj.toString());
                }
            }

            if (requestBody.containsKey("paymentIntentId")) {
                Object paymentIntentIdObj = requestBody.get("paymentIntentId");
                if (paymentIntentIdObj != null) {
                    paymentIntentId = paymentIntentIdObj.toString();
                }
            }

            // Validate input
            if (orderId == null) {
                log.warn("Missing orderId [userId={}]", userId);
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(ORDER_ID_REQUIRED));
            }

            if (paymentIntentId == null || paymentIntentId.trim().isEmpty()) {
                log.warn("Missing paymentIntentId [userId={}]", userId);
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(PAYMENT_INTENT_ID_REQUIRED));
            }

            // Confirm payment
            ConfirmPaymentRequest grpcRequest = ConfirmPaymentRequest.newBuilder()
                .setOrderId(orderId)
                .setUserId(userId)
                .setPaymentIntentId(paymentIntentId)
                .build();

            ConfirmPaymentResponse grpcResponse = bidderGrpcClient.confirmPayment(grpcRequest)
                .block(java.time.Duration.ofSeconds(10));

            if (grpcResponse == null || !grpcResponse.getSuccess()) {
                log.warn("Failed to confirm payment [userId={}, orderId={}, message={}]", userId, orderId,
                    grpcResponse != null ? grpcResponse.getMessage() : "null response");
                String message = grpcResponse != null ? grpcResponse.getMessage() : "Failed to confirm payment";
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(message));
            }

            // Build response
            Map<String, Object> orderData = new HashMap<>();
            orderData.put("id", grpcResponse.getOrder().getId());
            orderData.put("paymentStatus", grpcResponse.getOrder().getPaymentStatus());

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("order", orderData);

            log.info("Payment confirmed successfully [userId={}, orderId={}, paymentIntentId={}]", userId, orderId, paymentIntentId);
            return ResponseEntity.ok(ApiResponse.ok(responseData));

        } catch (NumberFormatException e) {
            log.error("Invalid number format in request [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.badRequest("Invalid number format: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error confirming payment [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to confirm payment: " + e.getMessage()));
        }
    }
}
