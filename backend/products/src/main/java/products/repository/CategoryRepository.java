package products.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Category;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CategoryRepository extends R2dbcRepository<Category, Integer> {

    // Find category by name
    Mono<Category> findByName(String name);
    // Check if category has products
    @Query("SELECT COUNT(*) FROM products WHERE category_id = :categoryId")
    Mono<Long> hasProducts(@Param("categoryId") Integer categoryId);

    // Delete category by id
    @Query("DELETE FROM categories WHERE id = :categoryId")
    Mono<Void> deleteById(@Param("categoryId") Integer categoryId);
}
