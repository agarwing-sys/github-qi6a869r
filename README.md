# Whatspay - Plateforme de Publicité WhatsApp Status

Une plateforme complète qui connecte les annonceurs avec les diffuseurs pour la distribution de publicités via les Status WhatsApp.

## 🚀 Fonctionnalités

### Pour les Annonceurs
- ✅ Création et gestion de campagnes publicitaires
- ✅ Ciblage précis (âge, genre, ville, intérêts)
- ✅ Upload de médias (images/vidéos)
- ✅ Suivi des performances en temps réel
- ✅ Système de paiement intégré
- ✅ Analytics détaillés

### Pour les Diffuseurs
- ✅ Navigation des campagnes disponibles
- ✅ Correspondance automatique selon le profil
- ✅ Upload de preuves de publication
- ✅ Système de gains et retraits
- ✅ Tableau de bord des performances

### Fonctionnalités Communes
- ✅ Authentification par téléphone avec OTP
- ✅ Système de parrainage avec codes uniques
- ✅ Portefeuille intégré avec historique des transactions
- ✅ Interface responsive mobile-first
- ✅ Support multilingue (français par défaut)

### Administration
- ✅ Gestion des utilisateurs
- ✅ Validation des campagnes
- ✅ Validation des preuves de publication
- ✅ Analytics de la plateforme
- ✅ Gestion des paiements
- ✅ Paramètres de la plateforme

## 🛠️ Stack Technique

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Authentification**: OTP par SMS via Supabase Auth
- **Base de données**: PostgreSQL avec Row Level Security (RLS)
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
- Exécuter le script SQL dans `supabase/migrations/create_whatspay_schema.sql` dans l'éditeur SQL de Supabase
- Cela créera toutes les tables, politiques RLS, et données initiales

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

### Sécurité
- Row Level Security (RLS) activé sur toutes les tables
- Politiques spécifiques par rôle (advertiser/broadcaster/admin)
- Authentification requise pour toutes les opérations
- Validation des données côté serveur

## 👥 Rôles Utilisateurs

### Annonceur (Advertiser)
- Créer et gérer des campagnes
- Alimenter son portefeuille
- Voir les analytics de ses campagnes
- Gérer son système de parrainage

### Diffuseur (Broadcaster)
- Voir les campagnes disponibles correspondant à son profil
- Candidater aux campagnes
- Uploader des preuves de publication
- Retirer ses gains

### Administrateur (Admin)
- Accès complet à toutes les fonctionnalités
- Validation des campagnes et preuves
- Gestion des utilisateurs
- Configuration de la plateforme

## 🎯 Workflow de Campagne

1. **Création** - L'annonceur crée une campagne avec ciblage
2. **Validation** - L'admin approuve la campagne
3. **Correspondance** - Le système trouve des diffuseurs éligibles
4. **Candidature** - Les diffuseurs candidatent aux campagnes
5. **Acceptation** - L'annonceur accepte les candidatures
6. **Publication** - Le diffuseur publie et upload la preuve
7. **Validation** - L'admin valide la preuve
8. **Paiement** - Le paiement est automatiquement traité

## 💰 Système de Paiement

- Portefeuille intégré pour chaque utilisateur
- Support pour les paiements mobile money
- Calcul automatique des commissions
- Historique complet des transactions
- Système de retrait sécurisé

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

### Système de Notifications
- Notifications en temps réel pour les actions importantes
- Alertes email/SMS configurables
- Historique des notifications

## 🛡️ Sécurité et Conformité

- Chiffrement des données sensibles
- Conformité RGPD
- Audit trail complet
- Validation stricte des uploads
- Protection contre la fraude

## 🚀 Déploiement

### Environnement de Production
1. Configurer Supabase en mode production
2. Activer les backups automatiques
3. Configurer les domaines personnalisés
4. Optimiser les index de base de données
5. Mettre en place la surveillance

### Variables d'Environnement Production
```env
NODE_ENV=production
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## 📱 Tests

### Compte de Test
Pour tester la plateforme :

1. **Annonceur Test**
   - S'inscrire avec un numéro valide
   - Choisir le rôle "Annonceur"
   - Créer une campagne test

2. **Diffuseur Test**
   - S'inscrire avec un autre numéro
   - Choisir le rôle "Diffuseur"
   - Candidater à la campagne

3. **Admin Test**
   - Créer un profil admin directement en base
   - Tester la validation des campagnes et preuves

## 🔧 Configuration Avancée

### Paramètres de la Plateforme
Modifiables via l'interface admin :
- Taux de commission
- Montant minimum de retrait  
- Coût par vue par défaut
- Bonus de parrainage
- Limites de campagnes

### Intégration Paiements
Prêt pour l'intégration avec :
- Mobile Money (Orange Money, MTN Money, etc.)
- Cartes bancaires (Stripe, PayPal)
- Virements bancaires

## 📞 Support

Pour toute question :
- Consulter la documentation
- Vérifier les logs Supabase
- Tester avec des données de développement

## 🔄 Mises à Jour

La plateforme est conçue pour être facilement extensible :
- Architecture modulaire
- API REST complète
- Base de données normalisée
- Code TypeScript typé

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