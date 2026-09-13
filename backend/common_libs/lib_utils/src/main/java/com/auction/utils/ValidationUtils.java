package com.auction.utils;

import java.util.regex.Pattern;

public class ValidationUtils {

    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
    private static final String PHONE_REGEX = "^[0-9\\-\\+\\(\\)\\s]+$";
    // Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
    private static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    private static final String OTP_REGEX = "^\\d{6}$";
    private static final String URL_REGEX = "^https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$";

    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);
    private static final Pattern PHONE_PATTERN = Pattern.compile(PHONE_REGEX);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);
    private static final Pattern OTP_PATTERN = Pattern.compile(OTP_REGEX);
    private static final Pattern URL_PATTERN = Pattern.compile(URL_REGEX);

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public static boolean isValidPhoneNumber(String phone) {
        return phone != null && PHONE_PATTERN.matcher(phone).matches();
    }

    public static boolean isValidPassword(String password) {
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }

    public static boolean isValidOTP(String otp) {
        return otp != null && OTP_PATTERN.matcher(otp).matches();
    }

    public static boolean isValidUrl(String url) {
        return url != null && URL_PATTERN.matcher(url).matches();
    }

    public static boolean isNotBlank(String str) {
        return str != null && !str.trim().isEmpty();
    }

    public static boolean isValidPriceRange(double price) {
        return price >= 0 && price < 1_000_000_000; // Max 1 billion
    }

    public static boolean isValidPercentage(double percentage) {
        return percentage >= 0 && percentage <= 100;
    }

    public static String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        return input.trim()
                .replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", "") // Remove scriptable blocks with their content
                .replaceAll("<[^>]*>", "") // Remove remaining HTML tags
                .replaceAll("[^\\w\\s@.\\-]", ""); // Remove special characters except common ones
    }
}
