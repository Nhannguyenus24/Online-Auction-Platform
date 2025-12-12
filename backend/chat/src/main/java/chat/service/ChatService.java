package chat.service;

import chat.dto.MessageDto;
import chat.dto.SendMessageRequest;
import chat.model.Message;
import chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
	private final MessageRepository messageRepository;

	public List<MessageDto> getMessagesByOrderId(String orderId) {
		return messageRepository.findByOrderIdOrderByCreatedAtAsc(orderId)
			.stream()
			.map(MessageDto::fromEntity)
			.collect(Collectors.toList());
	}

	@Transactional
	public MessageDto saveMessage(SendMessageRequest request) {
		// Validate content
		if (request.getContent() == null || request.getContent().trim().isEmpty()) {
			throw new IllegalArgumentException("Message content cannot be empty");
		}

		// Validate senderRole
		Message.SenderRole senderRole;
		try {
			senderRole = Message.SenderRole.valueOf(request.getSenderRole().toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Invalid senderRole. Must be SELLER or BIDDER");
		}

		Message message = new Message();
		message.setOrderId(request.getOrderId());
		message.setSenderRole(senderRole);
		message.setSenderName(request.getSenderName());
		message.setSenderEmail(request.getSenderEmail());
		message.setContent(request.getContent().trim());
		message.setCreatedAt(null); // Will be set by @PrePersist

		Message saved = messageRepository.save(message);
		return MessageDto.fromEntity(saved);
	}
}


