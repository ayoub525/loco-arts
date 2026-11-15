# 👞 LOCO Arts — Creative Studio E-Commerce

Boutique e-commerce complète, professionnelle et sur mesure pour **LOCO Arts** (Tunis, Tunisie).
Spécialisée dans la vente de chaussures faites à la main : *Custom Arts · Renovation · Repair · Making*.

---

## 🛠️ Stack Technique

- **Frontend** : React 18 (Vite) + Tailwind CSS + React Router v6 + TanStack React Query + Axios + i18next
- **Backend** : Node.js + Express (Architecture REST sécurisée)
- **Base de données** : PostgreSQL avec Prisma ORM (migrations, relations, transactions & seed)
- **Authentification** : JWT dans des cookies sécurisés `httpOnly` + hashage Bcrypt (Rôles: `CUSTOMER`, `ADMIN`)
- **Upload de photos** : Multer (stockage local `/uploads/products`, prêt à basculer vers Cloudinary)
- **Design & UX** : Minimaliste Noir & Blanc (#000 & #fff), typographie *Space Grotesk* + *Inter*, badges de statut discrets, mobile-first, 24 gouvernorats tunisiens intégrés.

---

## 📁 Structure du Monorepo

```
loco projet/
├── client/                     # Application Frontend React (Vite)
│   ├── src/
│   │   ├── assets/             # Logo officiel LOCO Arts
│   │   ├── components/         # Navbar, Footer, AdminLayout, ProductCard, UI
│   │   ├── context/            # AuthContext, CartContext (localStorage)
│   │   ├── lib/                # Axios instance, i18n
│   │   ├── locales/            # Traductions fr.json (prêt pour ar.json RTL)
│   │   ├── pages/              # Boutique : Accueil, Shop, Produit, Panier, Caisse, Suivi...
│   │   │   └── admin/          # Espace Admin : Dashboard, Produits, Commandes, etc.
│   │   ├── App.jsx             # Configuration des routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # API REST Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma PostgreSQL (User, Product, Variant, Order...)
│   │   └── seed.js             # Données initiales (Admin, Catégories, 6 Produits)
│   ├── src/
│   │   ├── routes/             # Routes publiques et /api/admin/*
│   │   ├── middleware/         # Auth, AdminGuard, Upload, ErrorHandler, Validation
│   │   ├── utils/              # PDF Generator (Bon de commande), Export CSV
│   │   └── app.js              # Point d'entrée Express
│   ├── uploads/                # Répertoire de stockage des photos
│   ├── .env.example
│   └── package.json
│
├── README.md                   # Ce guide d'installation et déploiement
└── admin-guide.md              # Guide d'utilisation simplifié pour l'administrateur
```

---

## 🚀 Installation & Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [PostgreSQL](https://www.postgresql.org/) installé et démarré sur votre machine

---

### 1. Configuration du Serveur (Backend)

1. Ouvrez un terminal dans le dossier `server` :
   ```bash
   cd server
   npm install
   ```

2. Créez votre fichier `.env` à partir de `.env.example` :
   ```bash
   cp .env.example .env
   ```
   Renseignez votre URL PostgreSQL dans `DATABASE_URL` :
   ```env
   DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/loco_arts"
   JWT_SECRET="votre_cle_secrete_jwt_super_longue"
   JWT_REFRESH_SECRET="votre_cle_secrete_refresh"
   PORT=5000
   CLIENT_URL="http://localhost:5173"
   NODE_ENV="development"
   UPLOAD_DIR="uploads"
   ```

3. Exécutez la migration Prisma et générez le client :
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. Remplissez la base avec les données de démonstration (Catégories, Produits avec pointures et stocks, Réglages de la boutique, Compte Admin) :
   ```bash
   npm run db:seed
   ```

5. Démarrez le serveur backend en mode développement :
   ```bash
   npm run dev
   ```
   Le serveur démarre sur **http://localhost:5000**.

---

### 2. Configuration du Client (Frontend)

1. Ouvrez un second terminal dans le dossier `client` :
   ```bash
   cd client
   npm install
   ```

2. Démarrez le serveur Vite :
   ```bash
   npm run dev
   ```
   L'application est accessible sur **http://localhost:5173**.

---

## 🔐 Identifiants par défaut

| Rôle | Email | Mot de passe |
|---|---|---|
| **Administrateur** | `admin@LocoArts.tn` | `LocoArts2024!` |
| **Client Test** | `client@test.tn` | `Test1234!` |

*(Le mot de passe de l'administrateur peut être modifié directement ou réinitialisé via la base de données).*

---

## 🖼️ Remplacement des Photos et Logo

1. **Logo** : Le logo officiel de LOCO Arts est déjà placé dans `client/src/assets/logo.png`. Pour le modifier, remplacez simplement ce fichier.
2. **Photos de produits** : Depuis l'espace d'administration (`/admin/produits`), ajoutez ou modifiez un produit et uploadez directement vos photos par glisser-déposer. Les fichiers sont stockés dans `server/uploads/products/`.

---

## 📦 Fonctionnalités Clés

- **Paiement à la livraison (Cash on Delivery)** avec architecture prête pour passerelle en ligne (Paymee / Konnect / Flouci).
- **24 Gouvernorats Tunisiens** intégrés en liste déroulante lors de la commande.
- **Gestion stricte des stocks** :
  - Décrémentation automatique du stock lors de la confirmation d'une commande.
  - Réapprovisionnement automatique lors d'une annulation ou d'un retour.
  - Transactions Prisma pour empêcher le surbooking (overselling).
- **Suivi Colis & Transporteur** (Aramex, First Delivery, Rapid Poste...) avec numéro de suivi consultable en temps réel par le client sur `/suivre-commande`.
- **Génération automatique de Bons de commande PDF** et export des commandes au format CSV/Excel.
- **Statuts clairs** : En attente → Confirmée → En préparation → Expédiée → Livrée / Annulée / Retournée.

---

## 🌐 Déploiement en Production

1. **Base de données** : Utilisez une instance PostgreSQL gérée (Supabase, Neon, Render, Railway ou AWS RDS).
2. **Serveur Backend** : Déployez le dossier `server/` sur Render, Railway, DigitalOcean ou VPS.
   - Configurez les variables d'environnement (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL`).
   - Lancez `npx prisma migrate deploy` lors du build.
3. **Frontend Client** :
   - Lancez `npm run build` dans `client/`.
   - Déployez le dossier `client/dist` sur Vercel, Netlify, Cloudflare Pages ou servez-le via NGINX.
