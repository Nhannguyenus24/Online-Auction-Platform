package chat.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 50)
	private String orderId;

	@Column(length = 100)
	private String sellerId;

	@Column(length = 100)
	private String sellerName;

	@Column(length = 500)
	private String sellerAvatar;

	@Column(length = 100)
	private String bidderId;

	@Column(length = 100)
	private String bidderName;

	@Column(length = 500)
	private String bidderAvatar;

	@Column(length = 500)
	private String productTitle;

	@Column(length = 500)
	private String productImage;

	@Column(nullable = false, length = 50)
	private String status = "pending_payment";

	@Column(columnDefinition = "DECIMAL(15,2)")
	private BigDecimal amount = BigDecimal.ZERO;

	@Column(columnDefinition = "TEXT")
	private String lastMessageContent;

	@Column(length = 20)
	private String lastMessageSenderRole;

	@Column
	private LocalDateTime lastMessageTime;

	@Column(nullable = false)
	private Integer unreadCountSeller = 0;

	@Column(nullable = false)
	private Integer unreadCountBidder = 0;

	@Column(nullable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
		if (updatedAt == null) {
			updatedAt = LocalDateTime.now();
		}
	}

	@PreUpdate
	protected void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}

