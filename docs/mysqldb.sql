CREATE TABLE `users` (
  `id` int PRIMARY KEY,
  `email` varchar(255) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255),
  `role` varchar(20) NOT NULL DEFAULT 'bidder',
  `phone` varchar(30),
  `address` text,
  `is_email_verified` boolean DEFAULT false,
  `otp_verified` boolean DEFAULT false,
  `positive_reviews` int DEFAULT 0,
  `negative_reviews` int DEFAULT 0,
  `rating_percent` numeric(5,2) DEFAULT 0,
  `created_at` timestamp DEFAULT 'now()',
  `updated_at` timestamp
);

CREATE TABLE `categories` (
  `id` int PRIMARY KEY,
  `name` varchar(200) NOT NULL,
  `parent_id` int,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `products` (
  `id` int PRIMARY KEY,
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
  `created_at` timestamp DEFAULT 'now()',
  `updated_at` timestamp
);

CREATE TABLE `product_images` (
  `id` int PRIMARY KEY,
  `product_id` int NOT NULL,
  `url` text NOT NULL,
  `sort_order` int DEFAULT 0,
  `is_primary` boolean DEFAULT false,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `bids` (
  `id` int PRIMARY KEY,
  `product_id` int NOT NULL,
  `bidder_id` int NOT NULL,
  `amount` numeric(18,2) NOT NULL,
  `is_auto` boolean DEFAULT false,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `auto_bids` (
  `id` int PRIMARY KEY,
  `product_id` int NOT NULL,
  `bidder_id` int NOT NULL,
  `max_amount` numeric(18,2) NOT NULL,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `watchlists` (
  `id` int PRIMARY KEY,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `questions` (
  `id` int PRIMARY KEY,
  `product_id` int NOT NULL,
  `asker_id` int NOT NULL,
  `question` text NOT NULL,
  `answer` text,
  `answered_by` int,
  `created_at` timestamp DEFAULT 'now()',
  `answered_at` timestamp
);

CREATE TABLE `upgrade_requests` (
  `id` int PRIMARY KEY,
  `user_id` int NOT NULL,
  `requested_role` varchar(20) DEFAULT 'seller',
  `status` varchar(20) DEFAULT 'pending',
  `admin_id` int,
  `reviewed_at` timestamp,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `product_bans` (
  `id` int PRIMARY KEY,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reason` text,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `reviews` (
  `id` int PRIMARY KEY,
  `from_user_id` int NOT NULL,
  `to_user_id` int NOT NULL,
  `product_id` int,
  `score` int NOT NULL,
  `comment` text,
  `created_at` timestamp DEFAULT 'now()'
);

CREATE TABLE `orders` (
  `id` int PRIMARY KEY,
  `product_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `seller_id` int NOT NULL,
  `amount` numeric(18,2) NOT NULL,
  `status` varchar(30) DEFAULT 'pending',
  `payment_method` varchar(50),
  `shipping_address` text,
  `created_at` timestamp DEFAULT 'now()',
  `updated_at` timestamp
);

CREATE TABLE `payments` (
  `id` int PRIMARY KEY,
  `order_id` int NOT NULL,
  `provider` varchar(50) NOT NULL,
  `provider_type` varchar(50),
  `provider_txn_id` varchar(255),
  `amount` numeric(18,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `status` varchar(30) DEFAULT 'processing',
  `paid_at` timestamp,
  `refunded_amount` numeric(18,2) DEFAULT 0,
  `created_at` timestamp DEFAULT 'now()',
  `updated_at` timestamp
);

CREATE TABLE `notifications` (
  `id` int PRIMARY KEY,
  `user_id` int,
  `type` varchar(100),
  `payload` text,
  `is_read` boolean DEFAULT false,
  `created_at` timestamp DEFAULT 'now()'
);

ALTER TABLE `categories` ADD FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`);

ALTER TABLE `products` ADD FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`);

ALTER TABLE `products` ADD FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

ALTER TABLE `product_images` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `bids` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `bids` ADD FOREIGN KEY (`bidder_id`) REFERENCES `users` (`id`);

ALTER TABLE `auto_bids` ADD FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `auto_bids` ADD FOREIGN KEY (`bidder_id`) REFERENCES `users` (`id`);

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

ALTER TABLE `payments` ADD FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

ALTER TABLE `notifications` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
