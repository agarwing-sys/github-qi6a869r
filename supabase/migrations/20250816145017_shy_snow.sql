/*
  # Ajout des informations d'entreprise et système de preuve

  1. Modifications
    - Ajouter colonne company_info (JSONB) à la table profiles
    - Ajouter colonne proof_uploaded à campaign_applications
    - Ajouter fonction pour mettre à jour les portefeuilles

  2. Fonctionnalités
    - Support des informations d'entreprise pour les annonceurs
    - Suivi des preuves uploadées
    - Gestion automatique des portefeuilles

  3. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Ajouter la colonne company_info pour les informations d'entreprise
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_info'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_info jsonb;
  END IF;
END $$;

-- Ajouter la colonne proof_uploaded pour suivre l'état des preuves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_applications' AND column_name = 'proof_uploaded'
  ) THEN
    ALTER TABLE campaign_applications ADD COLUMN proof_uploaded boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter la colonne rejection_reason pour les campagnes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Fonction pour mettre à jour le solde d'un portefeuille
CREATE OR REPLACE FUNCTION update_wallet_balance(
  user_id uuid,
  amount numeric,
  operation text -- 'add' ou 'subtract'
)
RETURNS void AS $$
DECLARE
  wallet_id uuid;
BEGIN
  -- Trouver le portefeuille de l'utilisateur
  SELECT w.id INTO wallet_id
  FROM wallets w
  JOIN profiles p ON w.user_id = p.id
  WHERE p.id = user_id;

  IF wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', user_id;
  END IF;

  -- Mettre à jour le solde
  IF operation = 'add' THEN
    UPDATE wallets 
    SET 
      balance = balance + amount,
      total_earned = total_earned + amount,
      updated_at = now()
    WHERE id = wallet_id;
  ELSIF operation = 'subtract' THEN
    UPDATE wallets 
    SET 
      balance = balance - amount,
      total_spent = total_spent + amount,
      updated_at = now()
    WHERE id = wallet_id;
  ELSE
    RAISE EXCEPTION 'Invalid operation: %', operation;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour envoyer des notifications automatiques
CREATE OR REPLACE FUNCTION send_automatic_notifications()
RETURNS void AS $$
DECLARE
  app_record record;
BEGIN
  -- Rappels pour les preuves non uploadées (23h30 après acceptation)
  FOR app_record IN
    SELECT ca.*, p.full_name, c.title
    FROM campaign_applications ca
    JOIN profiles p ON ca.broadcaster_id = p.id
    JOIN campaigns c ON ca.campaign_id = c.id
    WHERE ca.status = 'accepted'
    AND ca.proof_uploaded = false
    AND ca.accepted_at < (now() - interval '23 hours 30 minutes')
    AND ca.accepted_at > (now() - interval '24 hours')
  LOOP
    PERFORM send_notification(
      app_record.broadcaster_id,
      'proof_reminder',
      'Rappel: Preuve de publication requise',
      'Il vous reste 30 minutes pour uploader la preuve de publication pour la campagne "' || app_record.title || '"',
      jsonb_build_object('campaign_id', app_record.campaign_id, 'application_id', app_record.id)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un bucket pour les médias de campagne s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload de fichiers
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-media');

-- Politique pour permettre la lecture publique
CREATE POLICY IF NOT EXISTS "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-media');