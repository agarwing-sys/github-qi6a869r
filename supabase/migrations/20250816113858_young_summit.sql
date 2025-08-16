/*
  # Fix Wallet RLS Policies - Allow System Operations

  1. Problem
    - Trigger cannot create wallets due to RLS policies
    - System operations need special permissions

  2. Solution
    - Add policy to allow wallet creation during profile creation
    - Fix other potential RLS issues for system operations

  3. Changes
    - Add wallet insert policy for system operations
    - Update transaction policies to allow system operations
    - Ensure referral system can work properly
*/

-- Drop existing wallet policies to recreate them properly
DROP POLICY IF EXISTS "wallets_select_own" ON wallets;
DROP POLICY IF EXISTS "wallets_update_own" ON wallets;
DROP POLICY IF EXISTS "wallets_admin_all" ON wallets;

-- Create new wallet policies that allow system operations
CREATE POLICY "wallets_select_own"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "wallets_insert_system"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system to create wallets

CREATE POLICY "wallets_update_own"
  ON wallets FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    is_admin(auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    is_admin(auth.uid())
  );

CREATE POLICY "wallets_admin_all"
  ON wallets FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fix transactions policies to allow system operations
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_admin_all" ON transactions;

CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "transactions_insert_system"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system to create transactions

CREATE POLICY "transactions_update_system"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true) -- Allow system to update transactions
  WITH CHECK (true);

CREATE POLICY "transactions_admin_all"
  ON transactions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fix referrals policies
DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
DROP POLICY IF EXISTS "referrals_insert_system" ON referrals;
DROP POLICY IF EXISTS "referrals_admin_all" ON referrals;

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
  WITH CHECK (true); -- Allow system to create referrals

CREATE POLICY "referrals_update_system"
  ON referrals FOR UPDATE
  TO authenticated
  USING (true) -- Allow system to update referrals
  WITH CHECK (true);

CREATE POLICY "referrals_admin_all"
  ON referrals FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Update the trigger function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_user_wallet_and_referral()
RETURNS trigger AS $$
BEGIN
  -- Générer le code de parrainage si pas défini
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a separate function to create wallet after profile creation
CREATE OR REPLACE FUNCTION create_wallet_after_profile()
RETURNS trigger AS $$
BEGIN
  -- Créer le portefeuille après la création du profil
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger and create new ones
DROP TRIGGER IF EXISTS trigger_create_user_wallet_and_referral ON profiles;

CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet_and_referral();

CREATE TRIGGER trigger_create_wallet_after_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_after_profile();

-- Grant necessary permissions for the functions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;