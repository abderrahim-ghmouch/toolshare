
  <img src="assets/Logo.png" alt="ToolShare" width="480">


<p align="center">
  <b>Réservez l'outillage de votre entreprise en quelques secondes, sans fichiers éparpillés ni double réservation.</b>
</p> 


<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
  <img alt="JWT" src="https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white">
</p>

---

## 👋 C'est quoi, ToolShare ?

Dans une entreprise industrielle de Safi, les magasins d'outillage prêtent des perceuses, des meuleuses, des appareils de mesure et du matériel spécialisé. Aujourd'hui, les demandes se font à l'oral ou dans des fichiers séparés : personne ne sait ce qui est disponible, les réservations se chevauchent et les retards sont difficiles à suivre.

**ToolShare** est une API qui centralise tout ça. Un utilisateur choisit un magasin, un matériel, une date, une heure de début et une durée. L'application vérifie la disponibilité, puis confirme la réservation. Les gestionnaires suivent les sorties, les retours et les retards.

> Ce projet est un **backend uniquement** (API REST). Il n'y a pas d'interface web.

## 👥 Qui fait quoi ?

| Rôle | Ce qu'il peut faire |
|---|---|
| 🛡️ **Administrateur** | Gère les magasins et tous les comptes, affecte chaque gestionnaire à un magasin, consulte tout |
| 🧰 **Gestionnaire** | Gère les matériels de **son** magasin, remet et reprend le matériel, suit les retards, crée des comptes utilisateurs |
| 🙋 **Utilisateur** | Consulte les magasins, vérifie les disponibilités, réserve, annule avant le début, consulte ses emprunts |

Il n'y a **pas d'inscription publique** : les comptes sont créés par l'administrateur ou par un gestionnaire.

## ✨ Les règles qui comptent

- Une durée de réservation est en heures et doit être **strictement positive**.
- La date de fin est **calculée** à partir du début et de la durée.
- Deux réservations actives sur le même matériel **ne peuvent pas se chevaucher** (mais l'une peut commencer pile à la fin de l'autre).
- Statuts d'une réservation : `confirmée` → `en cours` → `terminée`, ou `annulée` (qui libère le créneau).
- Un matériel rendu endommagé devient **indisponible** jusqu'à sa remise en service.
- Un emprunt est **en retard** quand sa date de fin est dépassée et que le matériel n'est pas rendu.
- Désactiver un compte, un magasin ou un matériel **conserve l'historique**.

## 🧱 Stack technique

- **Node.js** et **Express** pour l'API
- **MongoDB** avec **Mongoose** pour les données
- **JWT** et mots de passe hachés (**bcrypt**) pour l'authentification
- **Docker Compose** pour lancer le tout, avec données persistantes

## 📁 Organisation du code

```
toolshare/
├── app.js                 # configuration d'Express
├── server.js              # démarrage et connexion à MongoDB
├── compose.yml            # backend + MongoDB
├── Dockerfile
└── src/
    ├── routes/            # les URL de l'API
    ├── controllers/       # reçoivent la requête, renvoient la réponse
    ├── services/          # les règles métier
    ├── repositories/      # tous les accès à la base de données
    ├── models/            # schémas Mongoose
    ├── middlewares/       # authentification, droits, gestion des erreurs
    ├── config/            # connexion à la base
    └── utils/             # outils communs (AppError)
```

Chaque couche a un seul rôle : les **services** appliquent les règles, les **repositories** parlent à la base, les **controllers** restent fins.

## 🚀 Lancer le projet

### Ce qu'il vous faut

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose
- [Git](https://git-scm.com/)

### 1. Récupérer le code

```bash
git clone https://github.com/abderrahim-ghmouch/toolshare.git
cd toolshare
```

### 2. Créer le fichier `.env`

Copiez `.env.example` en `.env`, puis remplissez les valeurs :

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/toolshare
JWT_SECRET=une_longue_chaine_secrete_et_aleatoire
JWT_EXPIRES_IN=1d

# Compte du premier administrateur
ADMIN=Admin
ADMIN_EMAIL=admin@toolshare.com
PASSWORD=un_mot_de_passe_solide
```

> 🔒 Le fichier `.env` est ignoré par Git. Ne le publiez jamais.

### 3. Démarrer

```bash
docker compose up --build
```

L'API répond sur **http://localhost:3000**. Les données MongoDB sont gardées dans un volume Docker : elles survivent à un redémarrage.

Pour tout arrêter :

```bash
docker compose down        # garde les données
docker compose down -v     # supprime aussi les données
```

## 🔑 Première utilisation

**1. Vérifier l'état de l'installation**

```bash
curl http://localhost:3000/api/installation/status
# {"installed": false}
```

**2. Installer l'application** (crée le premier administrateur avec les valeurs du `.env`)

```bash
curl -X POST http://localhost:3000/api/installation/install
```

**3. Se connecter**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@toolshare.com","password":"un_mot_de_passe_solide"}'
```

La réponse contient un **token**. Envoyez-le ensuite dans chaque requête protégée :

```
Authorization: Bearer <votre_token>
```

## 🧪 Lancer les tests

```bash
npm test
```

## 🗺️ Où en est le projet ?

- [x] Installation et création du premier administrateur
- [x] Modèle utilisateur (mot de passe haché, jamais renvoyé)
- [x] Connexion avec JWT
- [ ] Protection des routes et droits par rôle
- [ ] Création de comptes avec règles par rôle
- [ ] Magasins et affectation des gestionnaires
- [ ] Matériels
- [ ] Réservations sans chevauchement
- [ ] Remise, retour et retards
- [ ] Tests unitaires
- [ ] Documentation Swagger / OpenAPI

## 🤝 Travailler sur le projet

Le projet est réalisé en **binôme**. Chaque modification passe par une branche et une pull request, avec la clé du ticket Jira dans le message de commit :

```bash
git checkout -b feature/TS-12-auth-middleware
git commit -m "TS-12 ajout du middleware d'authentification"
```

## 📄 Informations

- **Période** : du 19/10/2026 au 30/10/2026
- **Auteurs** : [abderrahim-ghmouch](https://github.com/abderrahim-ghmouch) et son binôme

---

<p align="center">Fait avec ☕ à Safi</p>