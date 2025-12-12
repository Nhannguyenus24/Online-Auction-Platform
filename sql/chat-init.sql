-- Chat Service Database Schema
-- PostgreSQL

-- Create database (run manually if needed)
-- CREATE DATABASE chatdb;

-- Connect to chatdb
-- \c chatdb;

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

-- Create index for faster queries by orderId
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Note: Seed data can be added manually for testing via REST API or WebSocket

