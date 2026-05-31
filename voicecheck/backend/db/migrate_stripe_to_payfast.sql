-- Migration: Stripe → PayFast
-- Run this once against your existing production database.
-- Safe to run on both PostgreSQL and SQLite 3.25+.
-- For a FRESH deploy, skip this — create_all will use the correct column names.

-- 1. Rename stripe_customer_id → payfast_token on users table
ALTER TABLE users RENAME COLUMN stripe_customer_id TO payfast_token;

-- 2. Rename stripe_subscription_id → payfast_token on subscriptions table
ALTER TABLE subscriptions RENAME COLUMN stripe_subscription_id TO payfast_token;

-- 3. Rename the Stripe webhook idempotency table
ALTER TABLE processed_stripe_events RENAME TO processed_itn_events;
