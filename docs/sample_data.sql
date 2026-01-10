-- Sample Data for Online Auction Platform
-- This file contains test data for development and testing purposes

-- =====================
-- CLEAR EXISTING DATA (if any)
-- =====================
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM `messages`;
DELETE FROM `conversations`;
DELETE FROM `notifications`;
DELETE FROM `orders`;
DELETE FROM `reviews`;
DELETE FROM `product_bans`;
DELETE FROM `upgrade_requests`;
DELETE FROM `questions`;
DELETE FROM `watchlists`;
DELETE FROM `bids`;
DELETE FROM `product_images`;
DELETE FROM `products`;
DELETE FROM `categories`;
DELETE FROM `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================
-- INSERT USERS
-- password: String1234
-- =====================
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `phone`, `address`, `is_email_verified`, `positive_reviews`, `negative_reviews`) VALUES
(1, 'nhannguyentrong355@gmail.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Admin User', 'admin', '+84901234567', '123 Admin Street, Ho Chi Minh City', 1, 50, 1),
(2, 'seller1@example.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Nguyen Van A', 'seller', '+84912345678', '456 Seller Avenue, Ho Chi Minh City', 1, 45, 2),
(3, 'seller2@example.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Tran Thi B', 'seller', '+84923456789', '789 Merchant Road, Hanoi', 1, 38, 1),
(4, 'bidder1@example.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Pham Van C', 'bidder', '+84934567890', '321 Buyer Lane, Da Nang', 1, 15, 0),
(5, 'bidder2@example.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Le Thi D', 'bidder', '+84945678901', '654 Customer Street, Can Tho', 1, 22, 1),
(6, 'bidder3@example.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Hoang Van E', 'bidder', '+84956789012', '987 Shopper Court, Hai Phong', 1, 18, 0),
(7, 'seller3@example.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Ngo Thi F', 'seller', '+84967890123', '111 Shop Place, Nha Trang', 1, 52, 3),
(8, 'bidder4@example.com', '$2a$10$B9Nb3RVgybru2vvyVNRqrejtZG0V1o9XK8QUlm4lcwybozRwzbYEe', 'Do Van G', 'bidder', '+84978901234', '222 Auction Street, Vung Tau', 0, 5, 0);

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
(10, 2, 14, 'Vintage Book Collection', 'Lot of 5 classic vintage books including first editions, excellent collectible condition', 50.00, 95.00, 10.00, 150.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 1, 600, 'active', 78, 2),
(11, 3, 3, 'Dell XPS 15 Laptop', 'Dell XPS 15 with Intel i7, 16GB RAM, 512GB SSD, NVIDIA GTX 1650, pristine condition', 850.00, 900.00, 50.00, 1100.00, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY), 1, 600, 'active', 143, 3),
(12, 7, 2, 'Google Pixel 8 Pro', 'Google Pixel 8 Pro 256GB, unlocked, with original box and accessories', 650.00, 700.00, 30.00, 850.00, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY), 1, 600, 'active', 98, 4),
(13, 2, 4, 'Sony A7 III Camera Bundle', 'Sony A7 III full frame camera with 28-70mm lens, extra battery, memory card, and camera bag', 1800.00, 1950.00, 80.00, 2400.00, NOW(), DATE_ADD(NOW(), INTERVAL 12 DAY), 1, 600, 'active', 267, 6),
(14, 3, 7, 'KitchenAid Stand Mixer', 'KitchenAid Artisan 5-quart stand mixer in red, includes multiple attachments, barely used', 200.00, 240.00, 20.00, 320.00, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 1, 600, 'active', 112, 5),
(15, 7, 6, 'Modern Office Desk', 'Contemporary L-shaped office desk with built-in cable management, walnut finish', 250.00, 300.00, 25.00, 400.00, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 1, 600, 'active', 87, 3),
(16, 2, 10, 'Designer Handbag', 'Authentic designer leather handbag in excellent condition, comes with dust bag and authenticity card', 450.00, 520.00, 35.00, 700.00, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 600, 'active', 176, 6),
(17, 3, 11, 'Ray-Ban Aviator Sunglasses', 'Classic Ray-Ban Aviator sunglasses, gold frame, polarized lenses, with case', 80.00, 95.00, 10.00, 140.00, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 1, 600, 'active', 64, 2),
(18, 7, 13, 'Tennis Racket - Wilson Pro', 'Wilson Pro Staff tennis racket, professional grade, excellent condition, with cover', 120.00, 145.00, 15.00, 200.00, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY), 1, 600, 'active', 91, 4),
(19, 2, 1, 'Samsung 55" 4K Smart TV', 'Samsung 55-inch QLED 4K Smart TV with HDR, excellent picture quality, includes remote', 500.00, 580.00, 40.00, 750.00, NOW(), DATE_ADD(NOW(), INTERVAL 8 DAY), 1, 600, 'active', 203, 7),
(20, 3, 1, 'Bose QuietComfort Headphones', 'Bose QuietComfort 45 wireless noise-cancelling headphones, black, with charging case', 180.00, 220.00, 20.00, 280.00, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 1, 600, 'active', 134, 5),
(21, 7, 14, 'Harry Potter Complete Collection', 'Complete Harry Potter book series, hardcover first editions, mint condition', 150.00, 180.00, 15.00, 250.00, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY), 1, 600, 'active', 156, 4),
(22, 2, 15, 'Rare Pokemon Cards Collection', 'Collection of 50 rare Pokemon cards including holographic cards from early editions', 300.00, 360.00, 30.00, 500.00, NOW(), DATE_ADD(NOW(), INTERVAL 9 DAY), 1, 600, 'active', 289, 8),
(23, 3, 3, 'HP Pavilion Gaming Laptop', 'HP Pavilion Gaming laptop with Ryzen 7, 16GB RAM, RTX 3060, 1TB SSD, like new', 900.00, 1000.00, 50.00, 1250.00, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 600, 'active', 167, 6),
(24, 7, 9, 'Leather Biker Jacket', 'Genuine leather biker jacket, size L, black, classic style, excellent quality', 180.00, 215.00, 20.00, 300.00, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 1, 600, 'active', 98, 3),
(25, 2, 11, 'Apple Watch Series 9', 'Apple Watch Series 9 45mm, GPS + Cellular, midnight aluminum, with original bands', 320.00, 380.00, 30.00, 480.00, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 1, 600, 'active', 221, 7),
(26, 3, 4, 'GoPro Hero 12 Black', 'GoPro Hero 12 Black action camera with accessories bundle including mounts and extra batteries', 280.00, 330.00, 25.00, 420.00, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY), 1, 600, 'active', 145, 5),
(27, 7, 6, 'Velvet Sofa 3-Seater', 'Luxury velvet 3-seater sofa in emerald green, modern design, very comfortable', 600.00, 700.00, 50.00, 900.00, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 1, 600, 'active', 178, 6),
(28, 2, 7, 'Dyson V15 Vacuum Cleaner', 'Dyson V15 Detect cordless vacuum cleaner with laser dust detection, all attachments included', 400.00, 470.00, 35.00, 600.00, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY), 1, 600, 'active', 132, 5),
(29, 3, 13, 'Professional Yoga Mat Set', 'Premium yoga mat with alignment lines, includes carrying strap, blocks, and resistance bands', 40.00, 55.00, 5.00, 80.00, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 1, 600, 'active', 76, 3),
(30, 7, 15, 'Vintage Vinyl Records Lot', 'Collection of 20 vintage vinyl records from the 70s and 80s, classic rock and pop, excellent condition', 100.00, 130.00, 10.00, 200.00, NOW(), DATE_ADD(NOW(), INTERVAL 8 DAY), 1, 600, 'active', 145, 4);

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
(16, 10, 'https://example.com/images/vintage_books_1.jpg', 1),
(17, 11, 'https://example.com/images/dell_xps_1.jpg', 1),
(18, 11, 'https://example.com/images/dell_xps_2.jpg', 0),
(19, 12, 'https://example.com/images/pixel8_1.jpg', 1),
(20, 13, 'https://example.com/images/sony_a7iii_1.jpg', 1),
(21, 13, 'https://example.com/images/sony_a7iii_2.jpg', 0),
(22, 14, 'https://example.com/images/kitchenaid_1.jpg', 1),
(23, 15, 'https://example.com/images/office_desk_1.jpg', 1),
(24, 16, 'https://example.com/images/designer_bag_1.jpg', 1),
(25, 16, 'https://example.com/images/designer_bag_2.jpg', 0),
(26, 17, 'https://example.com/images/rayban_1.jpg', 1),
(27, 18, 'https://example.com/images/tennis_racket_1.jpg', 1),
(28, 19, 'https://example.com/images/samsung_tv_1.jpg', 1),
(29, 19, 'https://example.com/images/samsung_tv_2.jpg', 0),
(30, 20, 'https://example.com/images/bose_headphones_1.jpg', 1),
(31, 21, 'https://example.com/images/harry_potter_1.jpg', 1),
(32, 22, 'https://example.com/images/pokemon_cards_1.jpg', 1),
(33, 22, 'https://example.com/images/pokemon_cards_2.jpg', 0),
(34, 23, 'https://example.com/images/hp_gaming_1.jpg', 1),
(35, 24, 'https://example.com/images/leather_jacket_1.jpg', 1),
(36, 25, 'https://example.com/images/apple_watch_1.jpg', 1),
(37, 25, 'https://example.com/images/apple_watch_2.jpg', 0),
(38, 26, 'https://example.com/images/gopro_1.jpg', 1),
(39, 27, 'https://example.com/images/velvet_sofa_1.jpg', 1),
(40, 27, 'https://example.com/images/velvet_sofa_2.jpg', 0),
(41, 28, 'https://example.com/images/dyson_1.jpg', 1),
(42, 29, 'https://example.com/images/yoga_mat_1.jpg', 1),
(43, 30, 'https://example.com/images/vinyl_records_1.jpg', 1),
(44, 30, 'https://example.com/images/vinyl_records_2.jpg', 0);

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
INSERT INTO `reviews` (`id`, `from_user_id`, `to_user_id`, `product_id`, `comment`) VALUES
(1, 4, 2, 1, 'Excellent seller, fast shipping, product is exactly as described.'),
(2, 5, 2, 2, 'Very professional seller, highly recommended!'),
(3, 6, 2, 4, 'Good quality furniture, minor scratches on delivery but overall satisfied.'),
(4, 4, 7, 5, 'Great product, seller very responsive to questions.'),
(5, 5, 7, 8, 'Good bike, as described. Shipping took a bit longer than expected.');

-- =====================
-- INSERT ORDERS
-- =====================
INSERT INTO `orders` (`id`, `product_id`, `buyer_id`, `seller_id`, `amount`, `status`, `payment_method`, `shipping_address`, `stripe_payment_intent_id`, `payment_status`, `payment_attempted_at`, `payment_completed_at`, `payment_failed_at`, `payment_failure_reason`) VALUES
(1, 1, 6, 2, 950.00, 'completed', 'credit_card', '987 Shopper Court, Hai Phong, Vietnam', 'pi_1234567890abcdef', 'completed', NOW(), NOW(), NULL, NULL),
(2, 4, 5, 2, 380.00, 'completed', 'credit_card', '654 Customer Street, Can Tho, Vietnam', 'pi_0987654321fedcba', 'completed', NOW(), NOW(), NULL, NULL),
(3, 5, 4, 7, 720.00, 'pending_payment', 'bank_transfer', '321 Buyer Lane, Da Nang, Vietnam', NULL, 'pending', NULL, NULL, NULL, NULL),
(4, 8, 6, 7, 500.00, 'shipped', 'credit_card', '987 Shopper Court, Hai Phong, Vietnam', 'pi_abcdef1234567890', 'completed', NOW(), NOW(), NULL, NULL),
(5, 10, 4, 3, 95.00, 'completed', 'wallet', '321 Buyer Lane, Da Nang, Vietnam', NULL, 'completed', NOW(), NOW(), NULL, NULL);

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
(1, '1', '2', 'Nguyen Van A', 'https://example.com/avatars/seller1.jpg', '6', 'Hoang Van E', 'https://example.com/avatars/bidder3.jpg', 'iPhone 14 Pro Max 256GB', 'https://example.com/images/iphone14pro_1.jpg', 'completed', 950.00, 'Thank you for the purchase!', 'SELLER', NOW(), 0, 0),
(2, '2', '2', 'Nguyen Van A', 'https://example.com/avatars/seller1.jpg', '5', 'Le Thi D', 'https://example.com/avatars/bidder2.jpg', 'Wooden Dining Table Set', 'https://example.com/images/dining_table_1.jpg', 'completed', 380.00, 'Please confirm receipt of the table.', 'SELLER', NOW(), 1, 0),
(3, '3', '7', 'Ngo Thi F', 'https://example.com/avatars/seller3.jpg', '4', 'Pham Van C', 'https://example.com/avatars/bidder1.jpg', 'Stainless Steel Refrigerator', 'https://example.com/images/lg_fridge_1.jpg', 'pending_payment', 720.00, 'Waiting for payment confirmation.', 'SELLER', NOW(), 0, 1),
(4, '4', '7', 'Ngo Thi F', 'https://example.com/avatars/seller3.jpg', '6', 'Hoang Van E', 'https://example.com/avatars/bidder3.jpg', 'Mountain Bike - Trek X-Caliber', 'https://example.com/images/trek_bike_1.jpg', 'shipped', 500.00, 'Your order has been shipped. Tracking: TRK123456', 'SELLER', NOW(), 0, 0),
(5, '5', '3', 'Tran Thi B', 'https://example.com/avatars/seller2.jpg', '4', 'Pham Van C', 'https://example.com/avatars/bidder1.jpg', 'Vintage Book Collection', 'https://example.com/images/vintage_books_1.jpg', 'completed', 95.00, 'Perfect condition books! Thank you.', 'BIDDER', NOW(), 0, 0);

-- =====================
-- INSERT MESSAGES (Chat Service)
-- =====================
INSERT INTO `messages` (`id`, `order_id`, `sender_role`, `sender_name`, `sender_email`, `content`) VALUES
(1, '1', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Hi, your item has been packed and will be shipped today.'),
(2, '1', 'BIDDER', 'Hoang Van E', 'bidder3@example.com', 'Great! Thanks for the quick packing.'),
(3, '1', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Thank you for the purchase!'),
(4, '2', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Your dining table has been carefully packaged.'),
(5, '2', 'SELLER', 'Nguyen Van A', 'seller1@example.com', 'Please confirm receipt of the table.'),
(6, '3', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Your refrigerator is ready to ship. Please arrange payment.'),
(7, '3', 'BIDDER', 'Pham Van C', 'bidder1@example.com', 'I will transfer payment today. Please wait.'),
(8, '3', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Waiting for payment confirmation.'),
(9, '4', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Your bike is being prepared for shipment.'),
(10, '4', 'SELLER', 'Ngo Thi F', 'seller3@example.com', 'Your order has been shipped. Tracking: TRK123456'),
(11, '5', 'SELLER', 'Tran Thi B', 'seller2@example.com', 'Your books are carefully packaged and ready to ship.'),
(12, '5', 'BIDDER', 'Pham Van C', 'bidder1@example.com', 'Perfect condition books! Thank you.');

-- =====================
-- SUMMARY OF TEST DATA
-- =====================
-- Users: 8 users (1 admin, 3 sellers, 4 bidders)
-- Categories: 15 categories (with parent-child relationships)
-- Products: 30 active auction products
-- Product Images: 44 images
-- Bids: 20 bids (mix of manual and auto bids)
-- Auto Bids: 10 auto bids
-- Watchlists: 11 watchlist entries
-- Questions: 5 Q&A entries
-- Upgrade Requests: 4 seller upgrade requests
-- Reviews: 5 reviews
-- Orders: 5 orders in various statuses
-- Notifications: 8 notifications
-- Conversations: 5 chat conversations
-- Messages: 12 chat messages
