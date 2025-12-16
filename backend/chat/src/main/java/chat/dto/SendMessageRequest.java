package chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
	private String orderId;
	private String senderRole;
	private String senderName;
	private String senderEmail;
	private String content;
}

