package gateway.grpc;

import com.auction.utils.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auctionplatform.payment.grpc.*;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import reactor.core.publisher.Mono;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import java.util.concurrent.TimeUnit;

@Component
public class PaymentGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(PaymentGrpcClient.class);

    @Value("${grpc.product-service.host:localhost}")
    private String productServiceHost;

    @Value("${grpc.product-service.port:9091}")
    private int productServicePort;

    private ReactorPaymentServiceGrpc.ReactorPaymentServiceStub paymentServiceStub;
    private ManagedChannel channel;


    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(productServiceHost, productServicePort)
                .usePlaintext()
                .keepAliveTime(10, TimeUnit.SECONDS)
                .keepAliveTimeout(10, TimeUnit.SECONDS)
                .build();

        paymentServiceStub = ReactorPaymentServiceGrpc.newReactorStub(channel);

        log.info("gRPC Guest Service client initialized: {}:{}", productServiceHost, productServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC Guest Service channel shutdown");
        }
    }

    public Mono<UpdateOrderStatusResponse>  updateOrderStatus(UpdateOrderStatusRequest request) {
        log.info("gRPC update order status request: {}", JsonUtils.toJson(request));
        return paymentServiceStub.updateOrderStatus(Mono.just(request));
    }
}
