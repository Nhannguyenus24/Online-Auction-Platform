CREATE TABLE `users` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `email` varchar(255) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255),
  `role` varchar(20) NOT NULL DEFAULT 'bidder', -- roles: bidder, seller, admin
  `phone` varchar(30),
  `address` text,
  `is_email_verified` boolean DEFAULT false,
  `positive_reviews` int DEFAULT 0,
  `negative_reviews` int DEFAULT 0,
  `rating_percent` numeric(5,2) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `categories` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `parent_id` int,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `products` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `seller_id` int NOT NULL,
  `category_id` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `starting_price` numeric(18,2) NOT NULL,
  `current_price` numeric(18,2) DEFAULT 0,
  `step_price` numeric(18,2) NOT NULL,
  `buy_now_price` numeric(18,2),
  `starts_at` timestamp NOT NULL,
  `ends_at` timestamp NOT NULL,
  `is_auto_extend` boolean DEFAULT true,
  `auto_extend_seconds` int DEFAULT 600,
  `status` varchar(30) DEFAULT 'active',
  `views_count` int DEFAULT 0,
  `bids_count` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `product_images` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `url` text NOT NULL,
  `is_primary` boolean DEFAULT false,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `bids` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `bidder_id` int NOT NULL,
  `amount` numeric(18,2) NOT NULL,
  `is_auto` boolean DEFAULT false,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `watchlists` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `questions` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `asker_id` int NOT NULL,
  `question` text NOT NULL,
  `answer` text,
  `answered_by` int,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `answered_at` timestamp
);

CREATE TABLE `upgrade_requests` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `requested_role` varchar(20) DEFAULT 'seller',
  `status` varchar(20) DEFAULT 'pending',
  `admin_id` int,
  `reviewed_at` timestamp,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `product_bans` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reason` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `reviews` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `from_user_id` int NOT NULL,
  `to_user_id` int NOT NULL,
  `product_id` int,
  `score` int NOT NULL,
  `comment` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `orders` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `seller_id` int NOT NULL,
  `amount` numeric(18,2) NOT NULL,
  `status` varchar(30) DEFAULT 'pending',
  `payment_method` varchar(50),
  `shipping_address` text,
  `stripe_payment_intent_id` varchar(255),
  `payment_status` enum('pending', 'completed', 'failed') DEFAULT 'pending',
  `payment_attempted_at` timestamp NULL,
  `payment_completed_at` timestamp NULL,
  `payment_failed_at` timestamp NULL,
  `payment_failure_reason` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `notifications` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int,
  `type` varchar(100),
  `payload` text,
  `is_read` boolean DEFAULT false,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Chat Service Tables
CREATE TABLE `conversations` (
  `id` bigint AUTO_INCREMENT PRIMARY KEY,
  `order_id` varchar(50) NOT NULL UNIQUE,
  `seller_id` varchar(100),
  `seller_name` varchar(100),
  `seller_avatar` varchar(500),
  `bidder_id` varchar(100),
  `bidder_name` varchar(100),
  `bidder_avatar` varchar(500),
  `product_title` varchar(500),
  `product_image` varchar(500),
  `status` varchar(50) NOT NULL DEFAULT 'pending_payment',
  `amount` decimal(15, 2) DEFAULT 0,
  `last_message_content` text,
  `last_message_sender_role` varchar(20),
  `last_message_time` timestamp,
  `unread_count_seller` int DEFAULT 0,
  `unread_count_bidder` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `messages` (
  `id` bigint AUTO_INCREMENT PRIMARY KEY,
  `order_id` varchar(50) NOT NULL,
  `sender_role` varchar(20) NOT NULL,
  `sender_name` varchar(100),
  `sender_email` varchar(200),
  `content` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  CHECK (`sender_role` IN ('SELLER', 'BIDDER'))
);

-- Indexes for chat tables
CREATE INDEX `idx_conversations_order_id` ON `conversations`(`order_id`);
CREATE INDEX `idx_conversations_seller_id` ON `conversations`(`seller_id`);
CREATE INDEX `idx_conversations_bidder_id` ON `conversations`(`bidder_id`);
CREATE INDEX `idx_conversations_updated_at` ON `conversations`(`updated_at`);
CREATE INDEX `idx_messages_order_id` ON `messages`(`order_id`);
CREATE INDEX `idx_messages_created_at` ON `messages`(`created_at`);

ALTER TABLE `categories` ADD FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`);

ALTER TABLE `products` ADD FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`);

ALTER TABLE `products` ADD FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

ALTER TABLE `product_images` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `bids` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `bids` ADD FOREIGN KEY (`bidder_id`) REFERENCES `users` (`id`);

ALTER TABLE `watchlists` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `watchlists` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `questions` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `questions` ADD FOREIGN KEY (`asker_id`) REFERENCES `users` (`id`);

ALTER TABLE `questions` ADD FOREIGN KEY (`answered_by`) REFERENCES `users` (`id`);

ALTER TABLE `upgrade_requests` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `upgrade_requests` ADD FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`);

ALTER TABLE `product_bans` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `product_bans` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `reviews` ADD FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `reviews` ADD FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `reviews` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `orders` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `orders` ADD FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`);

ALTER TABLE `orders` ADD FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`);

ALTER TABLE `notifications` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `products` ADD FULLTEXT `idx_fts_title` (`title`);