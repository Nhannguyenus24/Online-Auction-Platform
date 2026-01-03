package products.repository;

import java.util.Map;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Order;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrderRepository extends R2dbcRepository<Order, Integer> {
    
    /**
     * Create new order for auction winner
     * @param productId the product ID
     * @param buyerId the buyer/winner ID
     * @param sellerId the seller ID
     * @param amount the final bid amount
     * @return the created order ID
     */
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

    @Query("""
        INSERT INTO orders (product_id, buyer_id, seller_id, amount, status, created_at, updated_at)
        VALUES (:productId, :buyerId, :sellerId, :amount, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
        """)
    Mono<Integer> createOrderReturnId(
            @Param("productId") Integer productId,
            @Param("buyerId") Integer buyerId,
            @Param("sellerId") Integer sellerId,
            @Param("amount") Double amount
    );
    /**
     * Find order by product ID
     * @param productId the product ID
     * @return the order
     */
    Mono<Order> findByProductId(Integer productId);
    
    /**
     * Find orders by buyer ID
     * @param buyerId the buyer ID
     * @return list of orders
     */
    @Query("SELECT * FROM orders WHERE buyer_id = :buyerId ORDER BY created_at DESC")
    Flux<Order> findByBuyerId(@Param("buyerId") Integer buyerId);
    
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
    
    /**
     * Update order status
     * @param orderId the order ID
     * @param status the new status
     */
    @Query("UPDATE orders SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :orderId")
    Mono<Void> updateStatus(@Param("orderId") Integer orderId, @Param("status") String status);
}
