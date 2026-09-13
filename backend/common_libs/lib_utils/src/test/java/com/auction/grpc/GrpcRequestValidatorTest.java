package com.auction.grpc;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.auction.exception.ValidationException;
import java.util.Set;
import java.util.regex.Pattern;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("GrpcRequestValidator")
class GrpcRequestValidatorTest {

    private static ValidationException rejected(org.junit.jupiter.api.function.Executable call) {
        return assertThrows(ValidationException.class, call);
    }

    @Test
    @DisplayName("validateRequired rejects missing strings, integers and longs")
    void validateRequired() {
        assertDoesNotThrow(() -> GrpcRequestValidator.validateRequired("value", "name"));
        assertDoesNotThrow(() -> GrpcRequestValidator.validateRequired(Integer.valueOf(0), "count"));
        assertDoesNotThrow(() -> GrpcRequestValidator.validateRequired(Long.valueOf(0L), "total"));

        ValidationException thrown = rejected(() -> GrpcRequestValidator.validateRequired((String) null, "name"));
        assertEquals("Field 'name' is required", thrown.getMessage());
        assertEquals("name", thrown.getFieldName());

        rejected(() -> GrpcRequestValidator.validateRequired("   ", "name"));
        rejected(() -> GrpcRequestValidator.validateRequired((Integer) null, "count"));
        rejected(() -> GrpcRequestValidator.validateRequired((Long) null, "total"));
    }

    @Test
    @DisplayName("length checks use the supplied bounds")
    void lengthChecks() {
        assertDoesNotThrow(() -> GrpcRequestValidator.validateMaxLength("abc", 3, "name"));
        assertDoesNotThrow(() -> GrpcRequestValidator.validateMaxLength(null, 3, "name"));
        assertEquals("Field 'name' exceeds maximum length of 3 characters",
            rejected(() -> GrpcRequestValidator.validateMaxLength("abcd", 3, "name")).getMessage());

        assertDoesNotThrow(() -> GrpcRequestValidator.validateMinLength("abc", 3, "name"));
        assertEquals("Field 'name' must be at least 3 characters",
            rejected(() -> GrpcRequestValidator.validateMinLength("ab", 3, "name")).getMessage());
        rejected(() -> GrpcRequestValidator.validateMinLength(null, 1, "name"));
    }

    @Test
    @DisplayName("numeric checks reject null, zero and negative values as documented")
    void numericChecks() {
        assertDoesNotThrow(() -> GrpcRequestValidator.validatePositive(Integer.valueOf(1), "id"));
        rejected(() -> GrpcRequestValidator.validatePositive(Integer.valueOf(0), "id"));
        rejected(() -> GrpcRequestValidator.validatePositive((Integer) null, "id"));
        rejected(() -> GrpcRequestValidator.validatePositive(Long.valueOf(-1L), "id"));

        assertDoesNotThrow(() -> GrpcRequestValidator.validateNonNegative(0, "offset"));
        assertEquals("Field 'offset' cannot be negative",
            rejected(() -> GrpcRequestValidator.validateNonNegative(-1, "offset")).getMessage());

        assertDoesNotThrow(() -> GrpcRequestValidator.validateRange(5, 1, 10, "rating"));
        assertEquals("Field 'rating' must be between 1 and 10",
            rejected(() -> GrpcRequestValidator.validateRange(11, 1, 10, "rating")).getMessage());
    }

    @Test
    @DisplayName("email, url and pattern checks name the offending field")
    void formatChecks() {
        assertDoesNotThrow(() -> GrpcRequestValidator.validateEmail("user@example.com", "email"));
        assertEquals("Field 'email' has invalid email format",
            rejected(() -> GrpcRequestValidator.validateEmail("nope", "email")).getMessage());

        assertDoesNotThrow(() -> GrpcRequestValidator.validateUrl("https://example.com/a", "url"));
        rejected(() -> GrpcRequestValidator.validateUrl("example.com", "url"));

        Pattern digits = Pattern.compile("^\\d+$");
        assertDoesNotThrow(() -> GrpcRequestValidator.validatePattern("123", digits, "code"));
        assertEquals("Field 'code' format is invalid",
            rejected(() -> GrpcRequestValidator.validatePattern("12a", digits, "code")).getMessage());
    }

    @Test
    @DisplayName("pagination checks bound the page size and reject negative offsets")
    void paginationChecks() {
        assertDoesNotThrow(() -> GrpcRequestValidator.validatePageSize(GrpcConstants.MAX_PAGE_SIZE, "pageSize"));
        assertDoesNotThrow(() -> GrpcRequestValidator.validatePageSize(1, "pageSize"));
        rejected(() -> GrpcRequestValidator.validatePageSize(0, "pageSize"));
        rejected(() -> GrpcRequestValidator.validatePageSize(GrpcConstants.MAX_PAGE_SIZE + 1, "pageSize"));
        rejected(() -> GrpcRequestValidator.validatePageSize(null, "pageSize"));

        assertDoesNotThrow(() -> GrpcRequestValidator.validatePageOffset(0, "offset"));
        assertDoesNotThrow(() -> GrpcRequestValidator.validatePageOffset(null, "offset"));
        rejected(() -> GrpcRequestValidator.validatePageOffset(-1, "offset"));
    }

    @Test
    @DisplayName("validateEnum lists the allowed values")
    void enumCheck() {
        Set<String> roles = Set.of("bidder", "seller", "admin");

        assertDoesNotThrow(() -> GrpcRequestValidator.validateEnum("seller", roles, "role"));
        ValidationException thrown = rejected(() -> GrpcRequestValidator.validateEnum("ghost", roles, "role"));
        org.junit.jupiter.api.Assertions.assertTrue(
            thrown.getMessage().startsWith("Field 'role' has invalid value. Allowed values:"), thrown.getMessage());
    }
}
