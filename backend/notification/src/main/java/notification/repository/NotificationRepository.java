package notification.repository;

import com.auction.entities.database.Notification;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface NotificationRepository extends R2dbcRepository<Notification, Integer>  {

    // Delete notification by id
    @Query("DELETE FROM notifications WHERE id = :notificationId")
    Mono<Void> deleteById(@Param("notificationId") Integer notificationId);
}
