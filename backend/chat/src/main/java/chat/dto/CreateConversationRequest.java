package chat.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a new conversation")
public class CreateConversationRequest {
	@Schema(description = "Order ID (required, must be unique)", example = "ORDER123")
	private String orderId; // Required
	
	@Schema(description = "Seller ID", example = "2")
	private String sellerId;
	
	@Schema(description = "Seller name", example = "Nguyen Van A")
	private String sellerName;
	
	@Schema(description = "Seller avatar URL", example = "https://example.com/avatars/seller1.jpg")
	private String sellerAvatar;
	
	@Schema(description = "Bidder ID", example = "6")
	private String bidderId;
	
	@Schema(description = "Bidder name", example = "Hoang Van E")
	private String bidderName;
	
	@Schema(description = "Bidder avatar URL", example = "https://example.com/avatars/bidder3.jpg")
	private String bidderAvatar;
	
	@Schema(description = "Product title", example = "iPhone 14 Pro Max 256GB")
	private String productTitle;
	
	@Schema(description = "Product image URL", example = "https://example.com/images/iphone14pro_1.jpg")
	private String productImage;
	
	@Schema(description = "Conversation status (default: pending_payment)", example = "pending_payment")
	private String status; // Default: "pending_payment"
	
	@Schema(description = "Order amount (default: 0)", example = "950.00")
	private BigDecimal amount; // Default: 0
}

