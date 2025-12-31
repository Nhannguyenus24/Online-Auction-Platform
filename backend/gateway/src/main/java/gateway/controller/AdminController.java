package gateway.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.auction.proto.admin.product.CreateCategoryRequest;
import com.auction.proto.admin.product.DeleteCategoryRequest;
import com.auction.proto.admin.product.RemoveProductRequest;
import com.auction.proto.admin.product.UpdateCategoryRequest;

import gateway.grpc.AdminProductGrpcClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin user endpoints - requires authentication")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {
    
    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    private final AdminProductGrpcClient adminProductGrpcClient;

    public AdminController(AdminProductGrpcClient adminProductGrpcClient) {
        this.adminProductGrpcClient = adminProductGrpcClient;
    }

    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }

    // ============================================================================
    // CATEGORY MANAGEMENT
    // ============================================================================

    @PostMapping("/categories")
    @Operation(summary = "Create category", description = "Create a new product category. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> createCategory(
            @RequestBody CreateCategoryRequestDto requestDto) {
        
        log.info("Create category request - name: {}, parentId: {}", requestDto.name(), requestDto.parentId());

        CreateCategoryRequest grpcRequest = CreateCategoryRequest.newBuilder()
                .setName(requestDto.name())
                .setParentId(requestDto.parentId() != null ? requestDto.parentId() : 0)
                .build();

        try {
            var response = adminProductGrpcClient.createCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            if (response.getSuccess()) {
                result.put("categoryId", response.getCategoryId());
            }

            log.info("Create category response - success: {}, categoryId: {}", 
                    response.getSuccess(), response.getCategoryId());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Create category error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create category: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/categories/{categoryId}")
    @Operation(summary = "Update category", description = "Update an existing product category. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable int categoryId,
            @RequestBody UpdateCategoryRequestDto requestDto) {
        
        log.info("Update category request - categoryId: {}, name: {}, parentId: {}", 
                categoryId, requestDto.name(), requestDto.parentId());

        UpdateCategoryRequest grpcRequest = UpdateCategoryRequest.newBuilder()
                .setCategoryId(categoryId)
                .setName(requestDto.name())
                .setParentId(requestDto.parentId() != null ? requestDto.parentId() : 0)
                .build();

        try {
            var response = adminProductGrpcClient.updateCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            log.info("Update category response - success: {}", response.getSuccess());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Update category error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update category: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/categories/{categoryId}")
    @Operation(summary = "Delete category", description = "Delete a product category. Cannot delete if category has products. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> deleteCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable int categoryId) {
        
        log.info("Delete category request - categoryId: {}", categoryId);

        DeleteCategoryRequest grpcRequest = DeleteCategoryRequest.newBuilder()
                .setCategoryId(categoryId)
                .build();

        try {
            var response = adminProductGrpcClient.deleteCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("hasProducts", response.getHasProducts());

            log.info("Delete category response - success: {}, hasProducts: {}", 
                    response.getSuccess(), response.getHasProducts());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Delete category error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to delete category: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    @DeleteMapping("/products/{productId}")
    @Operation(summary = "Remove product", description = "Remove/ban a product from the platform. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> removeProduct(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody RemoveProductRequestDto requestDto) {
        
        int adminId = getUserId();
        log.info("Remove product request - productId: {}, adminId: {}, reason: {}", 
                productId, adminId, requestDto.reason());

        RemoveProductRequest grpcRequest = RemoveProductRequest.newBuilder()
                .setProductId(productId)
                .setAdminId(adminId)
                .setReason(requestDto.reason())
                .build();

        try {
            var response = adminProductGrpcClient.removeProduct(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            if (response.getSuccess()) {
                result.put("previousStatus", response.getPreviousStatus());
            }

            log.info("Remove product response - success: {}, previousStatus: {}", 
                    response.getSuccess(), response.getPreviousStatus());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Remove product error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to remove product: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // REQUEST DTOs
    // ============================================================================

    public record CreateCategoryRequestDto(
        String name,
        Integer parentId
    ) {}

    public record UpdateCategoryRequestDto(
        String name,
        Integer parentId
    ) {}

    public record RemoveProductRequestDto(
        String reason
    ) {}
}
