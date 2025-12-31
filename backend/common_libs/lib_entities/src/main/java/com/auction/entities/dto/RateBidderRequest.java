package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class RateBidderRequest {
    
    @Schema(description = "Order ID", example = "456", required = true)
    private Integer orderId;
    
    @Schema(description = "Rating score (1-5)", example = "5", required = true, minimum = "1", maximum = "5")
    private Integer score;
    
    @Schema(description = "Comment for the rating", example = "Great buyer, fast payment!")
    private String comment;

    public RateBidderRequest() {
    }

    public RateBidderRequest(Integer orderId, Integer score, String comment) {
        this.orderId = orderId;
        this.score = score;
        this.comment = comment;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
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
