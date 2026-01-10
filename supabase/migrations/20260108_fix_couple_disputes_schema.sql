-- Migration: Fix Couple Disputes Schema and Ensure Match Tables
-- Date: 2026-01-08
-- Description: Updates couple_disputes table to support dissolution protocol and ensures match/like tables exist.

-- 1. Update couple_disputes table
ALTER TABLE IF EXISTS couple_disputes
    ADD COLUMN IF NOT EXISTS frozen_assets_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS proposed_winner_id UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS winner_accepted_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
