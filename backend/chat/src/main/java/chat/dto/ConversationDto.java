package chat.dto;

import chat.model.Conversation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {
	private Long id;
	private String orderId;
	private String sellerId;
	private String sellerName;
	private String sellerAvatar;
	private String bidderId;
	private String bidderName;
	private String bidderAvatar;
	private String productTitle;
	private String productImage;
	private String status;
	private BigDecimal amount;
	private String lastMessageContent;
	private String lastMessageSenderRole;
	private LocalDateTime lastMessageTime;
	private Integer unreadCountSeller;
	private Integer unreadCountBidder;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	public static ConversationDto fromEntity(Conversation conv) {
		return new ConversationDto(
			conv.getId(),
			conv.getOrderId(),
			conv.getSellerId(),
			conv.getSellerName(),
			conv.getSellerAvatar(),
			conv.getBidderId(),
			conv.getBidderName(),
			conv.getBidderAvatar(),
			conv.getProductTitle(),
			conv.getProductImage(),
			conv.getStatus(),
			conv.getAmount(),
			conv.getLastMessageContent(),
			conv.getLastMessageSenderRole(),
			conv.getLastMessageTime(),
			conv.getUnreadCountSeller(),
			conv.getUnreadCountBidder(),
			conv.getCreatedAt(),
			conv.getUpdatedAt()
		);
	}
}
