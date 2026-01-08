-- Migration: Add Stripe payment fields to orders table
-- Date: 2024
-- Description: Adds Stripe payment integration fields to support payment tracking and audit trails

ALTER TABLE `orders`
  ADD COLUMN `stripe_payment_intent_id` varchar(255) NULL AFTER `shipping_address`,
  ADD COLUMN `payment_status` enum('pending', 'completed', 'failed') DEFAULT 'pending' AFTER `stripe_payment_intent_id`,
  ADD COLUMN `payment_attempted_at` timestamp NULL AFTER `payment_status`,
  ADD COLUMN `payment_completed_at` timestamp NULL AFTER `payment_attempted_at`,
  ADD COLUMN `payment_failed_at` timestamp NULL AFTER `payment_completed_at`,
  ADD COLUMN `payment_failure_reason` text NULL AFTER `payment_failed_at`;

-- Add index on stripe_payment_intent_id for faster lookups
CREATE INDEX `idx_orders_stripe_payment_intent_id` ON `orders`(`stripe_payment_intent_id`);

-- Add index on payment_status for filtering
CREATE INDEX `idx_orders_payment_status` ON `orders`(`payment_status`);
