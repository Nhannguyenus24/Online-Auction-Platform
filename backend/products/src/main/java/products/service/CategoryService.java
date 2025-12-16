package products.service;

import entities.database.Category;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mysql.services.ReactiveMySQLClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final ReactiveMySQLClient mysqlClient;

    // Get all categories with nested children (2 levels)
    public Flux<Category> getCategories() {
        String sql = "SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name ASC";
        Map<String, Object> params = new HashMap<>();

        return mysqlClient.query(sql, params, CATEGORY_MAPPER)
                .flatMap(parentCategory -> {
                    // For each parent category, fetch children
                    String childSql = "SELECT * FROM categories WHERE parent_id = :parentId ORDER BY name ASC";
                    Map<String, Object> childParams = new HashMap<>();
                    childParams.put("parentId", parentCategory.getId());

                    return mysqlClient.query(childSql, childParams, CATEGORY_MAPPER)
                            .collectList()
                            .map(children -> {
                                parentCategory.setChildren(children);
                                return parentCategory;
                            });
                })
                .doOnError(e -> log.error("Error fetching categories", e));
    }

    // Get category by ID
    public Mono<Category> getCategoryById(int categoryId) {
        String sql = "SELECT * FROM categories WHERE id = :id";
        Map<String, Object> params = new HashMap<>();
        params.put("id", categoryId);

        return mysqlClient.queryOne(sql, params, CATEGORY_MAPPER)
                .doOnError(e -> log.error("Error fetching category: {}", categoryId, e));
    }

    // Create new category
    public Mono<Category> createCategory(String name, Integer parentId) {
        return Mono.fromCallable(() -> {
            String sql = "INSERT INTO categories (name, parent_id, created_at) VALUES (:name, :parentId, NOW())";
            Map<String, Object> params = new HashMap<>();
            params.put("name", name);
            params.put("parentId", parentId);
            return new Object[]{sql, params};
        }).flatMap(result -> {
            String sql = (String) ((Object[]) result)[0];
            Map<String, Object> params = (Map<String, Object>) ((Object[]) result)[1];
            return mysqlClient.execute(sql, params)
                    .then(getCategoryByName(name));
        }).doOnSuccess(c -> log.info("Category created: {}", name))
                .doOnError(e -> log.error("Error creating category: {}", name, e));
    }

    // Update category
    public Mono<Void> updateCategory(int categoryId, String name, Integer parentId) {
        String sql = "UPDATE categories SET name = :name, parent_id = :parentId WHERE id = :id";
        Map<String, Object> params = new HashMap<>();
        params.put("name", name);
        params.put("parentId", parentId);
        params.put("id", categoryId);

        return mysqlClient.execute(sql, params)
                .doOnSuccess(v -> log.info("Category updated: {}", categoryId))
                .doOnError(e -> log.error("Error updating category: {}", categoryId, e));
    }

    // Delete category (only if no products exist)
    public Mono<Void> deleteCategory(int categoryId) {
        return Mono.fromCallable(() -> {
            String checkSql = "SELECT COUNT(*) as count FROM products WHERE category_id = :id";
            Map<String, Object> params = new HashMap<>();
            params.put("id", categoryId);
            return params;
        }).flatMap(params -> {
            String checkSql = "SELECT COUNT(*) as count FROM products WHERE category_id = :id";
            return mysqlClient.count(checkSql, params)
                    .flatMap(count -> {
                        if (count > 0) {
                            return Mono.error(new IllegalStateException("Cannot delete category with existing products"));
                        }
                        String deleteSql = "DELETE FROM categories WHERE id = :id";
                        return mysqlClient.execute(deleteSql, params);
                    });
        }).doOnSuccess(v -> log.info("Category deleted: {}", categoryId))
                .doOnError(e -> log.error("Error deleting category: {}", categoryId, e));
    }

    // Helper method to get category by name
    private Mono<Category> getCategoryByName(String name) {
        String sql = "SELECT * FROM categories WHERE name = :name";
        Map<String, Object> params = new HashMap<>();
        params.put("name", name);

        return mysqlClient.queryOne(sql, params, CATEGORY_MAPPER);
    }

    // Static mapper for Category conversion
    public static final java.util.function.BiFunction<io.r2dbc.spi.Row, io.r2dbc.spi.RowMetadata, Category> CATEGORY_MAPPER =
            (row, metadata) -> {
                Category category = new Category();
                category.setId(row.get("id", Integer.class));
                category.setName(row.get("name", String.class));
                category.setParentId(row.get("parent_id", Integer.class));
                category.setCreatedAt(row.get("created_at", java.time.LocalDateTime.class));
                return category;
            };
}
