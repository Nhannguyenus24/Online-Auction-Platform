-- Chat Service Database Schema
-- PostgreSQL

-- Create database (run manually if needed)
-- CREATE DATABASE chatdb;

-- Connect to chatdb
-- \c chatdb;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    seller_id VARCHAR(100),
    seller_name VARCHAR(100),
    seller_avatar VARCHAR(500),
    bidder_id VARCHAR(100),
    bidder_name VARCHAR(100),
    bidder_avatar VARCHAR(500),
    product_title VARCHAR(500),
    product_image VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
    amount DECIMAL(15, 2) DEFAULT 0,
    last_message_content TEXT,
    last_message_sender_role VARCHAR(20),
    last_message_time TIMESTAMP,
    unread_count_seller INTEGER DEFAULT 0,
    unread_count_bidder INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('SELLER', 'BIDDER')),
    sender_name VARCHAR(100),
    sender_email VARCHAR(200),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_bidder_id ON conversations(bidder_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

