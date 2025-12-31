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

/**
 * Service for managing auction scheduling
 * Handles auction end scheduling, cancellation, and rescheduling
 */
@Service
public class AuctionService {
    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);

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
        log.info("Scheduling auction end for product {} at {}", productId, endTime);
        cancel(productId); // Cancel existing job to avoid duplicates
        if (endTime.isBefore(Instant.now())) {
            log.warn("End time already passed, no executing immediately");
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
     * Check if product has a scheduled task
     * @param productId the product ID
     * @return true if scheduled
     */
    public boolean isScheduled(Long productId) {
        ScheduledFuture<?> future = jobs.get(productId);
        return future != null && !future.isDone() && !future.isCancelled();
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
    
    /**
     * Extend auction end time by specified seconds
     * @param productId the product ID
     * @param extendSeconds seconds to extend
     * @param task the task to execute when auction ends
     */
    public void extendAuction(Long productId, int extendSeconds, Runnable task) {
        Instant newEndTime = Instant.now().plusSeconds(extendSeconds);
        log.info("Extending auction for product {} by {} seconds to {}", productId, extendSeconds, newEndTime);
        rescheduleEndAuction(productId, newEndTime, task);
    }
}
