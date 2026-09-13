package com.auction.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.core.type.TypeReference;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("JsonUtils")
class JsonUtilsTest {

    /** Simple bean used to exercise serialisation both ways. */
    public static class Bid {
        private int productId;
        private double amount;

        public Bid() {
        }

        public Bid(int productId, double amount) {
            this.productId = productId;
            this.amount = amount;
        }

        public int getProductId() {
            return productId;
        }

        public void setProductId(int productId) {
            this.productId = productId;
        }

        public double getAmount() {
            return amount;
        }

        public void setAmount(double amount) {
            this.amount = amount;
        }
    }

    @Test
    @DisplayName("an object round-trips through json")
    void objectRoundTrip() {
        String json = JsonUtils.toJson(new Bid(7, 12.5));

        Bid parsed = JsonUtils.fromJson(json, Bid.class);
        assertEquals(7, parsed.getProductId());
        assertEquals(12.5, parsed.getAmount());
    }

    @Test
    @DisplayName("null in, null out")
    void nullHandling() {
        assertNull(JsonUtils.toJson(null));
        assertNull(JsonUtils.fromJson(null, Bid.class));
        assertNull(JsonUtils.fromJson("   ", Bid.class));
    }

    @Test
    @DisplayName("unknown properties are ignored rather than failing")
    void ignoresUnknownProperties() {
        Bid parsed = JsonUtils.fromJson("{\"productId\":1,\"amount\":2.0,\"surprise\":true}", Bid.class);

        assertEquals(1, parsed.getProductId());
    }

    @Test
    @DisplayName("dates serialise as text, not as timestamps")
    void datesSerialiseAsText() {
        String json = JsonUtils.toJson(Map.of("at", LocalDateTime.of(2026, 3, 14, 9, 30)));

        assertTrue(json.contains("2026-03-14T09:30"), json);
    }

    @Test
    @DisplayName("collections and maps are supported")
    void collectionsAndMaps() {
        List<Bid> bids = JsonUtils.fromJsonToList("[{\"productId\":1,\"amount\":1.0}]", Bid.class);
        assertEquals(1, bids.size());
        assertEquals(1, bids.get(0).getProductId());

        Map<String, Object> map = JsonUtils.fromJsonToMap("{\"a\":1,\"b\":\"two\"}");
        assertEquals(1, map.get("a"));
        assertEquals("two", map.get("b"));

        List<String> names = JsonUtils.fromJson("[\"a\",\"b\"]", new TypeReference<List<String>>() {});
        assertEquals(List.of("a", "b"), names);
    }

    @Test
    @DisplayName("an object converts to and from a map")
    void objectToMapAndBack() {
        Map<String, Object> map = JsonUtils.toMap(new Bid(3, 9.0));
        assertEquals(3, map.get("productId"));

        assertEquals(3, JsonUtils.fromMap(map, Bid.class).getProductId());
    }

    @Test
    @DisplayName("deepCopy returns an equal but distinct instance")
    void deepCopyIsDistinct() {
        Bid original = new Bid(5, 20.0);
        Bid copy = JsonUtils.deepCopy(original, Bid.class);

        assertNotSame(original, copy);
        assertEquals(original.getProductId(), copy.getProductId());
    }

    @Test
    @DisplayName("isValidJson recognises malformed input")
    void recognisesMalformedJson() {
        assertTrue(JsonUtils.isValidJson("{\"a\":1}"));
        assertFalse(JsonUtils.isValidJson("{not json"));
    }

    @Test
    @DisplayName("malformed json raises rather than returning null")
    void malformedJsonRaises() {
        assertThrows(RuntimeException.class, () -> JsonUtils.fromJson("{not json", Bid.class));
    }

    @Test
    @DisplayName("pretty printing keeps the same content")
    void prettyPrintingKeepsContent() {
        String pretty = JsonUtils.toPrettyJson(new Bid(1, 2.0));

        assertTrue(pretty.contains("\n"), "expected indented output");
        assertEquals(1, JsonUtils.fromJson(pretty, Bid.class).getProductId());
    }
}
