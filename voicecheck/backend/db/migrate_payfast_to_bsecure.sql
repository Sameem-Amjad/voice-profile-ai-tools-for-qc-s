-- Migration: GoPayFast → bSecure
-- Run this once against your existing production database.
-- Safe to run on both PostgreSQL and SQLite 3.25+.
-- For a FRESH deploy, skip this — create_all will use the correct column names.

-- 1. Rename payfast_token → payment_token on users table
ALTER TABLE users RENAME COLUMN payfast_token TO payment_token;

-- 2. Rename payfast_token → payment_token on subscriptions table
ALTER TABLE subscriptions RENAME COLUMN payfast_token TO payment_token;
