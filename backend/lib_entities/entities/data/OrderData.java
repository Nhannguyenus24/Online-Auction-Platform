package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderData {
    
    private Long id;
    
    private Long productId;
    
    private Long sellerId;
    
    private Long buyerId;
    
    @NotNull(message = "Final price is required")
    @Min(value = 0, message = "Final price must be positive")
    private Double finalPrice;
    
    private String shippingAddress;
    
    private String paymentMethod; // MoMo, ZaloPay, VNPay, Stripe, PayPal
    
    private String paymentTransactionId;
    
    private PaymentStatus paymentStatus;
    
    private OrderStatus orderStatus;
    
    private String shippingInvoiceUrl;
    
    private String trackingNumber;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime paidAt;
    
    private LocalDateTime shippedAt;
    
    private LocalDateTime deliveredAt;
    
    private LocalDateTime cancelledAt;
    
    private String cancellationReason;
    
    public enum PaymentStatus {
        PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
    }
    
    public enum OrderStatus {
        PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, COMPLETED
    }
}
