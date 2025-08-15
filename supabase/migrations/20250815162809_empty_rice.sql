/*
  # Fix RLS Policies - Remove Infinite Recursion

  1. Problem
    - Infinite recursion in profiles policies
    - Policies reference profiles table within profiles policies

  2. Solution
    - Use auth.uid() directly instead of subqueries to profiles table
    - Simplify policy conditions to avoid circular references

  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies without recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Advertisers can manage their campaigns" ON campaigns;
DROP POLICY IF EXISTS "System can update wallets" ON wallets;
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "Broadcasters can manage their applications" ON campaign_applications;
DROP POLICY IF EXISTS "Advertisers can view applications to their campaigns" ON campaign_applications;
DROP POLICY IF EXISTS "Broadcasters can manage their proofs" ON proofs;
DROP POLICY IF EXISTS "Admins can validate proofs" ON proofs;
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
DROP POLICY IF EXISTS "Admins can manage platform settings" ON platform_settings;

-- Create new simplified policies for profiles
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create admin policy using a function to avoid recursion
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "profiles_admin_all"
  ON profiles FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Campaigns policies
CREATE POLICY "campaigns_advertiser_manage"
  ON campaigns FOR ALL
  TO authenticated
  USING (
    advertiser_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'advertiser'
    )
  )
  WITH CHECK (
    advertiser_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'advertiser'
    )
  );

CREATE POLICY "campaigns_broadcaster_view"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    status = 'active' AND admin_approved = true AND
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'broadcaster')
  );

CREATE POLICY "campaigns_admin_all"
  ON campaigns FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Wallets policies
CREATE POLICY "wallets_select_own"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "wallets_update_own"
  ON wallets FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "wallets_admin_all"
  ON wallets FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Transactions policies
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_admin_all"
  ON transactions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Campaign applications policies
CREATE POLICY "applications_broadcaster_manage"
  ON campaign_applications FOR ALL
  TO authenticated
  USING (
    broadcaster_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'broadcaster'
    )
  )
  WITH CHECK (
    broadcaster_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'broadcaster'
    )
  );

CREATE POLICY "applications_advertiser_view"
  ON campaign_applications FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN profiles p ON c.advertiser_id = p.id
      WHERE p.user_id = auth.uid() AND p.role = 'advertiser'
    )
  );

CREATE POLICY "applications_advertiser_update"
  ON campaign_applications FOR UPDATE
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN profiles p ON c.advertiser_id = p.id
      WHERE p.user_id = auth.uid() AND p.role = 'advertiser'
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN profiles p ON c.advertiser_id = p.id
      WHERE p.user_id = auth.uid() AND p.role = 'advertiser'
    )
  );

CREATE POLICY "applications_admin_all"
  ON campaign_applications FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Proofs policies
CREATE POLICY "proofs_broadcaster_manage"
  ON proofs FOR ALL
  TO authenticated
  USING (
    broadcaster_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'broadcaster'
    )
  )
  WITH CHECK (
    broadcaster_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'broadcaster'
    )
  );

CREATE POLICY "proofs_advertiser_view"
  ON proofs FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN profiles p ON c.advertiser_id = p.id
      WHERE p.user_id = auth.uid() AND p.role = 'advertiser'
    )
  );

CREATE POLICY "proofs_admin_all"
  ON proofs FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Referrals policies
CREATE POLICY "referrals_select_own"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    referred_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "referrals_insert_system"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true); -- System can create referrals during registration

CREATE POLICY "referrals_admin_all"
  ON referrals FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Platform settings policies
CREATE POLICY "settings_admin_all"
  ON platform_settings FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "settings_read_all"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true); -- Everyone can read settings