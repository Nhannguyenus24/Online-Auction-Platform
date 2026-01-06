package chat.controller;

import chat.dto.ConversationDto;
import chat.dto.CreateConversationRequest;
import chat.dto.MessageDto;
import chat.dto.SendMessageRequest;
import chat.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Chat", description = "Chat service endpoints for conversations and messages")
public class ChatController {
	private final ChatService chatService;
	private final SimpMessagingTemplate messagingTemplate;

	@GetMapping("/conversations")
	@Operation(summary = "Get conversations", description = "Get all conversations for a user by role (SELLER or BIDDER)")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Successfully retrieved conversations"),
		@ApiResponse(responseCode = "400", description = "Invalid userRole parameter")
	})
	public ResponseEntity<List<ConversationDto>> getConversations(
		@Parameter(description = "User role (SELLER or BIDDER)", required = true, example = "SELLER")
		@RequestParam String userRole,
		@Parameter(description = "User ID", example = "1")
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
	@Operation(summary = "Get messages", description = "Get all messages for a specific order/conversation")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Successfully retrieved messages"),
		@ApiResponse(responseCode = "500", description = "Internal server error")
	})
	public ResponseEntity<List<MessageDto>> getMessages(
		@Parameter(description = "Order ID", required = true, example = "ORDER123")
		@PathVariable String orderId) {
		try {
			List<MessageDto> messages = chatService.getMessagesByOrderId(orderId);
			return ResponseEntity.ok(messages);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@PostMapping("/{orderId}/mark-read")
	@Operation(summary = "Mark messages as read", description = "Mark all messages as read for a specific user role in a conversation")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Successfully marked as read"),
		@ApiResponse(responseCode = "400", description = "Invalid parameters"),
		@ApiResponse(responseCode = "500", description = "Internal server error")
	})
	public ResponseEntity<Void> markAsRead(
		@Parameter(description = "Order ID", required = true, example = "ORDER123")
		@PathVariable String orderId,
		@Parameter(description = "User role (SELLER or BIDDER)", required = true, example = "SELLER")
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

	@PostMapping("/conversations")
	@Operation(summary = "Create conversation", description = "Create a new conversation for an order. orderId is required and must be unique.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "201", description = "Conversation created successfully",
			content = @Content(schema = @Schema(implementation = ConversationDto.class))),
		@ApiResponse(responseCode = "400", description = "Invalid request (missing orderId or orderId already exists)"),
		@ApiResponse(responseCode = "500", description = "Internal server error")
	})
	public ResponseEntity<ConversationDto> createConversation(
		@io.swagger.v3.oas.annotations.parameters.RequestBody(
			description = "Conversation creation request",
			required = true,
			content = @Content(schema = @Schema(implementation = CreateConversationRequest.class))
		)
		@RequestBody CreateConversationRequest request) {
		try {
			ConversationDto conversation = chatService.createConversation(request);
			return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
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

