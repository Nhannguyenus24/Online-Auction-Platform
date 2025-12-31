package com.auction.entities.record;

/**
 * Record for profit statistics projection
 */
public record ProfitRecord(String period, Double totalSales, Double profit, Integer completedOrders) {
    public String getPeriod() {
        return period;
    }

    public Double getTotalSales() {
        return totalSales != null ? totalSales : 0.0;
    }

    public Double getProfit() {
        return profit != null ? profit : 0.0;
    }

    public Integer getCompletedOrders() {
        return completedOrders != null ? completedOrders : 0;
    }
}