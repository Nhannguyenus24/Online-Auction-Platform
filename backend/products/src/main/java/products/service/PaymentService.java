package products.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auction.entities.database.Order;
import com.auction.entities.msg.EventType;
import com.auction.entities.msg.RabbitMessage;
import com.auction.rabbitmq.services.ReactiveRabbitProducer;

import products.repository.OrderRepository;
import reactor.core.publisher.Mono;

@Service
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private final OrderRepository orderRepository;
    private final ReactiveRabbitProducer rabbitProducer;
    
    private static final String NOTIFICATION_QUEUE = "dev";
    
    public PaymentService(OrderRepository orderRepository, ReactiveRabbitProducer rabbitProducer) {
        this.orderRepository = orderRepository;
        this.rabbitProducer = rabbitProducer;
    }
    
    /**
     * Update order status to 'paid' after successful payment
     * @param orderId the order ID
     * @return the updated order
     */
    @Transactional
    public Mono<Order> updateOrderStatusToPaid(Integer orderId) {
        return updateOrderStatus(orderId, "paid", order -> order.getSellerId(),
            "Order #%d has been paid by buyer");
    }
    
    /**
     * Update order status to 'completed' after shipment
     * @param orderId the order ID
     * @return the updated order
     */
    @Transactional
    public Mono<Order> updateOrderStatusToCompleted(Integer orderId) {
        return updateOrderStatus(orderId, "completed", order -> order.getBuyerId(),
            "Your order #%d has been completed");
    }
    
    /**
     * Update order status to 'cancelled'
     * @param orderId the order ID
     * @return the updated order
     */
    @Transactional
    public Mono<Order> updateOrderStatusToCancelled(Integer orderId) {
        return updateOrderStatus(orderId, "cancelled", order -> order.getBuyerId(),
            "Your order #%d has been cancelled");
    }
    
    /**
     * Generic method to update order status and send notification
     * @param orderId the order ID
     * @param status the new status value
     * @param userIdExtractor function to extract user ID from order
     * @param messageTemplate message template with %d placeholder for order ID
     * @return the updated order
     */
    private Mono<Order> updateOrderStatus(Integer orderId, String status,
                                         java.util.function.Function<Order, Integer> userIdExtractor, 
                                         String messageTemplate) {
        log.info("Updating order status - orderId: {}, status: {}", orderId, status);
        
        return orderRepository.findById(orderId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Order not found with id: " + orderId)))
            .flatMap(order -> 
                orderRepository.updateOrderStatus(orderId, status)
                    .then(Mono.defer(() -> {
                        Integer userId = userIdExtractor.apply(order);
                        log.info("Order status updated - orderId: {}, status: {}, userId: {}", 
                            orderId, status, userId);
                        
//                        // Publish event to notify user
//                        RabbitMessage message = RabbitMessage.builder()
//                            .eventType(eventType)
//                            .userId(userId.toString())
//
//                            .build();
//
//                        return rabbitProducer.sendMessage(NOTIFICATION_QUEUE, message)
//                            .then(Mono.just(order));
                        return Mono.just(order);
                    }))
            )
            .doOnError(e -> log.error("Error updating order status - orderId: {}, status: {}, error: {}", 
                orderId, status, e.getMessage(), e));
    }
}
