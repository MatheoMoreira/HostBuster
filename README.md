# HostBuster

Portail web (PaaS) permettant aux clients de **déployer et gérer en quelques minutes**
des instances applicatives — **WordPress, Minecraft Java Edition, Odoo, GLPI** — avec
achat, gestion des ressources (CPU, RAM, stockage), suppression automatique programmée,
notifications par e-mail et supervision.

Ce dépôt contient la partie **applicative** du projet : l'**API** (backend) et le
**front** (interface web). L'infrastructure système/réseau (Docker, reverse proxy,
supervision, PCA/PRA) est gérée séparément.

---

## Contexte

Projet tuteuré annuel du **Bachelor Coordinateur de Projets Informatiques (Bac+3 CPI)**,
réalisé pour le commanditaire **HostBuster** (Mme GOUNY, directrice générale).

L'objectif métier : enrichir le catalogue de HostBuster avec une offre PaaS clé en main,
permettant à des PME/TPE et des particuliers non-techniciens de déployer leurs
applications via une interface simple, sécurisée et responsive.

**Équipe projet — CPI-Corporation**

| Membre            | Rôle                                   |
|-------------------|----------------------------------------|
| Baptiste Giron    | Chef de projet & Administrateur système |
| Mathéo Moreira    | Développeur (API + front)              |
| Colin Pessin      | Administrateur système                  |
| Matteo Avarello   | Administrateur système                  |

---

## Stack technique

| Dossier  | Rôle             | Stack                                                        |
|----------|------------------|-------------------------------------------------------------|
| `api/`   | Backend / API    | Laravel 13 · PHP 8.4 · Sanctum · MySQL                      |
| `front/` | Frontend (SPA)   | React 19 · Vite · Tailwind CSS · React Router · Stripe      |

---

## 1. Prérequis

- **PHP** 8.4 (minimum 8.3 — extensions Laravel : `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`)
- **Composer**
- **Node.js** ≥ 18 et **npm**
- **MySQL** ≥ 8 (ou MariaDB)
- **Git**

---

## 2. Récupérer le projet

```bash
git clone https://github.com/MatheoMoreira/HostBuster.git
cd HostBuster
```

---

## 3. Base de données

Le schéma complet (tables `users`, `applications`, `instances`, `orders`,
`notifications` et données de base) se trouve dans [`schema.sql`](schema.sql).

Importe-le dans MySQL :

```bash
mysql -u root -p < schema.sql
```

Cela crée la base `hostbuster` et insère les applications par défaut
(WordPress, Minecraft, Odoo, GLPI).

---

## 4. Backend (`api/`)

```bash
cd api

# 1. Dépendances PHP
composer install

# 2. Fichier d'environnement
cp .env.example .env

# 3. Clé d'application
php artisan key:generate
```

### Configurer la connexion MySQL

Édite `api/.env` pour pointer vers la base `hostbuster` (le `.env.example` est en
SQLite par défaut, il faut le passer en MySQL) :

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hostbuster
DB_USERNAME=root
DB_PASSWORD=ton_mot_de_passe
```

> Les tables sont déjà créées via `schema.sql`. Si tu préfères utiliser les migrations
> Laravel, lance `php artisan migrate`.

---

## 5. Frontend (`front/`)

```bash
cd front
npm install
```

> **Stripe :** la clé publique (publishable) est actuellement codée en dur dans
> [`front/src/pages/Payment.jsx`](front/src/pages/Payment.jsx) (clé de **test**
> `pk_test_…`). Pour utiliser un autre compte Stripe, remplace cette valeur.

---

## 6. Lancer le projet en développement

Ouvre **deux terminaux** :

**Terminal 1 — API :**
```bash
cd api
php artisan serve
```
→ http://localhost:8000

**Terminal 2 — Front :**
```bash
cd front
npm run dev
```
→ http://localhost:5173

---

## 7. Build de production (front)

```bash
cd front
npm run build      # génère dist/
npm run preview    # prévisualise le build localement
```

---

## 8. Tests & qualité

```bash
# Backend (PHPUnit)
cd api
php artisan test

# Frontend (lint)
cd front
npm run lint
```

---

## 9. Structure du projet

```
HostBuster/
├── api/                 # Backend Laravel
│   ├── app/             #   Models, Controllers
│   ├── routes/api.php   #   Routes de l'API
│   ├── database/        #   Migrations
│   └── ...
├── front/               # Frontend React
│   └── src/
│       ├── pages/       #   Home, Dashboard, Setup, Payment, InstanceDetails
│       ├── components/  #   Composants réutilisables
│       └── data/        #   Constantes (plans, types d'apps)
├── schema.sql           # Schéma MySQL complet + données initiales
└── README.md
```

---

## 10. Fonctionnalités principales

- Catalogue d'applications déployables (WordPress, Minecraft, Odoo, GLPI)
- Achat et visualisation des instances
- Gestion des ressources (CPU, RAM, stockage) et suppression automatique programmée
- Système de crédits utilisateur (budget de 1000 crédits / mois)
- Notifications par e-mail (création, suppression, échec de déploiement)
- Tableau de bord centralisé, interface responsive

---

## 11. Routes API principales

| Méthode | Endpoint     | Description                          | Auth     |
|---------|--------------|--------------------------------------|----------|
| `GET`   | `/api/apps`  | Liste des applications disponibles   | —        |
| `GET`   | `/api/user`  | Utilisateur authentifié              | Sanctum  |
