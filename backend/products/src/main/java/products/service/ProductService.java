package products.service;

import entities.database.Product;
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
public class ProductService {

    private final ReactiveMySQLClient mysqlClient;

    // Get all products with filters, pagination, and sorting
    public Flux<Product> getProducts(int page, int limit, Integer categoryId, String sortBy, String status) {
        return Mono.fromCallable(() -> {
            StringBuilder sql = new StringBuilder("SELECT * FROM products WHERE 1=1");
            Map<String, Object> params = new HashMap<>();

            if (categoryId != null && categoryId > 0) {
                sql.append(" AND category_id = :categoryId");
                params.put("categoryId", categoryId);
            }

            if (status != null && !status.equals("all")) {
                sql.append(" AND status = :status");
                params.put("status", status);
            }

            // Sorting
            if (sortBy != null) {
                switch (sortBy) {
                    case "price_asc" -> sql.append(" ORDER BY current_price ASC");
                    case "price_desc" -> sql.append(" ORDER BY current_price DESC");
                    case "ending_soon" -> sql.append(" ORDER BY ends_at ASC");
                    default -> sql.append(" ORDER BY created_at DESC");
                }
            } else {
                sql.append(" ORDER BY created_at DESC");
            }

            sql.append(" LIMIT :limit OFFSET :offset");
            params.put("limit", limit);
            params.put("offset", (page - 1) * limit);

            return new Object[]{sql.toString(), params};
        }).flatMapMany(result -> {
            String sql = (String) ((Object[]) result)[0];
            Map<String, Object> params = (Map<String, Object>) ((Object[]) result)[1];
            return mysqlClient.query(sql, params, PRODUCT_MAPPER);
        }).doOnError(e -> log.error("Error fetching products", e));
    }

    // Get product details by ID
    public Mono<Product> getProductDetails(int productId) {
        String sql = "SELECT * FROM products WHERE id = :id";
        Map<String, Object> params = new HashMap<>();
        params.put("id", productId);

        return mysqlClient.queryOne(sql, params, PRODUCT_MAPPER)
                .doOnError(e -> log.error("Error fetching product details for ID: {}", productId, e));
    }

    // Delete product (admin only)
    public Mono<Void> deleteProduct(int productId) {
        String sql = "DELETE FROM products WHERE id = :id";
        Map<String, Object> params = new HashMap<>();
        params.put("id", productId);

        return mysqlClient.execute(sql, params)
                .doOnSuccess(v -> log.info("Product deleted: {}", productId))
                .doOnError(e -> log.error("Error deleting product: {}", productId, e));
    }

    // Search products with Vietnamese diacritics-insensitive support
    public Flux<Product> searchProducts(String keyword, int page, int limit, Integer categoryId,
                                       String sortBy, Double minPrice, Double maxPrice) {
        return Mono.fromCallable(() -> {
            StringBuilder sql = new StringBuilder(
                    "SELECT * FROM products WHERE (LOWER(CONCAT(title, ' ', description)) LIKE :keyword)"
            );
            Map<String, Object> params = new HashMap<>();
            params.put("keyword", "%" + keyword.toLowerCase() + "%");

            if (categoryId != null && categoryId > 0) {
                sql.append(" AND category_id = :categoryId");
                params.put("categoryId", categoryId);
            }

            if (minPrice != null && minPrice >= 0) {
                sql.append(" AND current_price >= :minPrice");
                params.put("minPrice", minPrice);
            }

            if (maxPrice != null && maxPrice >= 0) {
                sql.append(" AND current_price <= :maxPrice");
                params.put("maxPrice", maxPrice);
            }

            // Sorting
            if (sortBy != null) {
                switch (sortBy) {
                    case "price_asc" -> sql.append(" ORDER BY current_price ASC");
                    case "price_desc" -> sql.append(" ORDER BY current_price DESC");
                    case "ending_soon" -> sql.append(" ORDER BY ends_at ASC");
                    default -> sql.append(" ORDER BY created_at DESC");
                }
            } else {
                sql.append(" ORDER BY created_at DESC");
            }

            sql.append(" LIMIT :limit OFFSET :offset");
            params.put("limit", limit);
            params.put("offset", (page - 1) * limit);

            return new Object[]{sql.toString(), params};
        }).flatMapMany(result -> {
            String sql = (String) ((Object[]) result)[0];
            Map<String, Object> params = (Map<String, Object>) ((Object[]) result)[1];
            return mysqlClient.query(sql, params, PRODUCT_MAPPER);
        }).doOnError(e -> log.error("Error searching products with keyword: {}", keyword, e));
    }

    // Get products by category with pagination
    public Flux<Product> getCategoryProducts(int categoryId, int page, int limit, String sortBy) {
        return getProducts(page, limit, categoryId, sortBy, "active");
    }

    // Get top 5 products ending soon
    public Flux<Product> getTopEndingProducts(int limit) {
        String sql = "SELECT * FROM products WHERE status = 'active' ORDER BY ends_at ASC LIMIT :limit";
        Map<String, Object> params = new HashMap<>();
        params.put("limit", limit);

        return mysqlClient.query(sql, params, PRODUCT_MAPPER)
                .doOnError(e -> log.error("Error fetching top ending products", e));
    }

    // Get top 5 products by bid count
    public Flux<Product> getTopBidCountProducts(int limit) {
        String sql = "SELECT * FROM products WHERE status = 'active' ORDER BY bids_count DESC LIMIT :limit";
        Map<String, Object> params = new HashMap<>();
        params.put("limit", limit);

        return mysqlClient.query(sql, params, PRODUCT_MAPPER)
                .doOnError(e -> log.error("Error fetching top bid count products", e));
    }

    // Get top 5 highest-priced products
    public Flux<Product> getTopPriceProducts(int limit) {
        String sql = "SELECT * FROM products WHERE status = 'active' ORDER BY current_price DESC LIMIT :limit";
        Map<String, Object> params = new HashMap<>();
        params.put("limit", limit);

        return mysqlClient.query(sql, params, PRODUCT_MAPPER)
                .doOnError(e -> log.error("Error fetching top price products", e));
    }

    // Get product history (bids)
    public Flux<Product> getProductHistory(int productId, int page, int limit) {
        String sql = "SELECT * FROM bids WHERE product_id = :productId ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        Map<String, Object> params = new HashMap<>();
        params.put("productId", productId);
        params.put("limit", limit);
        params.put("offset", (page - 1) * limit);

        return mysqlClient.query(sql, params, PRODUCT_MAPPER)
                .doOnError(e -> log.error("Error fetching product history for ID: {}", productId, e));
    }

    // Get product questions
    public Flux<Product> getProductQuestions(int productId, int page, int limit) {
        String sql = "SELECT * FROM questions WHERE product_id = :productId ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        Map<String, Object> params = new HashMap<>();
        params.put("productId", productId);
        params.put("limit", limit);
        params.put("offset", (page - 1) * limit);

        return mysqlClient.query(sql, params, PRODUCT_MAPPER)
                .doOnError(e -> log.error("Error fetching product questions for ID: {}", productId, e));
    }

    // Get related products (same category)
    public Flux<Product> getRelatedProducts(int productId, int limit) {
        return Mono.fromCallable(() -> {
            String categorySql = "SELECT category_id FROM products WHERE id = :id";
            Map<String, Object> params = new HashMap<>();
            params.put("id", productId);
            return params;
        }).flatMapMany(params -> {
            String sql = "SELECT * FROM products WHERE category_id = (SELECT category_id FROM products WHERE id = :id) " +
                    "AND id != :id AND status = 'active' ORDER BY created_at DESC LIMIT :limit";
            params.put("limit", limit);
            return mysqlClient.query(sql, params, PRODUCT_MAPPER);
        }).doOnError(e -> log.error("Error fetching related products for ID: {}", productId, e));
    }

    // Get total count of products for pagination
    public Mono<Long> countProducts(Integer categoryId, String status) {
        return Mono.fromCallable(() -> {
            StringBuilder sql = new StringBuilder("SELECT COUNT(*) as count FROM products WHERE 1=1");
            Map<String, Object> params = new HashMap<>();

            if (categoryId != null && categoryId > 0) {
                sql.append(" AND category_id = :categoryId");
                params.put("categoryId", categoryId);
            }

            if (status != null && !status.equals("all")) {
                sql.append(" AND status = :status");
                params.put("status", status);
            }

            return new Object[]{sql.toString(), params};
        }).flatMap(result -> {
            String sql = (String) ((Object[]) result)[0];
            Map<String, Object> params = (Map<String, Object>) ((Object[]) result)[1];
            return mysqlClient.count(sql, params);
        }).doOnError(e -> log.error("Error counting products", e));
    }

    // Static mapper for Product conversion
    public static final java.util.function.BiFunction<io.r2dbc.spi.Row, io.r2dbc.spi.RowMetadata, Product> PRODUCT_MAPPER =
            (row, metadata) -> Product.builder()
                    .id(row.get("id", Integer.class))
                    .sellerId(row.get("seller_id", Integer.class))
                    .categoryId(row.get("category_id", Integer.class))
                    .title(row.get("title", String.class))
                    .description(row.get("description", String.class))
                    .startingPrice(row.get("starting_price", Double.class))
                    .currentPrice(row.get("current_price", Double.class))
                    .stepPrice(row.get("step_price", Double.class))
                    .buyNowPrice(row.get("buy_now_price", Double.class))
                    .startsAt(row.get("starts_at", java.time.LocalDateTime.class))
                    .endsAt(row.get("ends_at", java.time.LocalDateTime.class))
                    .isAutoExtend(row.get("is_auto_extend", Boolean.class))
                    .autoExtendSeconds(row.get("auto_extend_seconds", Integer.class))
                    .status(row.get("status", String.class))
                    .viewsCount(row.get("views_count", Integer.class))
                    .bidsCount(row.get("bids_count", Integer.class))
                    .createdAt(row.get("created_at", java.time.LocalDateTime.class))
                    .updatedAt(row.get("updated_at", java.time.LocalDateTime.class))
                    .build();
}
