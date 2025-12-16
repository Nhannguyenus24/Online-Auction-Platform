package chat.dto;

import chat.model.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
	private Long id;
	private String orderId;
	private String senderRole;
	private String senderName;
	private String senderEmail;
	private String content;
	private LocalDateTime createdAt;

	public static MessageDto fromEntity(Message message) {
		return new MessageDto(
			message.getId(),
			message.getOrderId(),
			message.getSenderRole().name(),
			message.getSenderName(),
			message.getSenderEmail(),
			message.getContent(),
			message.getCreatedAt()
		);
	}
}

