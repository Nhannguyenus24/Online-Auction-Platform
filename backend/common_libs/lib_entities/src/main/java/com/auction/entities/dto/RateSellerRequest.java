package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class RateSellerRequest {
    
    @Schema(description = "Order ID", example = "456")
    private Integer orderId;
    
    @Schema(description = "Product ID", example = "123")
    private Integer productId;
    
    @Schema(description = "Rating score (1-5)", example = "5", minimum = "1", maximum = "5")
    private Integer score;
    
    @Schema(description = "Comment for the rating", example = "Great seller, fast shipping!")
    private String comment;

    public RateSellerRequest() {
    }

    public RateSellerRequest(Integer orderId, Integer productId, Integer score, String comment) {
        this.orderId = orderId;
        this.productId = productId;
        this.score = score;
        this.comment = comment;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
