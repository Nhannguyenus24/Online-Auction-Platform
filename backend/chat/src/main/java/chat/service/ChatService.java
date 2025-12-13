package chat.service;

import chat.dto.ConversationDto;
import chat.dto.MessageDto;
import chat.dto.SendMessageRequest;
import chat.model.Conversation;
import chat.model.Message;
import chat.repository.ConversationRepository;
import chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
	private final MessageRepository messageRepository;
	private final ConversationRepository conversationRepository;

	public List<MessageDto> getMessagesByOrderId(String orderId) {
		return messageRepository.findByOrderIdOrderByCreatedAtAsc(orderId)
			.stream()
			.map(MessageDto::fromEntity)
			.collect(Collectors.toList());
	}

	public List<ConversationDto> getConversations(String userRole, String userId) {
		List<Conversation> conversations;
		if ("SELLER".equalsIgnoreCase(userRole)) {
			conversations = conversationRepository.findBySellerIdOrderByUpdatedAtDesc(userId);
		} else if ("BIDDER".equalsIgnoreCase(userRole)) {
			conversations = conversationRepository.findByBidderIdOrderByUpdatedAtDesc(userId);
		} else {
			throw new IllegalArgumentException("Invalid userRole. Must be SELLER or BIDDER");
		}
		return conversations.stream()
			.map(ConversationDto::fromEntity)
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

		// Save message
		Message message = new Message();
		message.setOrderId(request.getOrderId());
		message.setSenderRole(senderRole);
		message.setSenderName(request.getSenderName());
		message.setSenderEmail(request.getSenderEmail());
		message.setContent(request.getContent().trim());
		message.setCreatedAt(null); // Will be set by @PrePersist

		Message saved = messageRepository.save(message);

		// Update conversation
		Conversation conversation = conversationRepository.findByOrderId(request.getOrderId())
			.orElseGet(() -> {
				// Create new conversation if not exists
				Conversation newConv = new Conversation();
				newConv.setOrderId(request.getOrderId());
				newConv.setStatus("pending_payment");
				newConv.setAmount(BigDecimal.ZERO);
				return newConv;
			});

		conversation.setLastMessageContent(request.getContent().trim());
		conversation.setLastMessageSenderRole(request.getSenderRole().toUpperCase());
		conversation.setLastMessageTime(LocalDateTime.now());
		conversation.setUpdatedAt(LocalDateTime.now());

		// Update unread counts (only for receiver, not sender)
		if ("SELLER".equalsIgnoreCase(request.getSenderRole())) {
			// Seller sent message, increment bidder's unread count
			conversation.setUnreadCountBidder((conversation.getUnreadCountBidder() != null ? conversation.getUnreadCountBidder() : 0) + 1);
		} else {
			// Bidder sent message, increment seller's unread count
			conversation.setUnreadCountSeller((conversation.getUnreadCountSeller() != null ? conversation.getUnreadCountSeller() : 0) + 1);
		}

		conversationRepository.save(conversation);

		return MessageDto.fromEntity(saved);
	}

	@Transactional
	public void markAsRead(String orderId, String userRole) {
		Conversation conversation = conversationRepository.findByOrderId(orderId)
			.orElseThrow(() -> new IllegalArgumentException("Conversation not found for orderId: " + orderId));

		if ("SELLER".equalsIgnoreCase(userRole)) {
			conversation.setUnreadCountSeller(0);
		} else if ("BIDDER".equalsIgnoreCase(userRole)) {
			conversation.setUnreadCountBidder(0);
		} else {
			throw new IllegalArgumentException("Invalid userRole. Must be SELLER or BIDDER");
		}

		conversationRepository.save(conversation);
	}
}

