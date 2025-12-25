-- Sample Data for Online Auction Platform
-- This file contains test data for development and testing purposes

-- =====================
-- INSERT USERS
-- =====================
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `phone`, `address`, `is_email_verified`, `positive_reviews`, `negative_reviews`, `rating_percent`) VALUES
(1, 'nhannguyentrong355@gmail.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Admin User', 'admin', '+84901234567', '123 Admin Street, Ho Chi Minh City', 1, 50, 1, 98.03),
(2, 'seller1@example.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Nguyen Van A', 'seller', '+84912345678', '456 Seller Avenue, Ho Chi Minh City', 1, 45, 2, 95.74),
(3, 'seller2@example.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Tran Thi B', 'seller', '+84923456789', '789 Merchant Road, Hanoi', 1, 38, 1, 97.43),
(4, 'bidder1@example.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Pham Van C', 'bidder', '+84934567890', '321 Buyer Lane, Da Nang', 1, 15, 0, 100.00),
(5, 'bidder2@example.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Le Thi D', 'bidder', '+84945678901', '654 Customer Street, Can Tho', 1, 22, 1, 95.65),
(6, 'bidder3@example.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Hoang Van E', 'bidder', '+84956789012', '987 Shopper Court, Hai Phong', 1, 18, 0, 100.00),
(7, 'seller3@example.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Ngo Thi F', 'seller', '+84967890123', '111 Shop Place, Nha Trang', 1, 52, 3, 94.54),
(8, 'bidder4@example.com', '$2a$10$DBbPMziEIn7at7ZjykJ/8uN3v4oW9ibXDcMt91EkowlGtdAkwFusG', 'Do Van G', 'bidder', '+84978901234', '222 Auction Street, Vung Tau', 0, 5, 0, 100.00);

-- =====================
-- INSERT CATEGORIES
-- =====================
INSERT INTO `categories` (`id`, `name`, `parent_id`) VALUES
(1, 'Electronics', NULL),
(2, 'Smartphones', 1),
(3, 'Laptops', 1),
(4, 'Cameras', 1),
(5, 'Home & Garden', NULL),
(6, 'Furniture', 5),
(7, 'Kitchen Appliances', 5),
(8, 'Fashion', NULL),
(9, 'Men''s Clothing', 8),
(10, 'Women''s Clothing', 8),
(11, 'Accessories', 8),
(12, 'Sports & Outdoors', NULL),
(13, 'Sporting Equipment', 12),
(14, 'Books', NULL),
(15, 'Collectibles', NULL);

-- =====================
-- INSERT PRODUCTS
-- =====================
INSERT INTO `products` (`id`, `seller_id`, `category_id`, `title`, `description`, `starting_price`, `current_price`, `step_price`, `buy_now_price`, `starts_at`, `ends_at`, `is_auto_extend`, `auto_extend_seconds`, `status`, `views_count`, `bids_count`) VALUES
(1, 2, 2, 'iPhone 14 Pro Max 256GB', 'Brand new sealed iPhone 14 Pro Max in Space Black with original accessories and warranty', 800.00, 950.00, 50.00, 1200.00, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 600, 'active', 245, 8),
(2, 2, 3, 'MacBook Air M2 2022', 'Apple MacBook Air 13-inch with Apple M2 chip, 8GB RAM, 256GB SSD. Excellent condition, barely used', 1000.00, 1150.00, 75.00, 1500.00, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 1, 600, 'active', 189, 5),
(3, 3, 4, 'Canon EOS R5 Camera', 'Professional Canon EOS R5 mirrorless camera body with 2 batteries, charger, and original box', 2500.00, 2700.00, 100.00, 3200.00, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 1, 600, 'active', 456, 12),
(4, 2, 6, 'Wooden Dining Table Set', 'Beautiful 6-seater wooden dining table with chairs. Solid oak wood, very sturdy construction', 300.00, 380.00, 20.00, 500.00, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 1, 600, 'active', 167, 6),
(5, 7, 7, 'Stainless Steel Refrigerator', 'LG French Door Refrigerator 28 cubic feet, ice maker, water dispenser, stainless steel, excellent condition', 600.00, 720.00, 50.00, 900.00, NOW(), DATE_ADD(NOW(), INTERVAL 8 DAY), 1, 600, 'active', 123, 4),
(6, 3, 9, 'Designer Winter Jacket', 'Premium wool blend winter jacket by a renowned designer, size M, black color, never worn', 150.00, 185.00, 15.00, 250.00, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 1, 600, 'active', 89, 3),
(7, 2, 11, 'Rolex Watch Replica Quality', 'High-quality luxury watch, stainless steel, automatic movement, comes with box and certificate', 200.00, 275.00, 25.00, 400.00, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY), 1, 600, 'active', 234, 7),
(8, 7, 13, 'Mountain Bike - Trek X-Caliber', 'Trek X-Caliber 8 aluminum hardtail mountain bike, 29 inch wheels, perfect for beginners', 400.00, 500.00, 40.00, 650.00, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY), 1, 600, 'active', 156, 5),
(9, 3, 2, 'Samsung Galaxy S24 Ultra', 'Latest Samsung Galaxy S24 Ultra in Titanium Gray, 512GB, brand new sealed box', 900.00, 1050.00, 60.00, 1300.00, NOW(), DATE_ADD(NOW(), INTERVAL 9 DAY), 1, 600, 'active', 312, 9),
(10, 2, 14, 'Vintage Book Collection', 'Lot of 5 classic vintage books including first editions, excellent collectible condition', 50.00, 95.00, 10.00, 150.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 1, 600, 'active', 78, 2);

-- =====================
-- INSERT PRODUCT IMAGES
-- =====================
INSERT INTO `product_images` (`id`, `product_id`, `url`, `is_primary`) VALUES
(1, 1, 'https://example.com/images/iphone14pro_1.jpg', 1),
(2, 1, 'https://example.com/images/iphone14pro_2.jpg', 0),
(3, 1, 'https://example.com/images/iphone14pro_3.jpg', 0),
(4, 2, 'https://example.com/images/macbook_m2_1.jpg', 1),
(5, 2, 'https://example.com/images/macbook_m2_2.jpg', 0),
(6, 3, 'https://example.com/images/canon_eos_r5_1.jpg', 1),
(7, 3, 'https://example.com/images/canon_eos_r5_2.jpg', 0),
(8, 4, 'https://example.com/images/dining_table_1.jpg', 1),
(9, 4, 'https://example.com/images/dining_table_2.jpg', 0),
(10, 5, 'https://example.com/images/lg_fridge_1.jpg', 1),
(11, 6, 'https://example.com/images/winter_jacket_1.jpg', 1),
(12, 7, 'https://example.com/images/watch_1.jpg', 1),
(13, 8, 'https://example.com/images/trek_bike_1.jpg', 1),
(14, 8, 'https://example.com/images/trek_bike_2.jpg', 0),
(15, 9, 'https://example.com/images/samsung_s24_1.jpg', 1),
(16, 10, 'https://example.com/images/vintage_books_1.jpg', 1);

-- =====================
-- INSERT BIDS
-- =====================
INSERT INTO `bids` (`id`, `product_id`, `bidder_id`, `amount`, `is_auto`) VALUES
(1, 1, 4, 900.00, 0),
(2, 1, 5, 920.00, 0),
(3, 1, 6, 950.00, 1),
(4, 2, 4, 1100.00, 0),
(5, 2, 5, 1150.00, 1),
(6, 3, 4, 2600.00, 0),
(7, 3, 6, 2700.00, 1),
(8, 3, 5, 2800.00, 0),
(9, 4, 5, 360.00, 0),
(10, 4, 6, 380.00, 1),
(11, 5, 4, 700.00, 0),
(12, 5, 5, 720.00, 1),
(13, 6, 6, 170.00, 0),
(14, 6, 4, 185.00, 1),
(15, 7, 5, 250.00, 0),
(16, 7, 4, 275.00, 1),
(17, 8, 6, 480.00, 0),
(18, 8, 5, 500.00, 1),
(19, 9, 4, 1000.00, 0),
(20, 9, 6, 1050.00, 1);

-- =====================
-- INSERT AUTO BIDS
-- =====================
INSERT INTO `auto_bids` (`id`, `product_id`, `bidder_id`, `max_amount`) VALUES
(1, 1, 6, 1000.00),
(2, 2, 5, 1200.00),
(3, 3, 7, 3000.00),
(4, 4, 6, 400.00),
(5, 5, 5, 800.00),
(6, 6, 4, 220.00),
(7, 7, 4, 350.00),
(8, 8, 5, 550.00),
(9, 9, 6, 1100.00),
(10, 10, 4, 120.00);

-- =====================
-- INSERT WATCHLISTS
-- =====================
INSERT INTO `watchlists` (`id`, `user_id`, `product_id`) VALUES
(1, 4, 1),
(2, 4, 3),
(3, 4, 7),
(4, 5, 2),
(5, 5, 5),
(6, 5, 8),
(7, 6, 1),
(8, 6, 4),
(9, 6, 9),
(10, 8, 2),
(11, 8, 10);

-- =====================
-- INSERT QUESTIONS
-- =====================
INSERT INTO `questions` (`id`, `product_id`, `asker_id`, `question`, `answer`, `answered_by`, `answered_at`) VALUES
(1, 1, 4, 'Is this phone still under warranty?', 'Yes, it comes with 1 year Apple warranty from the purchase date.', 2, NOW()),
(2, 1, 5, 'Can you ship internationally?', 'Yes, I can ship to most countries. Shipping cost will depend on location.', 2, NOW()),
(3, 2, 4, 'What is the condition of the keyboard?', 'The keyboard is in perfect condition, no issues at all.', 2, NOW()),
(4, 3, 6, 'Does it come with lenses?', 'No, only the camera body is included. Lenses are sold separately.', 3, NOW()),
(5, 5, 8, 'Is there any damage to the fridge?', 'No damage, works perfectly. Asking because I need to upgrade.', 7, NOW());

-- =====================
-- INSERT UPGRADE REQUESTS
-- =====================
INSERT INTO `upgrade_requests` (`id`, `user_id`, `requested_role`, `status`, `admin_id`) VALUES
(1, 4, 'seller', 'pending', NULL),
(2, 5, 'seller', 'approved', 1),
(3, 8, 'seller', 'pending', NULL),
(4, 6, 'seller', 'rejected', 1);

-- =====================
-- INSERT REVIEWS
-- =====================
INSERT INTO `reviews` (`id`, `from_user_id`, `to_user_id`, `product_id`, `score`, `comment`) VALUES
(1, 4, 2, 1, 5, 'Excellent seller, fast shipping, product is exactly as described.'),
(2, 5, 2, 2, 5, 'Very professional seller, highly recommended!'),
(3, 6, 2, 4, 4, 'Good quality furniture, minor scratches on delivery but overall satisfied.'),
(4, 4, 7, 5, 5, 'Great product, seller very responsive to questions.'),
(5, 5, 7, 8, 4, 'Good bike, as described. Shipping took a bit longer than expected.');

-- =====================
-- INSERT ORDERS
-- =====================
INSERT INTO `orders` (`id`, `product_id`, `buyer_id`, `seller_id`, `amount`, `status`, `payment_method`, `shipping_address`) VALUES
(1, 1, 6, 2, 950.00, 'completed', 'credit_card', '987 Shopper Court, Hai Phong, Vietnam'),
(2, 4, 5, 2, 380.00, 'completed', 'credit_card', '654 Customer Street, Can Tho, Vietnam'),
(3, 5, 4, 7, 720.00, 'pending_payment', 'bank_transfer', '321 Buyer Lane, Da Nang, Vietnam'),
(4, 8, 6, 7, 500.00, 'shipped', 'credit_card', '987 Shopper Court, Hai Phong, Vietnam'),
(5, 10, 4, 3, 95.00, 'completed', 'wallet', '321 Buyer Lane, Da Nang, Vietnam');

-- =====================
-- INSERT PAYMENTS
-- =====================
INSERT INTO `payments` (`id`, `order_id`, `provider`, `provider_type`, `provider_txn_id`, `amount`, `currency`, `status`, `paid_at`) VALUES
(1, 1, 'stripe', 'credit_card', 'txn_stripe_001', 950.00, 'USD', 'completed', NOW()),
(2, 2, 'paypal', 'paypal', 'txn_paypal_001', 380.00, 'USD', 'completed', NOW()),
(3, 4, 'stripe', 'credit_card', 'txn_stripe_002', 500.00, 'USD', 'completed', NOW()),
(4, 5, 'wallet', 'wallet', 'txn_wallet_001', 95.00, 'USD', 'completed', NOW());

-- =====================
-- INSERT NOTIFICATIONS
-- =====================
INSERT INTO `notifications` (`id`, `user_id`, `type`, `payload`, `is_read`) VALUES
(1, 4, 'bid_outbid', '{"product_id": 1, "product_title": "iPhone 14 Pro Max 256GB", "new_highest_bid": 950.00}', 1),
(2, 5, 'bid_placed', '{"product_id": 1, "product_title": "iPhone 14 Pro Max 256GB"}', 1),
(3, 6, 'order_confirmed', '{"order_id": 1, "product_id": 1, "amount": 950.00}', 0),
(4, 2, 'new_question', '{"product_id": 1, "question_id": 1}', 1),
(5, 4, 'product_ended', '{"product_id": 10, "product_title": "Vintage Book Collection"}', 0),
(6, 5, 'seller_upgrade_approved', '{}', 0),
(7, 8, 'seller_upgrade_rejected', '{}', 0),
(8, 7, 'new_bid', '{"product_id": 5, "product_title": "Stainless Steel Refrigerator"}', 0);

-- =====================
-- INSERT CONVERSATIONS (Chat Service)
-- =====================
INSERT INTO `conversations` (`id`, `order_id`, `seller_id`, `seller_name`, `seller_avatar`, `bidder_id`, `bidder_name`, `bidder_avatar`, `product_title`, `product_image`, `status`, `amount`, `last_message_content`, `last_message_sender_role`, `last_message_time`, `unread_count_seller`, `unread_count_bidder`) VALUES
(1, 'order_1', '2', 'Nguyen Van A', 'https://example.com/avatars/seller1.jpg', '6', 'Hoang Van E', 'https://example.com/avatars/bidder3.jpg', 'iPhone 14 Pro Max 256GB', 'https://example.com/images/iphone14pro_1.jpg', 'completed', 950.00, 'Thank you for the purchase!', 'SELLER', NOW(), 0, 0),
(2, 'order_2', '2', 'Nguyen Van A', 'https://example.com/avatars/seller1.jpg', '5', 'Le Thi D', 'https://example.com/avatars/bidder2.jpg', 'Wooden Dining Table Set', 'https://example.com/images/dining_table_1.jpg', 'completed', 380.00, 'Please confirm receipt of the table.', 'SELLER', NOW(), 1, 0),
(3, 'order_3', '7', 'Ngo Thi F', 'https://example.com/avatars/seller3.jpg', '4', 'Pham Van C', 'https://example.com/avatars/bidder1.jpg', 'Stainless Steel Refrigerator', 'https://example.com/images/lg_fridge_1.jpg', 'pending_payment', 720.00, 'Waiting for payment confirmation.', 'SELLER', NOW(), 0, 1),
(4, 'order_4', '7', 'Ngo Thi F', 'https://example.com/avatars/seller3.jpg', '6', 'Hoang Van E', 'https://example.com/avatars/bidder3.jpg', 'Mountain Bike - Trek X-Caliber', 'https://example.com/images/trek_bike_1.jpg', 'shipped', 500.00, 'Your order has been shipped. Tracking: TRK123456', 'SELLER', NOW(), 0, 0),
(5, 'order_5', '3', 'Tran Thi B', 'https://example.com/avatars/seller2.jpg', '4', 'Pham Van C', 'https://example.com/avatars/bidder1.jpg', 'Vintage Book Collection', 'https://example.com/images/vintage_books_1.jpg', 'completed', 95.00, 'Perfect condition books! Thank you.', 'BIDDER', NOW(), 0, 0);

-- =====================
-- INSERT MESSAGES (Chat Service)
-- =====================
INSERT INTO `messages` (`id`, `order_id`, `sender_role`, `sender_name`, `sender_email`, `content`) VALUES
(1, 'order_1', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Hi, your item has been packed and will be shipped today.'),
(2, 'order_1', 'BIDDER', 'Hoang Van E', 'bidder3@example.com', 'Great! Thanks for the quick packing.'),
(3, 'order_1', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Thank you for the purchase!'),
(4, 'order_2', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Your dining table has been carefully packaged.'),
(5, 'order_2', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Please confirm receipt of the table.'),
(6, 'order_3', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Your refrigerator is ready to ship. Please arrange payment.'),
(7, 'order_3', 'BIDDER', 'Pham Van C', 'bidder1@example.com', 'I will transfer payment today. Please wait.'),
(8, 'order_3', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Waiting for payment confirmation.'),
(9, 'order_4', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Your bike is being prepared for shipment.'),
(10, 'order_4', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Your order has been shipped. Tracking: TRK123456'),
(11, 'order_5', 'SELLER', 'Tran Thi B', 'seller2@example.com', 'Your books are carefully packaged and ready to ship.'),
(12, 'order_5', 'BIDDER', 'Pham Van C', 'bidder1@example.com', 'Perfect condition books! Thank you.');

-- =====================
-- SUMMARY OF TEST DATA
-- =====================
-- Users: 8 users (1 admin, 3 sellers, 4 bidders)
-- Categories: 15 categories (with parent-child relationships)
-- Products: 10 active auction products
-- Product Images: 16 images
-- Bids: 20 bids (mix of manual and auto bids)
-- Auto Bids: 10 auto bids
-- Watchlists: 11 watchlist entries
-- Questions: 5 Q&A entries
-- Upgrade Requests: 4 seller upgrade requests
-- Reviews: 5 reviews
-- Orders: 5 orders in various statuses
-- Payments: 4 payments
-- Notifications: 8 notifications
-- Conversations: 5 chat conversations
-- Messages: 12 chat messages
