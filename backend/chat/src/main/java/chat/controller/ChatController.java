package chat.controller;

import chat.dto.ConversationDto;
import chat.dto.MessageDto;
import chat.dto.SendMessageRequest;
import chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ChatController {
	private final ChatService chatService;
	private final SimpMessagingTemplate messagingTemplate;

	@GetMapping("/conversations")
	public ResponseEntity<List<ConversationDto>> getConversations(
		@RequestParam String userRole,
		@RequestParam(defaultValue = "mock-user") String userId
	) {
		try {
			List<ConversationDto> conversations = chatService.getConversations(userRole, userId);
			return ResponseEntity.ok(conversations);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().build();
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/{orderId}/messages")
	public ResponseEntity<List<MessageDto>> getMessages(@PathVariable String orderId) {
		try {
			List<MessageDto> messages = chatService.getMessagesByOrderId(orderId);
			return ResponseEntity.ok(messages);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@PostMapping("/{orderId}/mark-read")
	public ResponseEntity<Void> markAsRead(
		@PathVariable String orderId,
		@RequestParam String userRole
	) {
		try {
			chatService.markAsRead(orderId, userRole);
			return ResponseEntity.ok().build();
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().build();
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@MessageMapping("/chat.send")
	public void sendMessage(@Payload SendMessageRequest request) {
		try {
			// Validate orderId
			if (request.getOrderId() == null || request.getOrderId().trim().isEmpty()) {
				System.err.println("Error: orderId is required");
				return;
			}
			
			MessageDto savedMessage = chatService.saveMessage(request);
			// Broadcast to all subscribers of this order's topic
			messagingTemplate.convertAndSend("/topic/chat." + request.getOrderId(), savedMessage);
		} catch (IllegalArgumentException e) {
			// Log error but don't broadcast invalid messages
			System.err.println("Error sending message: " + e.getMessage());
		} catch (Exception e) {
			System.err.println("Unexpected error sending message: " + e.getMessage());
			e.printStackTrace();
		}
	}
}

