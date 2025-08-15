/*
  # Schéma Whatspay - Plateforme de publicité WhatsApp Status

  1. Nouvelles Tables
    - `profiles` - Profils utilisateurs avec rôles et informations personnelles
    - `campaigns` - Campagnes publicitaires créées par les annonceurs
    - `campaign_applications` - Applications des diffuseurs aux campagnes
    - `proofs` - Preuves de publication uploadées par les diffuseurs
    - `wallets` - Portefeuilles des utilisateurs
    - `transactions` - Historique des transactions
    - `referrals` - Système de parrainage
    - `platform_settings` - Paramètres de la plateforme

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour chaque rôle (advertiser, broadcaster, admin)
    - Authentification Supabase intégrée

  3. Fonctionnalités
    - Système de correspondance automatique
    - Workflow de validation des preuves
    - Gestion des paiements et retraits
    - Analytics et métriques
*/

-- Profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('advertiser', 'broadcaster', 'admin')),
  profile_picture text,
  region text,
  city text,
  age integer,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  language text DEFAULT 'fr',
  interests text[], -- Array of interests
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  referral_code text UNIQUE,
  referred_by text REFERENCES profiles(referral_code),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campagnes publicitaires
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  budget numeric(10,2) NOT NULL,
  cost_per_view numeric(10,2) NOT NULL DEFAULT 0.50,
  target_views integer NOT NULL,
  current_views integer DEFAULT 0,
  target_gender text,
  target_age_min integer,
  target_age_max integer,
  target_cities text[],
  target_languages text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
  admin_approved boolean DEFAULT false,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications aux campagnes
CREATE TABLE IF NOT EXISTS campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  broadcaster_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  applied_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  UNIQUE(campaign_id, broadcaster_id)
);

-- Preuves de publication
CREATE TABLE IF NOT EXISTS proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES campaign_applications(id) ON DELETE CASCADE,
  broadcaster_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  screenshot_url text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  validated_by uuid REFERENCES profiles(id),
  validated_at timestamptz,
  rejection_reason text,
  estimated_views integer,
  created_at timestamptz DEFAULT now()
);

-- Portefeuilles
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance numeric(10,2) DEFAULT 0.00,
  pending_balance numeric(10,2) DEFAULT 0.00,
  total_earned numeric(10,2) DEFAULT 0.00,
  total_spent numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'earning', 'referral_bonus')),
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description text,
  reference text,
  campaign_id uuid REFERENCES campaigns(id),
  proof_id uuid REFERENCES proofs(id),
  payment_method text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Système de parrainage
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  bonus_amount numeric(10,2) DEFAULT 5.00,
  is_rewarded boolean DEFAULT false,
  first_campaign_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  rewarded_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

-- Paramètres de la plateforme
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performances
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);
CREATE INDEX IF NOT EXISTS idx_proofs_validation_status ON proofs(validation_status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques RLS pour campaigns
CREATE POLICY "Advertisers can manage their campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (
    advertiser_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Broadcasters can view active campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    status = 'active' AND admin_approved = true
  );

CREATE POLICY "Admins can manage all campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques RLS pour wallets
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can update wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (true);

-- Politiques RLS pour transactions
CREATE POLICY "Users can view their transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Politiques RLS pour campaign_applications
CREATE POLICY "Broadcasters can manage their applications"
  ON campaign_applications FOR ALL
  TO authenticated
  USING (
    broadcaster_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Advertisers can view applications to their campaigns"
  ON campaign_applications FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE advertiser_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Politiques RLS pour proofs
CREATE POLICY "Broadcasters can manage their proofs"
  ON proofs FOR ALL
  TO authenticated
  USING (
    broadcaster_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can validate proofs"
  ON proofs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques RLS pour referrals
CREATE POLICY "Users can view their referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) OR referred_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Politiques RLS pour platform_settings
CREATE POLICY "Admins can manage platform settings"
  ON platform_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'WP' || UPPER(substring(md5(random()::text), 1, 6));
    SELECT COUNT(*) > 0 INTO exists FROM profiles WHERE referral_code = code;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement un portefeuille et un code de parrainage
CREATE OR REPLACE FUNCTION create_user_wallet_and_referral()
RETURNS trigger AS $$
BEGIN
  -- Créer le portefeuille
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  
  -- Générer le code de parrainage si pas défini
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_wallet_and_referral
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet_and_referral();

-- Insérer les paramètres par défaut
INSERT INTO platform_settings (key, value, description) VALUES
  ('commission_rate', '0.10', 'Taux de commission de la plateforme (10%)'),
  ('min_withdrawal', '10.00', 'Montant minimum de retrait'),
  ('cost_per_view', '0.50', 'Coût par vue par défaut'),
  ('referral_bonus', '5.00', 'Bonus de parrainage'),
  ('max_campaigns_per_broadcaster', '5', 'Nombre maximum de campagnes simultanées par diffuseur')
ON CONFLICT (key) DO NOTHING;