-- Insert conversations manually into chatdb
-- Run this command: docker exec -it chat-db psql -U chat_user -d chatdb -f /docker-entrypoint-initdb.d/insert-conversations.sql
-- Or connect directly: psql -U chat_user -d chatdb -h localhost -p 5434

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
        CURRENT_TIMESTAMP - INTERVAL '30 minutes', 
        2, 
        1,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP - INTERVAL '30 minutes'
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
        CURRENT_TIMESTAMP - INTERVAL '2 hours', 
        0, 
        0,
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP - INTERVAL '2 hours'
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
        CURRENT_TIMESTAMP - INTERVAL '1 day', 
        0, 
        1,
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    )
ON CONFLICT (order_id) DO UPDATE SET
    seller_id = EXCLUDED.seller_id,
    seller_name = EXCLUDED.seller_name,
    bidder_id = EXCLUDED.bidder_id,
    bidder_name = EXCLUDED.bidder_name,
    updated_at = CURRENT_TIMESTAMP;

