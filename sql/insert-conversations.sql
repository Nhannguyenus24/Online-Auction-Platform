-- Insert conversations manually into mydb (MySQL)
-- Run this command: docker exec -it mysql mysql -uroot -proot123 mydb < insert-conversations.sql
-- Or connect directly: mysql -uroot -proot123 -h localhost -P 3306 mydb

-- Insert conversations for seller (seller_id = 'mock-seller')
INSERT INTO conversations (
    order_id, 
    seller_id, 
    seller_name, 
    seller_avatar, 
    bidder_id, 
    bidder_name, 
    bidder_avatar, 
    product_title, 
    product_image, 
    status, 
    amount, 
    last_message_content, 
    last_message_sender_role, 
    last_message_time, 
    unread_count_seller, 
    unread_count_bidder,
    created_at,
    updated_at
)
VALUES 
    (
        'ORD-001', 
        'mock-seller', 
        'Seller ORD-001', 
        '/anonymous-user.jpg', 
        'mock-bidder', 
        'Alice Johnson', 
        'https://i.pravatar.cc/150?img=1', 
        'Vintage Rolex Submariner Watch', 
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200', 
        'pending_payment', 
        25000000, 
        'Thank you! I will send the payment today.', 
        'BIDDER', 
        DATE_SUB(NOW(), INTERVAL 30 MINUTE), 
        2, 
        1,
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    ),
    (
        'ORD-002', 
        'mock-seller', 
        'Seller ORD-002', 
        '/anonymous-user.jpg', 
        'mock-bidder', 
        'Bob Smith', 
        'https://i.pravatar.cc/150?img=2', 
        'Omega Speedmaster Professional Moonwatch', 
        'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=200', 
        'paid', 
        18000000, 
        'When will you ship the item?', 
        'BIDDER', 
        DATE_SUB(NOW(), INTERVAL 2 HOUR), 
        0, 
        0,
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        DATE_SUB(NOW(), INTERVAL 2 HOUR)
    ),
    (
        'ORD-003', 
        'mock-seller', 
        'Seller ORD-003', 
        '/anonymous-user.jpg', 
        'mock-bidder', 
        'Charlie Brown', 
        'https://i.pravatar.cc/150?img=3', 
        'TAG Heuer Carrera Automatic Chronograph', 
        'https://images.unsplash.com/photo-1606403726988-eb66a8c2d233?w=200', 
        'shipping', 
        12000000, 
        'The package has been shipped. Tracking number: TR123456789', 
        'SELLER', 
        DATE_SUB(NOW(), INTERVAL 1 DAY), 
        0, 
        1,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        DATE_SUB(NOW(), INTERVAL 1 DAY)
    )
ON DUPLICATE KEY UPDATE
    seller_id = VALUES(seller_id),
    seller_name = VALUES(seller_name),
    bidder_id = VALUES(bidder_id),
    bidder_name = VALUES(bidder_name),
    updated_at = NOW();

