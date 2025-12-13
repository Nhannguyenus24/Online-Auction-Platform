package chat.repository;

import chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
	Optional<Conversation> findByOrderId(String orderId);

	@Query("SELECT c FROM Conversation c WHERE c.sellerId = :userId ORDER BY c.updatedAt DESC")
	List<Conversation> findBySellerIdOrderByUpdatedAtDesc(@Param("userId") String userId);

	@Query("SELECT c FROM Conversation c WHERE c.bidderId = :userId ORDER BY c.updatedAt DESC")
	List<Conversation> findByBidderIdOrderByUpdatedAtDesc(@Param("userId") String userId);
}

