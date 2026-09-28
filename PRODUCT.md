# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript (Vite), Supabase (auth e-mail/mot de passe, Postgres, Row Level Security par pôle), déployé sur Vercel. Un mode démo local (données dans le navigateur, choix du profil sans mot de passe) fonctionne tant que les variables Supabase ne sont pas configurées.

## Users

Le Conseil de décision de la Commission Organisation du CEE (Comité Exécutif des Étudiants) de l'ESP, Dakar — six personnes :

- Jacques Sambou — Président de la Commission Organisation (superviseur)
- Mohamed Faye — Adjoint au Président (superviseur)
- Cheikh Beye — Secrétaire Général (administre l'espace Secrétariat)
- Pape Samba Ba — Président du pôle Communication
- Boubou « Aïcha » Diagana — Présidente du pôle Logistique & Événementiel
- Viviane Gnacadja — Présidente du pôle Finance

Utilisé autant sur téléphone que sur ordinateur, souvent ouvert depuis un lien partagé sur WhatsApp, entre deux cours ou pendant une réunion.

## Product Purpose

Un espace unique où le Conseil voit l'état de toute la Commission (activités, missions, annonces, finances publiques, réunions) et où chaque pôle gère ses propres données. Réussi quand plus personne n'a besoin de fouiller le groupe WhatsApp pour savoir où en est une activité, qui fait quoi, et quand est la prochaine réunion.

## Positioning

Construit autour des rôles réels de la Commission : chaque président de pôle publie exactement ce qu'il veut rendre visible au Conseil, et garde le reste (ex. le suivi nominatif des cotisations) dans son espace Admin.

## Operating Context

- Vue commune : lisible par les 6 membres du Conseil.
- Vues de pôle : Logistique & Événementiel, Communication, Finance, plus l'espace Secrétariat Général.
- Pages Admin : une par pôle (Logistique, Communication, Finance) et une pour le Secrétariat (SG seul). Un président ne peut créer / modifier / supprimer que dans son pôle.
- Chaque élément a une visibilité : affiché dans la vue commune, ou privé au pôle.
- Superviseurs (Jacques, Mohamed) : voient tout, y compris les éléments privés, mais ne modifient rien.
- Membres ordinaires de la Commission : ne se connectent pas ; ils apparaissent comme noms (responsables de tâches, cotisants).

## Capabilities and Constraints

- Logistique & Événementiel : calendrier des activités (date, heure, lieu, statut en préparation / prête / problème), fiche détaillée par activité (objectif, public, participants attendus, déroulé, intervenants), répartition des tâches (responsable, statut, échéance), check-list logistique par activité, alertes sur les tâches proches de l'échéance ou en retard, espace Imprévus / problèmes.
- Communication : tableau de bord des annonces, des visuels et du planning de publication. D'autres fonctions pourront s'ajouter.
- Finance : cotisations mensuelles (1 000 F CFA membres ; 1 500 F CFA chefs de pôle et secrétaire ; 2 000 F CFA président et adjoint ; versement sur le numéro Wave de la Commission ; à partir de septembre 2026), autofinancement (idées de revenus, ex. goodies au logo de la Commission), relations extérieures (partenaires, réseau Alumni). Le détail des fonctions Finance est à co-construire avec Mohamed.
- Secrétariat Général : archive des PV / comptes rendus classés par date, registre des décisions du Conseil, tableau de suivi des missions tous pôles confondus (statut, échéance), feuille de présence par réunion, espace « prochaine réunion » (date, heure, lieu, ordre du jour).
- Langue : français. Monnaie : F CFA.

## Brand Commitments

- Nom : Commission Organisation — « Orga » — du CEE ESP.
- Logos : logo Orga (or métallique, noir, blanc) et logo CEE ESP (bleu, vert). Couleurs imposées par l'utilisateur : celles du logo Orga (noir, or, blanc).
- Devise du CEE : « L'engagement au service des valeurs ».

## Evidence on Hand

- Logos : `../project/assets/cee_logo.png` (transparent), logo Orga original (JPG fond blanc) et version transparente `../project/assets/orga_logo.png`.
- Planning annuel 2026–2027 (PDF « Com Orga Jacques ») : Intégrations communales (octobre 2026), activité sans nom « XXXX » (novembre 2026), Kermesse de Noël (décembre 2026), Feu d'artifice + fête du nouvel an (janvier 2027), Saint-Valentin avec CLAC (février 2027), Royal Ndogou (mars 2027), Ngalakh Time (avril 2027), Semaine polytechnicienne (mai 2027), Soirées polytechniciennes (juin 2027), Bye Bye Campus (juillet 2027). Dates précises, heures et lieux non fixés.
- Messages de présentation des pôles Communication, Finance et Logistique (missions et attentes).
- Aucune donnée réelle de cotisations, de PV ou de décisions : ne rien inventer comme donnée réelle ; les exemples du mode démo sont marqués comme tels.

## Product Principles

1. Chaque pôle décide de ce qu'il montre : la visibilité est un choix explicite par élément.
2. Le Conseil doit comprendre l'état de la Commission en un coup d'œil, puis pouvoir descendre dans le détail.
3. Les droits suivent l'organisation réelle : on n'agit que sur son pôle ; les superviseurs voient tout sans modifier.
4. Pensé pour la vraie vie : un lien WhatsApp ouvert sur téléphone doit être aussi bon qu'un grand écran.
