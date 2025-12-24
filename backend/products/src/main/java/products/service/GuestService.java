package products.service;

import org.springframework.stereotype.Service;

import com.auction.proto.guest.Category;
import com.auction.proto.guest.PageInfo;
import com.auction.proto.guest.Product;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class GuestService {

    public Flux<Category> getCategories() {
        // TODO: Implement actual logic
        return Flux.empty();
    }

    public Flux<Product> getTopEndingProducts(int limit) {
        // TODO: Implement actual logic
        return Flux.empty();
    }

    public Flux<Product> getTopBidCountProducts(int limit) {
        // TODO: Implement actual logic
        return Flux.empty();
    }

    public Flux<Product> getTopPriceProducts(int limit) {
        // TODO: Implement actual logic
        return Flux.empty();
    }

    public Mono<ProductListResult> listProductsByCategory(int categoryId, String searchKeyword, 
                                                           double minPrice, double maxPrice, 
                                                           String status, String sortOrder, 
                                                           int page, int limit) {
        // TODO: Implement actual logic
        return Mono.just(new ProductListResult(
            java.util.Collections.emptyList(), 
            PageInfo.newBuilder().build(),
            Category.newBuilder().build()
        ));
    }

    // Helper records for return types
    public record ProductListResult(java.util.List<Product> products, PageInfo pageInfo, Category category) {}
}
