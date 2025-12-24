package products.repository;

import com.auction.entities.database.Category;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CategoryRepository extends R2dbcRepository<Category, Integer> {

    // Find category by name
    Mono<Category> findByName(String name);

    @Query("SELECT * FROM categories")
    Flux<Category> findAllCategories();

    // Find all child categories of a parent
    Flux<Category> findByParentId(Integer parentId);

    // Find all root categories (parent_id is null)
    Flux<Category> findByParentIdIsNull();

    // Check if category has products
    @Query("SELECT COUNT(*) > 0 FROM products WHERE category_id = :categoryId")
    Mono<Boolean> hasProducts(@Param("categoryId") Integer categoryId);

    // Update category name and parent_id
    @Query("UPDATE categories SET name = :name, parent_id = :parentId WHERE id = :categoryId")
    Mono<Void> updateCategory(@Param("categoryId") Integer categoryId,
                              @Param("name") String name,
                              @Param("parentId") Integer parentId);

    // Delete category by id
    @Query("DELETE FROM categories WHERE id = :categoryId")
    Mono<Void> deleteById(@Param("categoryId") Integer categoryId);

    // Delete root category along with all children (2 levels)
    @Query("DELETE FROM categories WHERE id = :categoryId OR parent_id = :categoryId")
    Mono<Void> deleteRootWithChildren(@Param("categoryId") Integer categoryId);
}
