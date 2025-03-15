# TripChaos - Leaderboard Setup Guide

This guide will walk you through setting up the Supabase backend for the TripChaos game leaderboard.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Your TripChaos game files

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account.
2. Create a new project with a name of your choice (e.g., "tripchaos").
3. Choose a strong database password and store it securely.
4. Select a region closest to your target audience.
5. Wait for your project to be created (this may take a few minutes).

## Step 2: Set Up the Database Schema

1. In your Supabase project dashboard, go to the "SQL Editor" section.
2. Create a new query and paste the contents of the `leaderboard_schema.sql` file.
3. Run the query to create the leaderboard table, indexes, and security policies.

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to the "Settings" section (gear icon).
2. Click on "API" in the sidebar.
3. You'll need two values:
   - **URL**: Your project URL (e.g., `https://abcdefghijklm.supabase.co`)
   - **anon/public key**: The API key for anonymous access

## Step 4: Update Your Game Configuration

1. Open the `index.html` file in your game directory.
2. Find the following lines:

```javascript
// Initialize Supabase client
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Replace `'YOUR_SUPABASE_URL'` with your project URL from Step 3.
4. Replace `'YOUR_SUPABASE_ANON_KEY'` with your anon/public key from Step 3.

## Step 5: Testing the Leaderboard

1. Launch your game and play until you reach the game over or win screen.
2. Enter your email address and click "Submit Score & See Leaderboard".
3. Your score should be submitted, and the leaderboard should display.

## Optional: Viewing and Managing Leaderboard Data

1. In your Supabase project dashboard, go to the "Table Editor" section.
2. Select the "leaderboard" table to view all submitted scores.
3. You can filter, sort, and export this data as needed.

## Troubleshooting

If you encounter issues with the leaderboard:

1. **Submission Errors**: Check the browser console for error messages. Common issues include:
   - Incorrect API URL or key
   - Network connectivity problems
   - Database constraints being violated

2. **Empty Leaderboard**: If the leaderboard appears empty:
   - Verify that scores have been successfully submitted
   - Check the Supabase table to confirm data exists
   - Ensure the database policies allow reading data

3. **Security Errors**: If you receive CORS or security-related errors:
   - Verify that your Supabase project has the correct security policies
   - Check that you're using the anon/public key, not the service key

## Security Notes

- The leaderboard implementation includes email masking for privacy
- Database constraints prevent invalid data
- Row-Level Security (RLS) policies control data access
- Player emails are validated before submission

## Support

If you need further assistance, please contact the developer or refer to the [Supabase documentation](https://supabase.com/docs). 