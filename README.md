# Whatspay - Plateforme de Publicité WhatsApp Status

Une plateforme complète qui connecte les annonceurs avec les diffuseurs pour la distribution de publicités via les Status WhatsApp.

## 🚀 Fonctionnalités

### Pour les Annonceurs (Entreprises)
- ✅ Inscription avec informations d'entreprise
- ✅ Création et gestion de campagnes publicitaires
- ✅ Ciblage précis (âge, genre, ville, intérêts)
- ✅ Upload de médias (images/vidéos)
- ✅ Suivi des performances en temps réel
- ✅ Système de paiement intégré
- ✅ Analytics détaillés

### Pour les Diffuseurs (Particuliers)
- ✅ Inscription simplifiée avec profil personnel
- ✅ Navigation des campagnes disponibles
- ✅ Correspondance automatique selon le profil
- ✅ Instructions de publication claires
- ✅ Upload obligatoire de preuves de publication
- ✅ Système de gains et retraits
- ✅ Historique des campagnes et gains
- ✅ Notifications automatiques

### Fonctionnalités Communes
- ✅ Authentification par téléphone avec OTP
- ✅ Système de parrainage avec codes uniques
- ✅ Portefeuille intégré avec historique des transactions
- ✅ Interface responsive mobile-first
- ✅ Support multilingue (français par défaut)
- ✅ Notifications automatiques (email/SMS)

### Administration (Backoffice)
- ✅ Validation des campagnes avant diffusion
- ✅ Modération des preuves de publication
- ✅ Gestion des utilisateurs (bloquer/suspendre/supprimer)
- ✅ Surveillance des flux financiers
- ✅ Analytics de la plateforme
- ✅ Gestion des paiements et commissions
- ✅ Paramètres de la plateforme

## 🛠️ Stack Technique

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Authentification**: OTP par SMS via Supabase Auth
- **Base de données**: PostgreSQL avec Row Level Security (RLS)
- **Notifications**: Système intégré avec support email/SMS
- **Paiements**: Intégration prête pour passerelles de paiement mobile

## 📋 Prérequis

- Node.js 18+ 
- Compte Supabase
- Numéro de téléphone valide pour les tests OTP

## 🔧 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd whatspay
npm install
```

2. **Configuration Supabase**
- Créer un nouveau projet sur [Supabase](https://supabase.com)
- Copier l'URL et la clé anonyme du projet
- Configurer les variables d'environnement

3. **Variables d'environnement**
```bash
cp .env.example .env
```

Remplir avec vos clés Supabase :
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Initialiser la base de données**
- Aller dans l'éditeur SQL de Supabase
- Exécuter les migrations dans l'ordre :
  1. `supabase/migrations/20250815115441_bright_temple.sql`
  2. `supabase/migrations/20250815162809_empty_rice.sql`
  3. `supabase/migrations/20250816113858_young_summit.sql`

5. **Configuration de l'authentification Supabase**
- Dans les paramètres d'authentification Supabase :
  - Activer l'authentification par téléphone
  - Configurer un fournisseur SMS (Twilio recommandé)
  - Désactiver la confirmation d'email
  - Ajouter vos domaines autorisés

6. **Lancer l'application**
```bash
npm run dev
```

## 👨‍💼 Accès Administration

### Créer un compte administrateur

1. **Méthode 1: Via l'interface (Recommandée)**
   - Inscrivez-vous normalement via l'application
   - Connectez-vous à votre base de données Supabase
   - Exécutez cette requête SQL en remplaçant `PHONE_NUMBER` par votre numéro :
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE phone_number = '+33612345678';
   ```

2. **Méthode 2: Création directe en base**
   ```sql
   -- Remplacez les valeurs par vos informations
   INSERT INTO auth.users (id, phone, phone_confirmed_at, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     '+33612345678',
     now(),
     now(),
     now()
   );
   
   -- Puis créer le profil admin
   INSERT INTO profiles (user_id, phone_number, full_name, role)
   VALUES (
     (SELECT id FROM auth.users WHERE phone = '+33612345678'),
     '+33612345678',
     'Administrateur',
     'admin'
   );
   ```

### Accéder au panel admin

1. Connectez-vous avec votre compte administrateur
2. Vous serez automatiquement redirigé vers le dashboard admin
3. URL directe : `https://votre-domaine.com/dashboard` (avec un compte admin)

### Fonctionnalités admin disponibles

- **Analytics** : Vue d'ensemble de la plateforme
- **Utilisateurs** : Gestion des comptes (bloquer/débloquer/supprimer)
- **Campagnes** : Validation et modération des campagnes
- **Preuves** : Validation des preuves de publication
- **Paiements** : Gestion des transactions et commissions
- **Paramètres** : Configuration de la plateforme

## 🗃️ Structure de la Base de Données

### Tables Principales
- `profiles` - Profils utilisateurs avec rôles et informations
- `campaigns` - Campagnes publicitaires
- `campaign_applications` - Candidatures des diffuseurs
- `proofs` - Preuves de publication uploadées
- `wallets` - Portefeuilles des utilisateurs
- `transactions` - Historique des transactions
- `referrals` - Système de parrainage
- `platform_settings` - Configuration de la plateforme
- `notifications` - Système de notifications

### Sécurité
- Row Level Security (RLS) activé sur toutes les tables
- Politiques spécifiques par rôle (advertiser/broadcaster/admin)
- Authentification requise pour toutes les opérations
- Validation des données côté serveur

## 👥 Rôles Utilisateurs

### Annonceur (Advertiser) - Entreprises
- Inscription avec informations d'entreprise complètes
- Créer et gérer des campagnes
- Alimenter son portefeuille
- Voir les analytics de ses campagnes
- Gérer son système de parrainage

### Diffuseur (Broadcaster) - Particuliers
- Inscription simplifiée avec profil personnel
- Voir les campagnes disponibles correspondant à son profil
- Candidater aux campagnes
- Recevoir des instructions de publication
- Uploader des preuves de publication obligatoires
- Retirer ses gains
- Historique complet des gains

### Administrateur (Admin)
- Accès complet à toutes les fonctionnalités
- Validation des campagnes avant diffusion
- Modération des preuves de publication
- Gestion des utilisateurs (bloquer/suspendre/supprimer)
- Surveillance des flux financiers
- Configuration de la plateforme

## 🎯 Workflow Complet de Campagne

1. **Création** - L'annonceur (entreprise) crée une campagne avec ciblage
2. **Validation Admin** - L'admin approuve la campagne avant diffusion
3. **Correspondance** - Le système trouve des diffuseurs éligibles
4. **Notification** - Les diffuseurs reçoivent une notification de nouvelle campagne
5. **Candidature** - Les diffuseurs candidatent aux campagnes
6. **Acceptation** - L'annonceur accepte les candidatures
7. **Instructions** - Le diffuseur reçoit les instructions de publication
8. **Publication** - Le diffuseur publie selon les guidelines
9. **Preuve** - Upload obligatoire de screenshot dans les 24h
10. **Validation** - L'admin valide la preuve (détection de fraude)
11. **Paiement** - Le paiement est automatiquement traité
12. **Notifications** - Confirmation de paiement envoyée

## 🔔 Système de Notifications

### Types de notifications automatiques
- **Nouvelles campagnes disponibles** (diffuseurs)
- **Rappel de publication** (23h30 après acceptation)
- **Rappel de preuve** (si pas uploadée)
- **Validation de campagne** (annonceurs)
- **Confirmation de paiement** (tous)
- **Bonus de parrainage** (parrains)

### Canaux de notification
- Notifications in-app
- Email (optionnel)
- SMS (optionnel)
- WhatsApp API (futur)

## 💰 Système de Paiement

- Portefeuille intégré pour chaque utilisateur
- Support pour les paiements mobile money
- Calcul automatique des commissions
- Historique complet des transactions
- Système de retrait sécurisé
- Surveillance anti-fraude

## 🎁 Système de Parrainage

- Code unique généré automatiquement pour chaque utilisateur
- Bonus versé quand un filleul complète sa première campagne
- Suivi des parrainages dans le tableau de bord
- Système de récompenses configurable

## 🔄 Fonctionnalités Avancées

### Correspondance Automatique
- Algorithme de matching basé sur les critères de ciblage
- Prise en compte du profil complet du diffuseur
- Optimisation pour maximiser la pertinence

### Analytics
- Métriques détaillées par campagne
- Suivi des performances en temps réel
- Rapports exportables
- Analytics de la plateforme pour les admins

### Détection de Fraude
- Validation automatique des preuves
- Détection d'images dupliquées
- Analyse des patterns suspects
- Système de signalement

## 🛡️ Sécurité et Conformité

- Chiffrement des données sensibles
- Conformité RGPD
- Audit trail complet
- Validation stricte des uploads
- Protection contre la fraude
- Modération humaine + automatique

## 🚀 Déploiement

### Environnement de Production
1. Configurer Supabase en mode production
2. Activer les backups automatiques
3. Configurer les domaines personnalisés
4. Optimiser les index de base de données
5. Mettre en place la surveillance
6. Configurer les notifications (SMTP, SMS)

### Variables d'Environnement Production
```env
NODE_ENV=production
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## 📱 Tests

### Comptes de Test

1. **Annonceur Test (Entreprise)**
   - S'inscrire avec un numéro valide
   - Choisir le rôle "Annonceur"
   - Remplir les informations d'entreprise
   - Créer une campagne test

2. **Diffuseur Test (Particulier)**
   - S'inscrire avec un autre numéro
   - Choisir le rôle "Diffuseur"
   - Remplir le profil personnel
   - Candidater à la campagne

3. **Admin Test**
   - Créer un profil admin (voir section Administration)
   - Tester la validation des campagnes et preuves
   - Gérer les utilisateurs et paramètres

## 🔧 Configuration Avancée

### Paramètres de la Plateforme
Modifiables via l'interface admin :
- Taux de commission
- Montant minimum de retrait  
- Coût par vue par défaut
- Bonus de parrainage
- Limites de campagnes
- Délais de publication
- Seuils de détection de fraude

### Intégration Paiements
Prêt pour l'intégration avec :
- Mobile Money (Orange Money, MTN Money, etc.)
- Cartes bancaires (Stripe, PayPal)
- Virements bancaires

### Notifications
Configuration des canaux :
- SMTP pour les emails
- API SMS (Twilio, etc.)
- WhatsApp Business API (futur)

## 📞 Support

Pour toute question :
- Consulter la documentation
- Vérifier les logs Supabase
- Tester avec des données de développement
- Contacter l'équipe technique

## 🔄 Mises à Jour

La plateforme est conçue pour être facilement extensible :
- Architecture modulaire
- API REST complète
- Base de données normalisée
- Code TypeScript typé
- Système de notifications extensible

## 🎯 Roadmap

### Fonctionnalités Futures
- [ ] IA pour l'estimation des vues
- [ ] Géolocalisation avancée
- [ ] API publique
- [ ] Application mobile native
- [ ] Système d'avis et notation
- [ ] Intégration Instagram/TikTok
- [ ] Campagnes vidéo avancées
- [ ] Statistiques prédictives
- [ ] WhatsApp Business API
- [ ] Détection automatique de fraude par IA