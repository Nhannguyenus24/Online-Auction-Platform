package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class RejectBidderRequest {
    
    @Schema(description = "Bidder ID to reject", example = "123", required = true)
    private Integer bidderId;
    
    @Schema(description = "Reason for rejection", example = "Suspicious bidding behavior", required = true)
    private String reason;

    public RejectBidderRequest() {
    }

    public RejectBidderRequest(Integer bidderId, String reason) {
        this.bidderId = bidderId;
        this.reason = reason;
    }

    public Integer getBidderId() {
        return bidderId;
    }

    public void setBidderId(Integer bidderId) {
        this.bidderId = bidderId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
