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

-- Make fields nullable to support service logic where they might not be available at creation
ALTER TABLE IF EXISTS couple_disputes ALTER COLUMN couple_agreement_id DROP NOT NULL;
ALTER TABLE IF EXISTS couple_disputes ALTER COLUMN dispute_reason DROP NOT NULL;

-- 2. Ensure profile_likes table exists (for MatchService)
CREATE TABLE IF NOT EXISTS profile_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    liker_id UUID NOT NULL REFERENCES profiles(id),
    liked_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);

-- 3. Ensure matches table exists (for MatchService)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES profiles(id), -- Legacy/Alternative
    user2_id UUID REFERENCES profiles(id), -- Legacy/Alternative
    profile_id_1 UUID REFERENCES profiles(id),
    profile_id_2 UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'accepted',
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for new tables
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own likes
CREATE POLICY "Users can view their own likes" ON profile_likes
    FOR SELECT USING (auth.uid() = liker_id);

-- Allow users to create likes
CREATE POLICY "Users can create likes" ON profile_likes
    FOR INSERT WITH CHECK (auth.uid() = liker_id);

-- Allow users to view their matches
CREATE POLICY "Users can view their matches" ON matches
    FOR SELECT USING (
        auth.uid() = user1_id OR 
        auth.uid() = user2_id OR 
        auth.uid() = profile_id_1 OR 
        auth.uid() = profile_id_2
    );
