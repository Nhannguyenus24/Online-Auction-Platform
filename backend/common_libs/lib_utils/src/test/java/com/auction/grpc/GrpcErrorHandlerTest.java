package com.auction.grpc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.auction.exception.AuthenticationException;
import com.auction.exception.GrpcException;
import com.auction.exception.ResourceNotFoundException;
import com.auction.exception.ServiceException;
import com.auction.exception.ValidationException;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import java.io.IOException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@DisplayName("GrpcErrorHandler")
class GrpcErrorHandlerTest {

    private static final String CONTEXT = "TestService.method";

    @Test
    @DisplayName("returns an unchecked exception so reactive lambdas can throw it")
    void returnsUncheckedException() {
        StatusRuntimeException thrown =
            GrpcErrorHandler.handleException(new ValidationException("bad", "email"), CONTEXT);

        // The compiler would reject this assignment for a checked StatusException.
        RuntimeException unchecked = thrown;
        assertTrue(unchecked instanceof StatusRuntimeException);
    }

    @Test
    @DisplayName("maps a ValidationException to INVALID_ARGUMENT and names the field")
    void mapsValidationException() {
        StatusRuntimeException thrown =
            GrpcErrorHandler.handleException(new ValidationException("must not be blank", "email"), CONTEXT);

        assertEquals(Status.Code.INVALID_ARGUMENT, thrown.getStatus().getCode());
        assertEquals("Validation failed for field 'email': must not be blank",
            thrown.getStatus().getDescription());
    }

    @Test
    @DisplayName("maps a ValidationException without a field")
    void mapsValidationExceptionWithoutField() {
        StatusRuntimeException thrown =
            GrpcErrorHandler.handleException(new ValidationException("bad request"), CONTEXT);

        assertEquals("Validation failed: bad request", thrown.getStatus().getDescription());
    }

    @Test
    @DisplayName("maps an AuthenticationException to UNAUTHENTICATED")
    void mapsAuthenticationException() {
        StatusRuntimeException thrown =
            GrpcErrorHandler.handleException(new AuthenticationException("bad credentials"), CONTEXT);

        assertEquals(Status.Code.UNAUTHENTICATED, thrown.getStatus().getCode());
        assertEquals("bad credentials", thrown.getStatus().getDescription());
    }

    @Test
    @DisplayName("maps a ResourceNotFoundException to NOT_FOUND with the resource in the message")
    void mapsResourceNotFoundException() {
        StatusRuntimeException thrown =
            GrpcErrorHandler.handleException(new ResourceNotFoundException("Product", "42"), CONTEXT);

        assertEquals(Status.Code.NOT_FOUND, thrown.getStatus().getCode());
        assertEquals("Product with ID '42' not found", thrown.getStatus().getDescription());
    }

    @Test
    @DisplayName("maps each ServiceException type to its status")
    void mapsServiceExceptionTypes() {
        assertEquals(Status.Code.FAILED_PRECONDITION, codeFor(ServiceException.ServiceErrorType.PRECONDITION_FAILED));
        assertEquals(Status.Code.INTERNAL, codeFor(ServiceException.ServiceErrorType.INTERNAL_ERROR));
        assertEquals(Status.Code.UNAVAILABLE, codeFor(ServiceException.ServiceErrorType.UNAVAILABLE));
        assertEquals(Status.Code.DEADLINE_EXCEEDED, codeFor(ServiceException.ServiceErrorType.DEADLINE_EXCEEDED));
        assertEquals(Status.Code.FAILED_PRECONDITION, codeFor(ServiceException.ServiceErrorType.CONFLICT));
    }

    private static Status.Code codeFor(ServiceException.ServiceErrorType type) {
        return GrpcErrorHandler.handleException(new ServiceException(type, "nope"), CONTEXT)
            .getStatus().getCode();
    }

    @Test
    @DisplayName("keeps the status a GrpcException already carries")
    void keepsGrpcExceptionStatus() {
        StatusRuntimeException thrown = GrpcErrorHandler.handleException(
            new GrpcException(Status.RESOURCE_EXHAUSTED, "TOO_MANY", "slow down", "quota"), CONTEXT);

        assertEquals(Status.Code.RESOURCE_EXHAUSTED, thrown.getStatus().getCode());
        assertEquals("slow down", thrown.getStatus().getDescription());
    }

    @Test
    @DisplayName("falls back to INTERNAL for unexpected exceptions and keeps the cause")
    void fallsBackToInternal() {
        IOException cause = new IOException("disk on fire");
        StatusRuntimeException thrown = GrpcErrorHandler.handleException(cause, CONTEXT);

        assertEquals(Status.Code.INTERNAL, thrown.getStatus().getCode());
        assertEquals("Internal server error: disk on fire", thrown.getStatus().getDescription());
        assertSame(cause, thrown.getStatus().getCause());
    }

    @ParameterizedTest
    @CsvSource({
        "200, OK",
        "400, INVALID_ARGUMENT",
        "422, INVALID_ARGUMENT",
        "401, UNAUTHENTICATED",
        "403, PERMISSION_DENIED",
        "404, NOT_FOUND",
        "408, DEADLINE_EXCEEDED",
        "409, FAILED_PRECONDITION",
        "429, RESOURCE_EXHAUSTED",
        "500, INTERNAL",
        "418, UNKNOWN"
    })
    @DisplayName("translates http status codes to grpc status codes")
    void translatesHttpStatusCodes(int httpStatus, String expectedCode) {
        assertEquals(Status.Code.valueOf(expectedCode),
            GrpcErrorHandler.httpStatusToGrpcStatus(httpStatus, "message").getCode());
    }

    @Test
    @DisplayName("toStatusException attaches the description")
    void toStatusExceptionAttachesDescription() {
        assertEquals("not allowed",
            GrpcErrorHandler.toStatusException(Status.PERMISSION_DENIED, "not allowed")
                .getStatus().getDescription());
    }
}
