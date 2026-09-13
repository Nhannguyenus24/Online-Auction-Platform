package com.auction.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("ValidationUtils")
class ValidationUtilsTest {

    @ParameterizedTest
    @CsvSource({
        "user@example.com, true",
        "user+tag@domain.co.uk, true",
        "invalid-email, false",
        "@example.com, false",
        "user@domain, false"
    })
    void validatesEmails(String email, boolean expected) {
        assertEquals(expected, ValidationUtils.isValidEmail(email));
    }

    @Test
    void treatsNullAsInvalid() {
        assertFalse(ValidationUtils.isValidEmail(null));
        assertFalse(ValidationUtils.isValidPhoneNumber(null));
        assertFalse(ValidationUtils.isValidPassword(null));
        assertFalse(ValidationUtils.isValidOTP(null));
        assertFalse(ValidationUtils.isValidUrl(null));
        assertFalse(ValidationUtils.isNotBlank(null));
    }

    @ParameterizedTest
    @ValueSource(strings = {"MyPassword123!", "SecureP@ss0rd"})
    void acceptsStrongPasswords(String password) {
        assertTrue(ValidationUtils.isValidPassword(password));
    }

    @ParameterizedTest
    @ValueSource(strings = {"short1!", "nouppercase123!", "NOLOWERCASE123!", "NoDigits!", "NoSpecial123"})
    void rejectsWeakPasswords(String password) {
        assertFalse(ValidationUtils.isValidPassword(password));
    }

    @Test
    void validatesOtpAndUrls() {
        assertTrue(ValidationUtils.isValidOTP("123456"));
        assertFalse(ValidationUtils.isValidOTP("12345"));
        assertTrue(ValidationUtils.isValidUrl("https://example.com/a"));
        assertFalse(ValidationUtils.isValidUrl("example.com"));
    }

    @Test
    void validatesNumericRanges() {
        assertTrue(ValidationUtils.isValidPriceRange(0));
        assertTrue(ValidationUtils.isValidPriceRange(999_999_999));
        assertFalse(ValidationUtils.isValidPriceRange(-1));
        assertFalse(ValidationUtils.isValidPriceRange(1_000_000_000));

        assertTrue(ValidationUtils.isValidPercentage(0));
        assertTrue(ValidationUtils.isValidPercentage(100));
        assertFalse(ValidationUtils.isValidPercentage(100.01));
    }

    @Test
    @DisplayName("sanitizeInput drops a script block together with its body")
    void sanitizeRemovesScriptContent() {
        assertEquals("test", ValidationUtils.sanitizeInput("test<script>alert('xss')</script>"));
        // The block is removed, not the whitespace around it, so two spaces remain.
        assertEquals("before  after",
            ValidationUtils.sanitizeInput("before <SCRIPT TYPE='text/javascript'>evil()</SCRIPT> after"));
        assertEquals("keep", ValidationUtils.sanitizeInput("keep<style>body{color:red}</style>"));
    }

    @Test
    @DisplayName("sanitizeInput strips remaining markup but keeps email punctuation")
    void sanitizeKeepsAllowedCharacters() {
        assertEquals("bold", ValidationUtils.sanitizeInput("<b>bold</b>"));
        assertEquals("email@example.com", ValidationUtils.sanitizeInput("email@example.com"));
        assertEquals("a-b_c.d", ValidationUtils.sanitizeInput("a-b_c.d"));
        assertEquals("User", ValidationUtils.sanitizeInput("  User  "));
        assertEquals("drop", ValidationUtils.sanitizeInput("drop!#$%^"));
        assertNull(ValidationUtils.sanitizeInput(null));
    }
}
