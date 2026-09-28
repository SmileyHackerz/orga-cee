# Orga — l’app du conseil de la Commission Organisation (CEE ESP)

Vue commune pour les six membres du conseil, une page par pôle (Logistique & Événementiel, Communication, Finance, Secrétariat général) et un espace admin par pôle où chaque président ajoute, modifie et choisit ce qui est visible par le conseil.

## Lancer en local

```bash
npm install
npm run dev
```

Sans configuration, l’app tourne en **mode démo** : on choisit un membre du conseil à la connexion, les données d’exemple restent dans le navigateur. Le bouton « Réinitialiser la démo » remet les exemples à zéro.

## Brancher Supabase (données partagées par tout le conseil)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. **SQL Editor** → colle et exécute `supabase/schema.sql` (tables, sécurité par pôle, temps réel, activités 2026–2027).
3. **Authentication → Users → Add user** : crée un compte pour chacun des six membres, avec le mot de passe `passer123` (coche *Auto Confirm User*). À sa première connexion, chacun devra choisir son propre mot de passe avant d’accéder à l’app. Pense aussi à désactiver *Allow new users to sign up* dans **Authentication → Sign In / Providers → Email**.
4. Ouvre `supabase/profiles.sql`, remplace les six adresses e-mail par les vraies, puis exécute-le.
5. **Project Settings → API** : copie l’URL du projet et la clé `anon public` dans un fichier `.env.local` :

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

6. Relance `npm run dev` : l’écran de connexion demande maintenant e-mail et mot de passe.

## Déployer sur Vercel

1. Pousse le dossier sur GitHub, puis importe-le dans Vercel (framework : Vite, déjà réglé dans `vercel.json`).
2. Dans **Settings → Environment Variables**, ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
3. Partage le lien sur le groupe WhatsApp du conseil.

## Qui peut faire quoi

| Qui | Vue commune et pages de pôle | Espace admin |
| --- | --- | --- |
| Jacques Sambou, Mohamed Faye (superviseurs) | Tout, y compris ce que les pôles gardent privé | Tous les pôles, en lecture seule |
| Président·e d’un pôle | Ce que les pôles ont rendu visible, plus tout son pôle | Son pôle uniquement : ajouter, modifier, supprimer, rendre visible ou privé |

Ces règles sont appliquées par la base de données elle-même (Row Level Security), pas seulement par l’interface.

## Raccourcis

- `Ctrl K` (ou `⌘ K`) : recherche rapide d’une page, activité, mission, décision ou PV.
- Cliquer une activité ouvre sa fiche détaillée avec sa check-list ; le lien est partageable.
