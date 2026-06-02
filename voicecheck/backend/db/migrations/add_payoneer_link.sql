-- Migration: add payoneer_link column to users table
-- Run once against existing databases (SQLite and PostgreSQL compatible)

ALTER TABLE users ADD COLUMN payoneer_link VARCHAR(1024);
