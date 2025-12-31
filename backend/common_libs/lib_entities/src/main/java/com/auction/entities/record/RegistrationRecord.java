package com.auction.entities.record;

/**
 * Record for registration statistics projection
 */
public record RegistrationRecord(String date, String month, String year, Integer count) {
    public String getDate() {
        return date;
    }

    public String getMonth() {
        return month;
    }

    public String getYear() {
        return year;
    }

    public Integer getCount() {
        return count != null ? count : 0;
    }
}