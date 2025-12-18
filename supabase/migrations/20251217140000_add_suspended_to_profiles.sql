-- Add suspended columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Update RLS policies to allow admins to view/update suspended status
-- (Assuming RLS policies exist, we might need to ensure admins can write these fields)
-- This part depends on existing policies, but adding columns is the first step.
