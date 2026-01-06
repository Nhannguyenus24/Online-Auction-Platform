package gateway.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.auctionplatform.payment.grpc.UpdateOrderStatusRequest;
import com.auctionplatform.payment.grpc.UpdateOrderStatusResponse;
import com.auctionplatform.payment.grpc.ReactorPaymentServiceGrpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import reactor.core.publisher.Mono;

@Component
public class PaymentGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(PaymentGrpcClient.class);
    
    private final ReactorPaymentServiceGrpc.ReactorPaymentServiceStub paymentServiceStub;
    private final ManagedChannel channel;
    
    public PaymentGrpcClient(
        org.springframework.beans.factory.annotation.Value("${grpc.payment.host:localhost}") String host,
        org.springframework.beans.factory.annotation.Value("${grpc.payment.port:9004}") int port) {
        
        this.channel = ManagedChannelBuilder
            .forAddress(host, port)
            .usePlaintext()
            .build();
        
        this.paymentServiceStub = ReactorPaymentServiceGrpc.newReactorStub(channel);
        
        log.info("PaymentGrpcClient initialized - host: {}, port: {}", host, port);
    }
    
    /**
     * Call gRPC service to update order status to 'paid' after successful payment
     * @param orderId the order ID
     * @return UpdateOrderStatusResponse
     */
    public Mono<UpdateOrderStatusResponse> updateOrderStatusToPaid(Integer orderId) {
        log.info("Calling PaymentService gRPC to update order status to paid - orderId: {}", orderId);
        
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.newBuilder()
            .setOrderId(orderId)
            .setStatus("paid")
            .build();
        
        return paymentServiceStub.updateOrderStatus(Mono.just(request))
            .doOnNext(response -> log.info("Order status updated via gRPC - orderId: {}, success: {}", 
                orderId, response.getSuccess()))
            .doOnError(e -> log.error("Error calling PaymentService gRPC - orderId: {}, error: {}", 
                orderId, e.getMessage(), e));
    }
    
    /**
     * Call gRPC service to update order status to 'completed'
     * @param orderId the order ID
     * @return UpdateOrderStatusResponse
     */
    public Mono<UpdateOrderStatusResponse> updateOrderStatusToCompleted(Integer orderId) {
        log.info("Calling PaymentService gRPC to update order status to completed - orderId: {}", orderId);
        
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.newBuilder()
            .setOrderId(orderId)
            .setStatus("completed")
            .build();
        
        return paymentServiceStub.updateOrderStatus(Mono.just(request))
            .doOnNext(response -> log.info("Order status updated via gRPC - orderId: {}, success: {}", 
                orderId, response.getSuccess()))
            .doOnError(e -> log.error("Error calling PaymentService gRPC - orderId: {}, error: {}", 
                orderId, e.getMessage(), e));
    }
    
    /**
     * Call gRPC service to update order status to 'cancelled'
     * @param orderId the order ID
     * @return UpdateOrderStatusResponse
     */
    public Mono<UpdateOrderStatusResponse> updateOrderStatusToCancelled(Integer orderId) {
        log.info("Calling PaymentService gRPC to update order status to cancelled - orderId: {}", orderId);
        
        UpdateOrderStatusRequest request = UpdateOrderStatusRequest.newBuilder()
            .setOrderId(orderId)
            .setStatus("cancelled")
            .build();
        
        return paymentServiceStub.updateOrderStatus(Mono.just(request))
            .doOnNext(response -> log.info("Order status updated via gRPC - orderId: {}, success: {}", 
                orderId, response.getSuccess()))
            .doOnError(e -> log.error("Error calling PaymentService gRPC - orderId: {}, error: {}", 
                orderId, e.getMessage(), e));
    }
    
    /**
     * Shutdown the channel
     */
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdownNow();
            log.info("PaymentGrpcClient channel shut down");
        }
    }
}
