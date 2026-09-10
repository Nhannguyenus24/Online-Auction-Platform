package chat.service;

import chat.dto.ConversationDto;
import chat.dto.CreateConversationRequest;
import chat.dto.MessageDto;
import chat.dto.SendMessageRequest;
import chat.model.Conversation;
import chat.model.Message;
import chat.repository.ConversationRepository;
import chat.repository.MessageRepository;
import com.auction.constants.ServiceConstants;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
	private static final Logger log = LoggerFactory.getLogger(ChatService.class);
	public List<MessageDto> getMessagesByOrderId(String orderId) {
		log.info("Fetching messages for orderId: {}", orderId);
		List<MessageDto> messages = messageRepository.findByOrderIdOrderByCreatedAtAsc(orderId)
			.stream()
			.map(MessageDto::fromEntity)
			.collect(Collectors.toList());
		log.debug("Retrieved {} messages for orderId: {}", messages.size(), orderId);
		return messages;
	}

	public List<ConversationDto> getConversations(String userRole, String userId) {
		log.info("Fetching conversations for userId: {}, userRole: {}", userId, userRole);

		List<Conversation> conversations;
		if (ServiceConstants.ROLE_SELLER_UPPER.equalsIgnoreCase(userRole)) {
			conversations = conversationRepository.findBySellerIdOrderByUpdatedAtDesc(userId);
		} else if (ServiceConstants.ROLE_BIDDER_UPPER.equalsIgnoreCase(userRole)) {
			conversations = conversationRepository.findByBidderIdOrderByUpdatedAtDesc(userId);
		} else {
			log.warn("Invalid user role for fetching conversations: {}", userRole);
			return List.of();
		}

		log.debug("Retrieved {} conversations for userId: {}", conversations.size(), userId);
		return conversations.stream()
			.map(ConversationDto::fromEntity)
			.collect(Collectors.toList());
	}

	@Transactional
	public MessageDto saveMessage(SendMessageRequest request) {
		log.info("Saving message for orderId: {}, senderRole: {}", request.getOrderId(), request.getSenderRole());

		// Validate content
		if (request.getContent() == null || request.getContent().trim().isEmpty()) {
			log.warn("Message save failed - content is empty for orderId: {}", request.getOrderId());
			throw new IllegalArgumentException(ServiceConstants.ERROR_MESSAGE_CONTENT_EMPTY);
		}

		String content = request.getContent().trim();
		if (content.length() > ServiceConstants.MAX_MESSAGE_LENGTH) {
			log.warn("Message save failed - content exceeds max length for orderId: {}", request.getOrderId());
			throw new IllegalArgumentException(
				String.format("Message content exceeds maximum length of %d characters", ServiceConstants.MAX_MESSAGE_LENGTH)
			);
		}

		// Validate senderRole
		Message.SenderRole senderRole;
		try {
			senderRole = Message.SenderRole.valueOf(request.getSenderRole().toUpperCase());
		} catch (IllegalArgumentException e) {
			log.warn("Message save failed - invalid sender role: {}", request.getSenderRole());
			throw new IllegalArgumentException(ServiceConstants.ERROR_INVALID_SENDER_ROLE);
		}

		Message message = new Message();
		message.setOrderId(request.getOrderId());
		message.setSenderRole(senderRole);
		message.setSenderName(request.getSenderName());
		message.setSenderEmail(request.getSenderEmail());
		message.setContent(content);
		message.setCreatedAt(null);

		log.debug("Persisting message for orderId: {}", request.getOrderId());
		Message saved = messageRepository.save(message);

		// Update conversation
		Conversation conversation = conversationRepository.findByOrderId(request.getOrderId())
			.orElseGet(() -> {
				Conversation newConv = new Conversation();
				newConv.setOrderId(request.getOrderId());
				newConv.setStatus(ServiceConstants.CHAT_STATUS_PENDING_PAYMENT);
				newConv.setAmount(BigDecimal.ZERO);
				log.debug("Created new conversation for orderId: {}", request.getOrderId());
				return newConv;
			});

		conversation.setLastMessageContent(content);
		conversation.setLastMessageSenderRole(request.getSenderRole().toUpperCase());
		conversation.setLastMessageTime(LocalDateTime.now());
		conversation.setUpdatedAt(LocalDateTime.now());

		// Update unread counts (only for receiver, not sender)
		if (ServiceConstants.ROLE_SELLER_UPPER.equalsIgnoreCase(request.getSenderRole())) {
			conversation.setUnreadCountBidder((conversation.getUnreadCountBidder() != null ? conversation.getUnreadCountBidder() : 0) + 1);
			log.debug("Incremented bidder unread count for orderId: {}", request.getOrderId());
		} else {
			conversation.setUnreadCountSeller((conversation.getUnreadCountSeller() != null ? conversation.getUnreadCountSeller() : 0) + 1);
			log.debug("Incremented seller unread count for orderId: {}", request.getOrderId());
		}

		conversationRepository.save(conversation);
		log.info("Message saved successfully for orderId: {}", request.getOrderId());

		return MessageDto.fromEntity(saved);
	}

	@Transactional
	public void markAsRead(String orderId, String userRole) {
		log.info("Marking conversation as read - orderId: {}, userRole: {}", orderId, userRole);

		Conversation conversation = conversationRepository.findByOrderId(orderId)
			.orElseThrow(() -> {
				log.warn("Mark as read failed - conversation not found for orderId: {}", orderId);
				return new IllegalArgumentException(
					String.format(ServiceConstants.ERROR_CONVERSATION_NOT_FOUND, orderId)
				);
			});

		if (ServiceConstants.ROLE_SELLER_UPPER.equalsIgnoreCase(userRole)) {
			conversation.setUnreadCountSeller(0);
			log.debug("Seller marked conversation as read - orderId: {}", orderId);
		} else if (ServiceConstants.ROLE_BIDDER_UPPER.equalsIgnoreCase(userRole)) {
			conversation.setUnreadCountBidder(0);
			log.debug("Bidder marked conversation as read - orderId: {}", orderId);
		} else {
			log.warn("Mark as read failed - invalid user role: {}, orderId: {}", userRole, orderId);
			throw new IllegalArgumentException(ServiceConstants.ERROR_INVALID_USER_ROLE);
		}

		conversationRepository.save(conversation);
		log.info("Conversation marked as read successfully - orderId: {}", orderId);
	}

	@Transactional
	public ConversationDto createConversation(CreateConversationRequest request) {
		log.info("Creating conversation for orderId: {}", request.getOrderId());

		// Validate required field
		if (request.getOrderId() == null || request.getOrderId().trim().isEmpty()) {
			log.warn("Conversation creation failed - orderId is missing or empty");
			throw new IllegalArgumentException(
				String.format(ServiceConstants.ERROR_MISSING_REQUIRED_FIELD, "orderId")
			);
		}

		String orderId = request.getOrderId().trim();

		// Check if conversation already exists
		if (conversationRepository.findByOrderId(orderId).isPresent()) {
			log.warn("Conversation creation failed - conversation already exists for orderId: {}", orderId);
			throw new IllegalArgumentException(
				String.format(ServiceConstants.ERROR_DUPLICATE_CONVERSATION, orderId)
			);
		}

		Conversation conversation = new Conversation();
		conversation.setOrderId(orderId);
		conversation.setSellerId(request.getSellerId());
		conversation.setSellerName(request.getSellerName());
		conversation.setSellerAvatar(request.getSellerAvatar());
		conversation.setBidderId(request.getBidderId());
		conversation.setBidderName(request.getBidderName());
		conversation.setBidderAvatar(request.getBidderAvatar());
		conversation.setProductTitle(request.getProductTitle());
		conversation.setProductImage(request.getProductImage());
		conversation.setStatus(request.getStatus() != null ? request.getStatus() : ServiceConstants.CHAT_STATUS_PENDING_PAYMENT);
		conversation.setAmount(request.getAmount() != null ? request.getAmount() : BigDecimal.ZERO);
		conversation.setUnreadCountSeller(0);
		conversation.setUnreadCountBidder(0);
		conversation.setCreatedAt(null);
		conversation.setUpdatedAt(null);

		log.debug("Persisting new conversation for orderId: {}", orderId);
		Conversation saved = conversationRepository.save(conversation);

		log.info("Conversation created successfully for orderId: {}", orderId);
		return ConversationDto.fromEntity(saved);
	}
}

