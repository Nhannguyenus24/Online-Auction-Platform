package com.auction.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.auction.constants.ServiceConstants;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

@DisplayName("ServiceExceptionUtils")
class ServiceExceptionUtilsTest {

    private static Throwable errorOf(Mono<?> mono) {
        return assertThrows(RuntimeException.class, mono::block);
    }

    @Test
    @DisplayName("not-found helpers format the id into the message")
    void notFoundHelpersFormatTheId() {
        Throwable productError = errorOf(ServiceExceptionUtils.productNotFound(7));
        assertTrue(productError instanceof IllegalArgumentException);
        assertEquals(String.format(ServiceConstants.ERROR_PRODUCT_NOT_FOUND, 7), productError.getMessage());

        assertEquals(String.format(ServiceConstants.ERROR_ORDER_NOT_FOUND, 3),
            errorOf(ServiceExceptionUtils.orderNotFound(3)).getMessage());
        assertEquals(String.format(ServiceConstants.ERROR_USER_NOT_FOUND, 11),
            errorOf(ServiceExceptionUtils.userNotFound(11)).getMessage());
    }

    @Test
    @DisplayName("state helpers raise IllegalStateException")
    void stateHelpersRaiseIllegalState() {
        assertTrue(errorOf(ServiceExceptionUtils.productNotActive()) instanceof IllegalStateException);
        assertTrue(errorOf(ServiceExceptionUtils.auctionNotStarted()) instanceof IllegalStateException);
        assertTrue(errorOf(ServiceExceptionUtils.auctionHasEnded()) instanceof IllegalStateException);

        assertEquals(ServiceConstants.ERROR_PRODUCT_NOT_ACTIVE,
            errorOf(ServiceExceptionUtils.productNotActive()).getMessage());
    }

    @Test
    @DisplayName("customError and customStateError pass the message through")
    void customErrorsPassTheMessageThrough() {
        assertEquals("boom", errorOf(ServiceExceptionUtils.customError("boom")).getMessage());
        assertTrue(errorOf(ServiceExceptionUtils.customStateError("bad state")) instanceof IllegalStateException);
    }

    @Test
    @DisplayName("checkAuthorization completes when authorized and fails otherwise")
    void checkAuthorization() {
        assertEquals(null, ServiceExceptionUtils.checkAuthorization(true, "denied").block());
        assertEquals("denied", errorOf(ServiceExceptionUtils.checkAuthorization(false, "denied")).getMessage());
    }

    @Test
    @DisplayName("requireNonNull emits the resource or the supplied error")
    void requireNonNull() {
        assertEquals("value", ServiceExceptionUtils.requireNonNull("value", "missing").block());
        assertEquals("missing", errorOf(ServiceExceptionUtils.requireNonNull(null, "missing")).getMessage());
    }

    @Test
    @DisplayName("an error helper adopts the element type of the chain it joins")
    void helpersAdoptTheChainElementType() {
        // This is the regression the generic signature exists for: before it,
        // switchIfEmpty on a typed Mono could not accept a Mono<Void>.
        Mono<String> chain = Mono.<String>empty()
            .switchIfEmpty(ServiceExceptionUtils.productNotFound(42));

        assertEquals(String.format(ServiceConstants.ERROR_PRODUCT_NOT_FOUND, 42),
            errorOf(chain).getMessage());
    }

    @Test
    @DisplayName("an error helper can be returned from a flatMap on a typed chain")
    void helpersFitInsideFlatMap() {
        Mono<List<String>> chain = Mono.just("trigger")
            .flatMap(value -> ServiceExceptionUtils.<List<String>>invalidUserRole());

        assertEquals(ServiceConstants.ERROR_INVALID_USER_ROLE, errorOf(chain).getMessage());
    }
}
