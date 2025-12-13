-- Insert sample messages into chatdb
-- Run this command: docker exec -it chat-db psql -U chat_user -d chatdb -f /docker-entrypoint-initdb.d/insert-messages.sql
-- Or connect directly: psql -U chat_user -d chatdb -h localhost -p 5434

-- Insert messages for ORD-001
INSERT INTO messages (order_id, sender_role, sender_name, sender_email, content, created_at)
VALUES
    ('ORD-001', 'SELLER', 'Seller ORD-001', 'seller@example.com', 'Hello! Thank you for your bid. The item is ready for payment.', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('ORD-001', 'BIDDER', 'Alice Johnson', 'alice@example.com', 'Thank you! I will send the payment today.', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
    ('ORD-001', 'SELLER', 'Seller ORD-001', 'seller@example.com', 'Great! Please send the payment within 24 hours.', CURRENT_TIMESTAMP - INTERVAL '25 minutes'),
    ('ORD-001', 'SELLER', 'Seller ORD-001', 'seller@example.com', 'I will prepare the item for shipping once payment is confirmed.', CURRENT_TIMESTAMP - INTERVAL '20 minutes')
ON CONFLICT DO NOTHING;

-- Insert messages for ORD-002
INSERT INTO messages (order_id, sender_role, sender_name, sender_email, content, created_at)
VALUES
    ('ORD-002', 'SELLER', 'Seller ORD-002', 'seller@example.com', 'Hello! Your payment has been received. I will ship the item soon.', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('ORD-002', 'BIDDER', 'Bob Smith', 'bob@example.com', 'When will you ship the item?', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('ORD-002', 'SELLER', 'Seller ORD-002', 'seller@example.com', 'I will ship it tomorrow morning. You will receive tracking info soon.', CURRENT_TIMESTAMP - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Insert messages for ORD-003
INSERT INTO messages (order_id, sender_role, sender_name, sender_email, content, created_at)
VALUES
    ('ORD-003', 'BIDDER', 'Charlie Brown', 'charlie@example.com', 'Hello! I received the payment confirmation. When will you ship?', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('ORD-003', 'SELLER', 'Seller ORD-003', 'seller@example.com', 'I will ship it today. You will get tracking number soon.', CURRENT_TIMESTAMP - INTERVAL '1 day 23 hours'),
    ('ORD-003', 'BIDDER', 'Charlie Brown', 'charlie@example.com', 'Thank you! Looking forward to receiving it.', CURRENT_TIMESTAMP - INTERVAL '1 day 22 hours'),
    ('ORD-003', 'SELLER', 'Seller ORD-003', 'seller@example.com', 'The package has been shipped. Tracking number: TR123456789', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

