package entities.data;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationData {
    
    private Long id;
    
    private Long userId;
    
    private String title;
    
    private String message;
    
    private NotificationType notificationType;
    
    private Long referenceId; // Product ID, Order ID, etc.
    
    private Boolean isRead;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
    
    public enum NotificationType {
        BID_PLACED, BID_OUTBID, AUCTION_WON, AUCTION_ENDED, 
        QUESTION_ASKED, QUESTION_ANSWERED, PAYMENT_RECEIVED,
        ITEM_SHIPPED, UPGRADE_APPROVED, UPGRADE_REJECTED, SYSTEM
    }
}
