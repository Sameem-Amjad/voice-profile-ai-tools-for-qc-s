-- Add result_json column to analysis_results table
-- Run this once against the production Supabase database.
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS result_json TEXT;
