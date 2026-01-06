package products.grpc;

import com.auction.utils.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.auctionplatform.payment.grpc.UpdateOrderStatusRequest;
import com.auctionplatform.payment.grpc.UpdateOrderStatusResponse;
import com.auctionplatform.payment.grpc.ReactorPaymentServiceGrpc;

import org.springframework.grpc.server.service.GrpcService;
import products.service.PaymentService;
import reactor.core.publisher.Mono;

/**
 * gRPC implementation of PaymentService
 * Gateway will call this service for payment-related functionality
 */
@GrpcService
public class PaymentGrpcService extends ReactorPaymentServiceGrpc.PaymentServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(PaymentGrpcService.class);
    
    private final PaymentService paymentService;
    
    public PaymentGrpcService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
    
    @Override
    public Mono<UpdateOrderStatusResponse> updateOrderStatus(Mono<UpdateOrderStatusRequest> request) {
        return request
            .doOnNext(req -> log.info("Raw update order status request: {}", JsonUtils.toJson(req)))
            .flatMap(req -> {
                Integer orderId = req.getOrderId();
                String status = req.getStatus();

                return switch (status.toLowerCase()) {
                    case "paid" -> paymentService.updateOrderStatusToPaid(orderId);
                    case "completed" -> paymentService.updateOrderStatusToCompleted(orderId);
                    case "cancelled" -> paymentService.updateOrderStatusToCancelled(orderId);
                    default -> {
                        log.warn("Unknown status: {}", status);
                        yield Mono.error(new IllegalArgumentException("Unknown status: " + status));
                    }
                };
            })
            .map(order -> {
                log.info("Order status updated successfully via gRPC - orderId: {}", order.getId());
                return UpdateOrderStatusResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Order status updated successfully")
                    .setOrderId(order.getId())
                    .setStatus(order.getStatus())
                    .build();
            })
            .onErrorResume(e -> {
                log.error("Error updating order status via gRPC: {}", e.getMessage(), e);
                return Mono.just(UpdateOrderStatusResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Error: " + e.getMessage())
                    .build());
            });
    }
}
