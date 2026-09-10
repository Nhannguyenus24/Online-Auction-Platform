package products.service;

import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import com.auction.constants.ServiceConstants;

/**
 * Service for managing auction scheduling
 * Handles auction end scheduling, cancellation, and rescheduling
 */
@Service
public class AuctionService {
    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);
    private static final String CONTEXT_PRODUCT_ID = "productId";
    private static final String CONTEXT_END_TIME = "endTime";

    private final TaskScheduler taskScheduler;
    private final Map<Long, ScheduledFuture<?>> jobs = new ConcurrentHashMap<>();

    public AuctionService(TaskScheduler taskScheduler) {
        this.taskScheduler = taskScheduler;
    }

    /**
     * Schedule auction end task
     * @param productId the product ID
     * @param endTime the end time
     * @param task the task to execute when auction ends
     */
    public void scheduleEndAuction(Long productId, Instant endTime, Runnable task) {
        log.info("Scheduling auction end for product={} at={}", productId, endTime);
        cancel(productId); // Cancel existing job to avoid duplicates
        if (endTime.isBefore(Instant.now())) {
            log.warn("End time already passed, not executing immediately for productId={}", productId);
            return;
        }

        try {
            ScheduledFuture<?> future = taskScheduler.schedule(task, Date.from(endTime));
            jobs.put(productId, future);
            log.info("Auction end scheduled successfully for product {}", productId);
        } catch (Exception e) {
            log.error("Failed to schedule auction end for product {}: {}", productId, e.getMessage(), e);
        }
    }

    /**
     * Cancel scheduled auction end task
     * @param productId the product ID
     */
    public void cancel(Long productId) {
        ScheduledFuture<?> future = jobs.remove(productId);
        if (future != null) {
            boolean cancelled = future.cancel(false);
            log.info("Auction end task for product {} cancelled: {}", productId, cancelled);
        }
    }
    
    /**
     * Reschedule auction end to a new time
     * Useful for auto-extend functionality
     * @param productId the product ID
     * @param newEndTime the new end time
     * @param task the task to execute when auction ends
     */
    public void rescheduleEndAuction(Long productId, Instant newEndTime, Runnable task) {
        log.info("Rescheduling auction end for product {} to new time: {}", productId, newEndTime);
        
        // Cancel existing schedule
        ScheduledFuture<?> oldFuture = jobs.remove(productId);
        if (oldFuture != null) {
            boolean cancelled = oldFuture.cancel(false);
            log.debug("Previous auction end task cancelled: {}", cancelled);
        }
        
        // Schedule with new time
        try {
            ScheduledFuture<?> newFuture = taskScheduler.schedule(task, Date.from(newEndTime));
            jobs.put(productId, newFuture);
            log.info("Auction end rescheduled successfully for product {} to {}", productId, newEndTime);
        } catch (Exception e) {
            log.error("Failed to reschedule auction end for product {}: {}", productId, e.getMessage(), e);
        }
    }
}
