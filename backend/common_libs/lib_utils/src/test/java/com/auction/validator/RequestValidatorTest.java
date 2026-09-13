package com.auction.validator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.auction.constants.ValidationConstants;
import com.auction.dto.ValidationResult;
import com.auction.exception.ValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("RequestValidator")
class RequestValidatorTest {

    @Nested
    @DisplayName("email")
    class Email {

        @ParameterizedTest
        @ValueSource(strings = {"user@example.com", "user+tag@domain.co.uk", "first.last@sub.domain.org"})
        void acceptsWellFormedAddresses(String email) {
            assertTrue(RequestValidator.validateEmail(email).isValid());
        }

        @ParameterizedTest
        @ValueSource(strings = {"invalid-email", "@example.com", "user@", "user@domain"})
        void rejectsMalformedAddresses(String email) {
            ValidationResult result = RequestValidator.validateEmail(email);
            assertFalse(result.isValid());
            assertEquals(ValidationConstants.ERROR_INVALID_EMAIL, result.getErrorMessage());
        }

        @ParameterizedTest
        @NullAndEmptySource
        void rejectsMissingValue(String email) {
            assertEquals(ValidationConstants.ERROR_FIELD_REQUIRED,
                RequestValidator.validateEmail(email).getErrorMessage());
        }

        @Test
        void rejectsAddressesShorterThanTheMinimum() {
            assertEquals(ValidationConstants.ERROR_EMAIL_LENGTH,
                RequestValidator.validateEmail("a@b").getErrorMessage());
        }

        @Test
        void trimsBeforeValidating() {
            assertTrue(RequestValidator.validateEmail("  user@example.com  ").isValid());
        }

        @Test
        void orThrowReportsTheField() {
            ValidationException thrown = assertThrows(ValidationException.class,
                () -> RequestValidator.validateEmailOrThrow("not-an-email"));
            assertEquals("email", thrown.getFieldName());
            assertEquals(ValidationConstants.ERROR_INVALID_EMAIL, thrown.getMessage());
        }

        @Test
        void andGetErrorReturnsNullWhenValid() {
            assertNull(RequestValidator.validateEmailAndGetError("user@example.com"));
            assertEquals(ValidationConstants.ERROR_INVALID_EMAIL,
                RequestValidator.validateEmailAndGetError("not-an-email"));
        }
    }

    @Nested
    @DisplayName("password")
    class Password {

        @ParameterizedTest
        @ValueSource(strings = {"MyPassword123!", "SecureP@ss0rd", "Aa1@aaaa"})
        void acceptsStrongPasswords(String password) {
            assertTrue(RequestValidator.validatePassword(password).isValid());
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "nouppercase123!",  // no uppercase
            "NOLOWERCASE123!",  // no lowercase
            "NoDigitsHere!",    // no digit
            "NoSpecial123"      // no special character
        })
        void rejectsPasswordsMissingACharacterClass(String password) {
            ValidationResult result = RequestValidator.validatePassword(password);
            assertFalse(result.isValid());
            assertEquals(ValidationConstants.ERROR_INVALID_PASSWORD, result.getErrorMessage());
        }

        @Test
        void rejectsPasswordsShorterThanTheMinimum() {
            assertEquals(ValidationConstants.ERROR_PASSWORD_LENGTH,
                RequestValidator.validatePassword("Ab1@").getErrorMessage());
        }

        @Test
        void orThrowReportsTheField() {
            ValidationException thrown = assertThrows(ValidationException.class,
                () -> RequestValidator.validatePasswordOrThrow("weak"));
            assertEquals("password", thrown.getFieldName());
        }

        @Test
        void andGetErrorReturnsNullWhenValid() {
            assertNull(RequestValidator.validatePasswordAndGetError("MyPassword123!"));
            assertEquals(ValidationConstants.ERROR_INVALID_PASSWORD,
                RequestValidator.validatePasswordAndGetError("nouppercase123!"));
        }
    }

    @Nested
    @DisplayName("otp")
    class Otp {

        @Test
        void acceptsExactlySixDigits() {
            assertTrue(RequestValidator.validateOTP("123456").isValid());
        }

        @ParameterizedTest
        @ValueSource(strings = {"12345", "1234567", "12345a", "  1234"})
        void rejectsAnythingElse(String otp) {
            assertEquals(ValidationConstants.ERROR_INVALID_OTP,
                RequestValidator.validateOTP(otp).getErrorMessage());
        }

        @Test
        void andGetErrorReturnsNullWhenValid() {
            assertNull(RequestValidator.validateOTPAndGetError("123456"));
            assertEquals(ValidationConstants.ERROR_INVALID_OTP,
                RequestValidator.validateOTPAndGetError("12345"));
        }
    }

    @Nested
    @DisplayName("phone number")
    class Phone {

        @ParameterizedTest
        @ValueSource(strings = {"123-456-7890", "+1 (555) 123-4567", "0123456789"})
        void acceptsCommonFormats(String phone) {
            assertTrue(RequestValidator.validatePhoneNumber(phone).isValid());
        }

        @Test
        void rejectsUnexpectedCharacters() {
            assertEquals(ValidationConstants.ERROR_INVALID_PHONE,
                RequestValidator.validatePhoneNumber("invalid-phone@").getErrorMessage());
        }

        @ParameterizedTest
        @ValueSource(strings = {"123456789", "1234567890123456"})
        void rejectsWrongDigitCounts(String phone) {
            assertEquals(ValidationConstants.ERROR_PHONE_LENGTH,
                RequestValidator.validatePhoneNumber(phone).getErrorMessage());
        }

        @Test
        @DisplayName("isValidPhoneNumber treats a blank value as 'not supplied'")
        void blankIsAcceptedByTheOptionalCheck() {
            assertTrue(RequestValidator.isValidPhoneNumber(null));
            assertTrue(RequestValidator.isValidPhoneNumber("   "));
            assertTrue(RequestValidator.isValidPhoneNumber("123-456-7890"));
            assertFalse(RequestValidator.isValidPhoneNumber("invalid-phone@"));
        }
    }

    @Nested
    @DisplayName("url, username, product name and description")
    class FreeText {

        @Test
        void validatesUrls() {
            assertTrue(RequestValidator.validateURL("https://example.com/path").isValid());
            assertEquals(ValidationConstants.ERROR_INVALID_URL,
                RequestValidator.validateURL("ftp://example.com").getErrorMessage());
        }

        @Test
        void validatesUsernames() {
            assertTrue(RequestValidator.validateUsername("user_name-1").isValid());
            assertEquals(ValidationConstants.ERROR_INVALID_USERNAME,
                RequestValidator.validateUsername("has spaces").getErrorMessage());
            assertEquals(ValidationConstants.ERROR_USERNAME_LENGTH,
                RequestValidator.validateUsername("ab").getErrorMessage());
        }

        @Test
        void validatesProductNames() {
            assertTrue(RequestValidator.validateProductName("Vintage Chair (1960s)").isValid());
            assertEquals(ValidationConstants.ERROR_INVALID_PRODUCT_NAME,
                RequestValidator.validateProductName("Chair #1").getErrorMessage());
            assertEquals(ValidationConstants.ERROR_PRODUCT_NAME_LENGTH,
                RequestValidator.validateProductName("ab").getErrorMessage());
        }

        @Test
        void validatesDescriptions() {
            assertTrue(RequestValidator.validateDescription("A description long enough").isValid());
            assertEquals(ValidationConstants.ERROR_DESCRIPTION_LENGTH,
                RequestValidator.validateDescription("too short").getErrorMessage());
        }

        @Test
        void validatesGenericFields() {
            assertTrue(RequestValidator.validateNotEmpty("value", "title").isValid());
            assertEquals("title " + ValidationConstants.ERROR_FIELD_CANNOT_BE_NULL,
                RequestValidator.validateNotEmpty("  ", "title").getErrorMessage());
            assertThrows(ValidationException.class,
                () -> RequestValidator.validateNotEmptyOrThrow(null, "title"));
        }
    }

    @Nested
    @DisplayName("numbers")
    class Numbers {

        @Test
        void validatesPriceBounds() {
            assertTrue(RequestValidator.validatePrice(ValidationConstants.MIN_PRICE).isValid());
            assertTrue(RequestValidator.validatePrice(ValidationConstants.MAX_PRICE).isValid());
            assertFalse(RequestValidator.validatePrice(-0.01).isValid());
            assertFalse(RequestValidator.validatePrice(ValidationConstants.MAX_PRICE + 1).isValid());
        }

        @Test
        void validatesPercentageBounds() {
            assertTrue(RequestValidator.validatePercentage(0).isValid());
            assertTrue(RequestValidator.validatePercentage(100).isValid());
            assertFalse(RequestValidator.validatePercentage(-1).isValid());
            assertFalse(RequestValidator.validatePercentage(101).isValid());
        }

        @Test
        void orThrowReportsTheField() {
            ValidationException thrown = assertThrows(ValidationException.class,
                () -> RequestValidator.validatePriceOrThrow(-1));
            assertEquals("price", thrown.getFieldName());
        }
    }

    @Nested
    @DisplayName("request helpers")
    class Helpers {

        @Test
        void isNotBlankRejectsNullAndWhitespace() {
            assertTrue(RequestValidator.isNotBlank("value"));
            assertFalse(RequestValidator.isNotBlank(null));
            assertFalse(RequestValidator.isNotBlank(""));
            assertFalse(RequestValidator.isNotBlank("   "));
        }

        @Test
        void isValidUserIdAcceptsPositiveIntegersOnly() {
            assertTrue(RequestValidator.isValidUserId("42"));
            assertTrue(RequestValidator.isValidUserId(" 42 "));
            assertFalse(RequestValidator.isValidUserId("0"));
            assertFalse(RequestValidator.isValidUserId("-1"));
            assertFalse(RequestValidator.isValidUserId("abc"));
            assertFalse(RequestValidator.isValidUserId("9999999999999"));
            assertFalse(RequestValidator.isValidUserId(null));
        }

        @Test
        void isValidPaginationChecksOneBasedPages() {
            assertTrue(RequestValidator.isValidPagination(1, 20));
            assertTrue(RequestValidator.isValidPagination(10, 100));
            assertFalse(RequestValidator.isValidPagination(0, 20));
            assertFalse(RequestValidator.isValidPagination(1, 0));
            assertFalse(RequestValidator.isValidPagination(1, 101));
        }

        @Test
        void arePasswordsDifferentComparesOldAndNew() {
            assertTrue(RequestValidator.arePasswordsDifferent("old", "new"));
            assertFalse(RequestValidator.arePasswordsDifferent("same", "same"));
            assertTrue(RequestValidator.arePasswordsDifferent(null, "new"));
            assertFalse(RequestValidator.arePasswordsDifferent(null, null));
        }

        @Test
        void isValidTokenChecksPresenceOnly() {
            assertTrue(RequestValidator.isValidToken("any.token.value"));
            assertFalse(RequestValidator.isValidToken(null));
            assertFalse(RequestValidator.isValidToken("   "));
        }
    }
}
