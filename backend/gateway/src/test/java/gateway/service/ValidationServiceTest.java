package gateway.service;

import com.auction.utils.ValidationUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ValidationUtils Tests")
class ValidationServiceTest {

    @Test
    @DisplayName("should validate email correctly")
    void testEmailValidation() {
        assertTrue(ValidationUtils.isValidEmail("test@example.com"));
        assertTrue(ValidationUtils.isValidEmail("user+tag@domain.co.uk"));
        assertFalse(ValidationUtils.isValidEmail("invalid-email"));
        assertFalse(ValidationUtils.isValidEmail("@example.com"));
        assertFalse(ValidationUtils.isValidEmail(null));
    }

    @Test
    @DisplayName("should validate phone number correctly")
    void testPhoneValidation() {
        assertTrue(ValidationUtils.isValidPhoneNumber("123-456-7890"));
        assertTrue(ValidationUtils.isValidPhoneNumber("+1 (555) 123-4567"));
        assertFalse(ValidationUtils.isValidPhoneNumber("invalid-phone@"));
        assertFalse(ValidationUtils.isValidPhoneNumber(null));
    }

    @Test
    @DisplayName("should validate password requirements")
    void testPasswordValidation() {
        // Valid password: min 8 chars, uppercase, lowercase, digit, special char
        assertTrue(ValidationUtils.isValidPassword("MyPassword123!"));
        assertTrue(ValidationUtils.isValidPassword("SecureP@ss0rd"));

        // Invalid passwords
        assertFalse(ValidationUtils.isValidPassword("short123!")); // Too short
        assertFalse(ValidationUtils.isValidPassword("nouppercase123!")); // No uppercase
        assertFalse(ValidationUtils.isValidPassword("NOLOWERCASE123!")); // No lowercase
        assertFalse(ValidationUtils.isValidPassword("NoDigit!")); // No digit
        assertFalse(ValidationUtils.isValidPassword("NoSpecial123")); // No special char
        assertFalse(ValidationUtils.isValidPassword(null));
    }

    @Test
    @DisplayName("should validate OTP format")
    void testOTPValidation() {
        assertTrue(ValidationUtils.isValidOTP("123456"));
        assertTrue(ValidationUtils.isValidOTP("000000"));
        assertFalse(ValidationUtils.isValidOTP("12345")); // Too short
        assertFalse(ValidationUtils.isValidOTP("1234567")); // Too long
        assertFalse(ValidationUtils.isValidOTP("12345a")); // Contains letter
        assertFalse(ValidationUtils.isValidOTP(null));
    }

    @Test
    @DisplayName("should validate URL format")
    void testURLValidation() {
        assertTrue(ValidationUtils.isValidUrl("https://example.com"));
        assertTrue(ValidationUtils.isValidUrl("http://subdomain.example.com/path"));
        assertFalse(ValidationUtils.isValidUrl("not-a-url"));
        assertFalse(ValidationUtils.isValidUrl("ftp://example.com")); // Only http/https
        assertFalse(ValidationUtils.isValidUrl(null));
    }

    @Test
    @DisplayName("should validate blank strings")
    void testBlankValidation() {
        assertTrue(ValidationUtils.isNotBlank("valid string"));
        assertFalse(ValidationUtils.isNotBlank("   ")); // Whitespace only
        assertFalse(ValidationUtils.isNotBlank("")); // Empty
        assertFalse(ValidationUtils.isNotBlank(null));
    }

    @Test
    @DisplayName("should validate price range")
    void testPriceRangeValidation() {
        assertTrue(ValidationUtils.isValidPriceRange(0));
        assertTrue(ValidationUtils.isValidPriceRange(99.99));
        assertTrue(ValidationUtils.isValidPriceRange(999999999));
        assertFalse(ValidationUtils.isValidPriceRange(-1));
        assertFalse(ValidationUtils.isValidPriceRange(1_000_000_000));
    }

    @Test
    @DisplayName("should validate percentage")
    void testPercentageValidation() {
        assertTrue(ValidationUtils.isValidPercentage(0));
        assertTrue(ValidationUtils.isValidPercentage(50));
        assertTrue(ValidationUtils.isValidPercentage(100));
        assertFalse(ValidationUtils.isValidPercentage(-1));
        assertFalse(ValidationUtils.isValidPercentage(101));
    }

    @Test
    @DisplayName("should sanitize input")
    void testInputSanitization() {
        assertEquals("User", ValidationUtils.sanitizeInput("  User  "));
        assertEquals("test", ValidationUtils.sanitizeInput("test<script>alert('xss')</script>"));
        assertEquals("email@example.com", ValidationUtils.sanitizeInput("email@example.com"));
        assertNull(ValidationUtils.sanitizeInput(null));
    }
}
