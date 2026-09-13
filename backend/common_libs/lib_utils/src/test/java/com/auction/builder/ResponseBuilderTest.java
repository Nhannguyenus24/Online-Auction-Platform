package com.auction.builder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.auction.dto.ApiResponse;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Mono;

@DisplayName("ResponseBuilder")
class ResponseBuilderTest {

    private static <T> ApiResponse<T> bodyOf(ResponseEntity<ApiResponse<T>> entity) {
        assertNotNull(entity.getBody(), "response body");
        return entity.getBody();
    }

    @Test
    @DisplayName("ok carries the data with a 200 status")
    void okReturns200() {
        ResponseEntity<ApiResponse<String>> response = ResponseBuilder.ok("payload");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ApiResponse<String> body = bodyOf(response);
        assertTrue(body.isSuccess());
        assertEquals(200, body.getStatusCode());
        assertEquals("payload", body.getData());
        assertNotNull(body.getTimestamp());
    }

    @Test
    @DisplayName("ok accepts a custom message")
    void okWithMessage() {
        ApiResponse<String> body = bodyOf(ResponseBuilder.ok("Login successful", "token"));

        assertEquals("Login successful", body.getMessage());
        assertEquals("token", body.getData());
    }

    @Test
    @DisplayName("created returns 201")
    void createdReturns201() {
        ResponseEntity<ApiResponse<List<String>>> response = ResponseBuilder.created(List.of("a"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(201, bodyOf(response).getStatusCode());
    }

    @Test
    @DisplayName("noContent returns 204 with no data")
    void noContentReturns204() {
        ResponseEntity<ApiResponse<Void>> response = ResponseBuilder.noContent();

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(bodyOf(response).getData());
    }

    @Test
    @DisplayName("error builders use their matching status and mark the response unsuccessful")
    void errorBuildersMapToTheirStatus() {
        assertErrorResponse(ResponseBuilder.badRequest("bad"), HttpStatus.BAD_REQUEST, 400, "bad");
        assertErrorResponse(ResponseBuilder.unauthorized("who"), HttpStatus.UNAUTHORIZED, 401, "who");
        assertErrorResponse(ResponseBuilder.forbidden("no"), HttpStatus.FORBIDDEN, 403, "no");
        assertErrorResponse(ResponseBuilder.notFound("gone"), HttpStatus.NOT_FOUND, 404, "gone");
        assertErrorResponse(ResponseBuilder.conflict("dupe"), HttpStatus.CONFLICT, 409, "dupe");
        assertErrorResponse(ResponseBuilder.internalServerError("boom"),
            HttpStatus.INTERNAL_SERVER_ERROR, 500, "boom");
        assertErrorResponse(ResponseBuilder.serviceUnavailable("later"),
            HttpStatus.SERVICE_UNAVAILABLE, 503, "later");
    }

    private static void assertErrorResponse(ResponseEntity<ApiResponse<Object>> response,
                                            HttpStatus expectedStatus, int expectedCode, String expectedMessage) {
        assertEquals(expectedStatus, response.getStatusCode());
        ApiResponse<Object> body = bodyOf(response);
        assertFalse(body.isSuccess());
        assertEquals(expectedCode, body.getStatusCode());
        assertEquals(expectedMessage, body.getMessage());
        assertNull(body.getData());
    }

    @Test
    @DisplayName("mono builders emit the same response as their blocking counterparts")
    void monoBuildersMatchTheirBlockingCounterparts() {
        assertEquals(HttpStatus.OK, block(ResponseBuilder.monoOk("hi", "data")).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, block(ResponseBuilder.monoBadRequest("bad")).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, block(ResponseBuilder.monoUnauthorized("who")).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, block(ResponseBuilder.monoForbidden("no")).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, block(ResponseBuilder.monoNotFound("gone")).getStatusCode());
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR,
            block(ResponseBuilder.monoInternalServerError("boom")).getStatusCode());
    }

    private static <T> ResponseEntity<ApiResponse<T>> block(Mono<ResponseEntity<ApiResponse<T>>> mono) {
        ResponseEntity<ApiResponse<T>> response = mono.block();
        assertNotNull(response, "mono emitted nothing");
        return response;
    }

    @Test
    @DisplayName("a mono error builder adopts the payload type of the chain it joins")
    void monoBuildersAdoptTheCallerPayloadType() {
        // Compiles only because the builders are generic: the declared type here is
        // the gateway controller's return type, not Object.
        Mono<ResponseEntity<ApiResponse<String>>> response =
            ResponseBuilder.<String>monoBadRequest("invalid");

        assertEquals(HttpStatus.BAD_REQUEST, block(response).getStatusCode());
    }

    @Test
    @DisplayName("validationError returns 400 with the supplied message")
    void validationErrorReturns400() {
        // Note: the validationErrors map is accepted but not yet surfaced in the
        // body, so only the status and message are asserted here.
        ResponseEntity<ApiResponse<Object>> response = ResponseBuilder.validationError(
            "Validation failed", java.util.Map.<String, Object>of("email", "is invalid"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ApiResponse<Object> body = bodyOf(response);
        assertFalse(body.isSuccess());
        assertEquals("Validation failed", body.getMessage());
    }
}
