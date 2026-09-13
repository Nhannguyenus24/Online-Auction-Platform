package com.auction.exception;

import io.grpc.Status;

/**
 * Exception thrown when a requested resource is not found.
 * Maps to gRPC NOT_FOUND status code.
 *
 * Used for:
 * - Resource ID does not exist
 * - Entity not found in database
 * - Product/User/Order not found
 */
public class ResourceNotFoundException extends GrpcException {
    private final String resourceType;
    private final String resourceId;

    /**
     * Creates a ResourceNotFoundException with type and identifier.
     *
     * @param resourceType The type of resource (e.g., "Product", "User")
     * @param resourceId   The identifier of the missing resource
     */
    public ResourceNotFoundException(String resourceType, String resourceId) {
        super(Status.NOT_FOUND, "RESOURCE_NOT_FOUND",
            String.format("%s with ID '%s' not found", resourceType, resourceId), (String) null);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    /**
     * Creates a ResourceNotFoundException with a custom message.
     *
     * @param message The error message
     */
    public ResourceNotFoundException(String message) {
        super(Status.NOT_FOUND, "RESOURCE_NOT_FOUND", message, (String) null);
        this.resourceType = null;
        this.resourceId = null;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }
}
