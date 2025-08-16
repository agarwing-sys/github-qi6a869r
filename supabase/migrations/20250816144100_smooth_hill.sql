/*
  # Système de Notifications

  1. Nouvelles Tables
    - `notifications` - Notifications pour les utilisateurs
    - `notification_preferences` - Préférences de notification par utilisateur

  2. Fonctionnalités
    - Notifications in-app
    - Support email/SMS
    - Préférences utilisateur
    - Historique des notifications

  3. Sécurité
    - RLS activé
    - Politiques par utilisateur
*/

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('campaign_available', 'campaign_accepted', 'proof_reminder', 'payment_confirmed', 'referral_bonus', 'campaign_validated', 'proof_validated', 'account_suspended')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb, -- Données additionnelles (campaign_id, amount, etc.)
  is_read boolean DEFAULT false,
  sent_via_email boolean DEFAULT false,
  sent_via_sms boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Préférences de notification
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT true,
  campaign_notifications boolean DEFAULT true,
  payment_notifications boolean DEFAULT true,
  reminder_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "notifications_admin_all"
  ON notifications FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Politiques RLS pour notification_preferences
CREATE POLICY "notification_preferences_manage_own"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Fonction pour créer les préférences par défaut
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notification_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les préférences automatiquement
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Fonction pour envoyer une notification
CREATE OR REPLACE FUNCTION send_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_data jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;