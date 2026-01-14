# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Modifié
- Migration vers grilles CSS responsives pour tous les layouts (images, vidéos, liens, dossiers)
- Cards adaptatives avec contraintes min/max par type de contenu

### Corrigé
- Affichage des cards sur la page de partage public (utilisation des grilles CSS responsives)
- Boutons d'action visibles en mode lecture seule sur la page de partage

## [1.3.0] - 2025-01-14

### Ajouté
- Recherche textuelle dans les noms de tags
- Bouton flottant pour signaler des bugs (beta)
- Déplacement de liens vers un dossier (bouton sur les cards)
- Header avec scroll hide (disparaît au scroll vers le bas)

### Corrigé
- Espacement du header et tooltips avec système de portal
- Overflow et taille des cards
- Affichage des ImageCards sur mobile

## [1.2.0] - 2025-01-13

### Ajouté
- Flux d'onboarding pour les nouveaux utilisateurs
- Consultation des dossiers partagés sans compte utilisateur
- Composants skeleton pour améliorer le chargement des pages
- Raccourcis clavier : Cmd+K (recherche), Cmd+E (ajouter)
- Tooltips sur toutes les icônes d'action CRUD
- Bouton suppression dans le modal de preview (mobile)
- Badges raccourcis clavier sur la searchbar et le bouton Ajouter

### Modifié
- Simplification de l'architecture : suppression du système de groupes
- Les dossiers peuvent maintenant contenir des sous-dossiers ET des liens
- ImageCards affichées 2 par ligne sur mobile (ratio 4:5)
- Amélioration du breadcrumb avec hiérarchie complète
- Les liens sans dossier vont automatiquement dans "Récents"

### Retiré
- Plan Team supprimé (uniquement Free et Pro)
- Composant FolderGroupCard
- Routes [slug] et [slug]/[folder] pour les groupes

### Corrigé
- Logo manquant sur la page de connexion
- Positionnement de la croix dans CreateNewModal
- Filtrage des liens par utilisateur dans la recherche
- Gestion du token d'authentification dans le flux d'onboarding

## [1.1.0] - 2025-01-11

### Ajouté
- **Intégration Stripe** : Abonnements Free et Pro avec gestion des limites
- **AI Auto-Tagging** : Génération automatique de tags via OpenAI GPT-4o-mini
- **Support vidéos** : Détection et preview YouTube, Vimeo, Dailymotion
- **Système de partage** : Partager des dossiers en lecture ou édition
- **Recherche full-text** : Recherche dans les liens, dossiers et tags
- Portail client Stripe pour gérer l'abonnement
- Webhook Stripe pour synchronisation des statuts
- Extension Chrome avec détection d'abonnement

### Modifié
- Limites par plan : 50 liens/mois (Free), illimité (Pro)
- Membres max par partage : 15 (Free), 30 (Pro)
- AI Tags réservés aux utilisateurs Pro

## [1.0.0] - 2025-11-13

### Ajouté
- **Application web Next.js 16** avec App Router
- **Authentification** : Email/password et OAuth (Google)
- **Gestion des liens** :
  - Création, modification, suppression
  - Extraction automatique des métadonnées (titre, description, image)
  - Support des images avec preview
- **Gestion des dossiers** :
  - Création de dossiers et groupes de dossiers
  - Organisation hiérarchique
  - Dossier système "Récents"
- **Système de tags** : Création et assignation de tags aux liens
- **Extension Chrome** :
  - Popup pour sauvegarder des liens rapidement
  - Authentification synchronisée avec l'app web
  - Interface de création de lien
- **Infrastructure** :
  - Clean Architecture (Domain, Application, Infrastructure, Library)
  - Supabase (PostgreSQL + Auth + Storage)
  - TanStack React Query pour le state management
  - TailwindCSS v4 pour le styling

---

## Convention de versioning

Ce projet utilise le [Semantic Versioning](https://semver.org/lang/fr/) :

- **MAJOR** (X.0.0) : Changements incompatibles avec les versions précédentes
- **MINOR** (0.X.0) : Ajout de fonctionnalités rétrocompatibles
- **PATCH** (0.0.X) : Corrections de bugs rétrocompatibles

### Types de changements

- **Ajouté** : Nouvelles fonctionnalités
- **Modifié** : Changements dans les fonctionnalités existantes
- **Déprécié** : Fonctionnalités qui seront supprimées prochainement
- **Retiré** : Fonctionnalités supprimées
- **Corrigé** : Corrections de bugs
- **Sécurité** : Corrections de vulnérabilités
