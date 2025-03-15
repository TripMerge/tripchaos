-- Schema for TripChaos Leaderboard
-- Run this in the Supabase SQL Editor

-- Create the leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  player_name TEXT,
  score INTEGER NOT NULL,
  levels_completed INTEGER NOT NULL,
  satisfaction INTEGER NOT NULL,
  budget INTEGER NOT NULL,
  achievement TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraints for data validation
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_score CHECK (score >= 0),
  CONSTRAINT valid_levels CHECK (levels_completed >= 0 AND levels_completed <= 3)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create security policies
-- Allow anonymous inserts (for submitting scores)
CREATE POLICY "Allow anonymous inserts" ON leaderboard
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public reads of leaderboard
CREATE POLICY "Allow public reads" ON leaderboard
  FOR SELECT TO anon
  USING (true);

-- Prevent public updates or deletes
CREATE POLICY "Prevent public updates" ON leaderboard
  FOR UPDATE TO anon
  USING (false);

CREATE POLICY "Prevent public deletes" ON leaderboard
  FOR DELETE TO anon
  USING (false);

-- Only service role/admins can modify or delete entries
CREATE POLICY "Admin full access" ON leaderboard
  FOR ALL TO service_role
  USING (true);

-- Create a view for public display with masked emails
CREATE OR REPLACE VIEW public_leaderboard AS
SELECT
  id,
  -- Mask the email, showing only first 2 chars + domain
  CASE 
    WHEN POSITION('@' IN email) > 3 THEN 
      SUBSTRING(email, 1, 2) || '****' || SUBSTRING(email FROM POSITION('@' IN email))
    ELSE email
  END AS masked_email,
  score,
  levels_completed,
  satisfaction,
  budget,
  achievement,
  created_at
FROM leaderboard
ORDER BY score DESC;

-- Grant access to the public view
GRANT SELECT ON public_leaderboard TO anon, authenticated;

-- Make sure the service role has full access
GRANT ALL ON leaderboard TO service_role; 