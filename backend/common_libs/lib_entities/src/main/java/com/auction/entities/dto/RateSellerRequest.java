package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RateSellerRequest {
    
    @Schema(description = "Order ID", example = "456")
    private Integer orderId;
    
    @Schema(description = "Product ID", example = "123")
    private Integer productId;
    
    @Schema(description = "Like or dislike", example = "true")
    private Boolean like;
    
    @Schema(description = "Comment for the rating", example = "Great seller, fast shipping!")
    private String comment;
}
