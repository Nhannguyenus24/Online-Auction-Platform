package products.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Order;

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
    Mono<Order> findByBuyerId(@Param("buyerId") Integer buyerId);
    
    /**
     * Find orders by seller ID
     * @param sellerId the seller ID
     * @return list of orders
     */
    @Query("SELECT * FROM orders WHERE seller_id = :sellerId ORDER BY created_at DESC")
    Mono<Order> findBySellerId(@Param("sellerId") Integer sellerId);
    
    /**
     * Update order status
     * @param orderId the order ID
     * @param status the new status
     */
    @Query("UPDATE orders SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :orderId")
    Mono<Void> updateStatus(@Param("orderId") Integer orderId, @Param("status") String status);
}
