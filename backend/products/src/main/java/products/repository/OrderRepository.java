package products.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Order;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrderRepository extends R2dbcRepository<Order, Integer> {

    @Query("""
        INSERT INTO orders (product_id, buyer_id, seller_id, amount, status, created_at, updated_at)
        VALUES (:productId, :buyerId, :sellerId, :amount, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """)
    Mono<Void> createOrder(
        @Param("productId") Integer productId,
        @Param("buyerId") Integer buyerId,
        @Param("sellerId") Integer sellerId,
        @Param("amount") Double amount
    );

    /**
     * Find orders by seller ID with pagination and status filter
     * @param sellerId the seller ID
     * @param statusFilter the status filter (pending, completed, cancelled, all)
     * @param limit the page size
     * @param offset the offset
     * @return list of orders
     */
    @Query("""
        SELECT * FROM orders
        WHERE seller_id = :sellerId
          AND (:statusFilter = 'all' OR status = :statusFilter)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<Order> findOrdersBySellerId(
        @Param("sellerId") Integer sellerId,
        @Param("statusFilter") String statusFilter,
        @Param("limit") int limit,
        @Param("offset") int offset
    );
    
    /**
     * Count orders by seller ID with status filter
     * @param sellerId the seller ID
     * @param statusFilter the status filter (pending, completed, cancelled, all)
     * @return the count
     */
    @Query("""
        SELECT COUNT(*) FROM orders
        WHERE seller_id = :sellerId
          AND (:statusFilter = 'all' OR status = :statusFilter)
        """)
    Mono<Integer> countOrdersBySellerId(
        @Param("sellerId") Integer sellerId,
        @Param("statusFilter") String statusFilter
    );
}
