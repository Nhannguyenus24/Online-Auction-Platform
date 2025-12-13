-- Insert sample messages into mydb (MySQL)
-- Run this command: docker exec -it mysql mysql -uroot -proot123 mydb < insert-messages.sql
-- Or connect directly: mysql -uroot -proot123 -h localhost -P 3306 mydb

-- Insert messages for ORD-001
INSERT IGNORE INTO messages (order_id, sender_role, sender_name, sender_email, content, created_at)
VALUES
    ('ORD-001', 'SELLER', 'Seller ORD-001', 'seller@example.com', 'Hello! Thank you for your bid. The item is ready for payment.', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
    ('ORD-001', 'BIDDER', 'Alice Johnson', 'alice@example.com', 'Thank you! I will send the payment today.', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
    ('ORD-001', 'SELLER', 'Seller ORD-001', 'seller@example.com', 'Great! Please send the payment within 24 hours.', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
    ('ORD-001', 'SELLER', 'Seller ORD-001', 'seller@example.com', 'I will prepare the item for shipping once payment is confirmed.', DATE_SUB(NOW(), INTERVAL 20 MINUTE));

-- Insert messages for ORD-002
INSERT IGNORE INTO messages (order_id, sender_role, sender_name, sender_email, content, created_at)
VALUES
    ('ORD-002', 'SELLER', 'Seller ORD-002', 'seller@example.com', 'Hello! Your payment has been received. I will ship the item soon.', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    ('ORD-002', 'BIDDER', 'Bob Smith', 'bob@example.com', 'When will you ship the item?', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    ('ORD-002', 'SELLER', 'Seller ORD-002', 'seller@example.com', 'I will ship it tomorrow morning. You will receive tracking info soon.', DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- Insert messages for ORD-003
INSERT IGNORE INTO messages (order_id, sender_role, sender_name, sender_email, content, created_at)
VALUES
    ('ORD-003', 'BIDDER', 'Charlie Brown', 'charlie@example.com', 'Hello! I received the payment confirmation. When will you ship?', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    ('ORD-003', 'SELLER', 'Seller ORD-003', 'seller@example.com', 'I will ship it today. You will get tracking number soon.', DATE_SUB(NOW(), INTERVAL 1 DAY + INTERVAL 23 HOUR)),
    ('ORD-003', 'BIDDER', 'Charlie Brown', 'charlie@example.com', 'Thank you! Looking forward to receiving it.', DATE_SUB(NOW(), INTERVAL 1 DAY + INTERVAL 22 HOUR)),
    ('ORD-003', 'SELLER', 'Seller ORD-003', 'seller@example.com', 'The package has been shipped. Tracking number: TR123456789', DATE_SUB(NOW(), INTERVAL 1 DAY));

