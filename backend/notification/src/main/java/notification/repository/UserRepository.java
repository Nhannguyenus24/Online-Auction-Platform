package notification.repository;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.User;

@Repository
public interface UserRepository extends R2dbcRepository<User, Integer> {
}
