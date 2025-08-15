# Supabase Database Setup Instructions

## Step 1: Run the Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xnpijoqvowpjfkmvfuli

2. Click on "SQL Editor" in the left sidebar

3. Copy the entire contents of the file `supabase/migrations/20250815115441_bright_temple.sql` and paste it into the SQL editor

4. Click "Run" to execute the migration

## Step 2: Configure Phone Authentication

1. In your Supabase dashboard, go to "Authentication" → "Settings"

2. Scroll down to "Phone Auth" section

3. Enable "Enable phone sign-up"

4. Configure an SMS provider:
   - **Recommended**: Twilio
   - You'll need to sign up for Twilio and get your Account SID and Auth Token
   - Add your Twilio credentials in the Phone Auth settings

5. For testing, you can also enable "Enable phone confirmations" and add test phone numbers

## Step 3: Update Environment Variables

1. In your Supabase dashboard, go to "Settings" → "API"

2. Copy your:
   - Project URL
   - `anon` `public` key

3. Update your `.env` file with these values

## Step 4: Restart Development Server

After completing the above steps, restart your development server:

```bash
npm run dev
```

## Verification

Once completed, you should be able to:
- Access the login page without errors
- Send OTP codes to phone numbers
- Create user profiles
- Use all platform features

## Troubleshooting

If you still get errors:
1. Check that all tables were created in the Supabase Table Editor
2. Verify RLS policies are enabled
3. Ensure phone authentication is properly configured
4. Check browser console for any remaining errors