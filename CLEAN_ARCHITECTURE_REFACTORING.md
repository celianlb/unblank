# Refactoring Clean Architecture - API Routes

## Vue d'ensemble

Ce refactoring a pour objectif de respecter l'architecture clean en faisant passer toutes les mutations par des API routes qui vérifient les permissions côté serveur, au lieu d'appeler directement les services depuis le client.

## Problème initial

Certaines mutations appelaient directement les services côté client avec le client Supabase RLS. Cela posait problème pour les ressources partagées car RLS empêche les updates/deletes même si l'utilisateur a les permissions via la table `shares`.

### ❌ Avant (Non-Clean)
```typescript
// Hook appelait directement le service
mutationFn: (folderIds: string[]) => folderService.deleteFolders(folderIds)
```

### ✅ Après (Clean)
```typescript
// Hook appelle l'API route qui vérifie les permissions
mutationFn: async (folderIds: string[]) => {
  const response = await fetch('/api/folders', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folderIds }),
  });
  return response.json();
}
```

## API Routes créées

### 1. PATCH /api/folders/[folderId]
**Fichier**: `src/app/api/folders/[folderId]/route.ts`

**Fonction**: Renommer un dossier

**Vérifications de permissions**:
- Vérifie si l'utilisateur est propriétaire du dossier
- Si non propriétaire, vérifie les permissions via la table `shares` (permission `edit` requise)

**Hook mis à jour**: `useRenameFolder` dans `src/hooks/useFolders.ts`

---

### 2. DELETE /api/folders
**Fichier**: `src/app/api/folders/route.ts` (ajout de la méthode DELETE)

**Fonction**: Supprimer plusieurs dossiers

**Vérifications de permissions**:
- Pour chaque dossier, vérifie si l'utilisateur est propriétaire
- Si non propriétaire, vérifie les permissions via la table `shares` (permission `edit` requise)

**Hook mis à jour**: `useDeleteFolders` dans `src/hooks/useFolders.ts`

---

### 3. PATCH /api/folders/[folderId]/move
**Fichier**: `src/app/api/folders/[folderId]/move/route.ts`

**Fonction**: Déplacer un dossier vers un groupe

**Vérifications de permissions**:
- Vérifie les permissions sur le dossier à déplacer (propriétaire ou permission `edit`)
- Si déplacement vers un groupe, vérifie également les permissions sur le groupe de destination (propriétaire ou permission `edit`)

**Hook mis à jour**: `useMoveFolderToGroup` dans `src/hooks/useFolders.ts`

---

### 4. DELETE /api/links/[linkId]
**Fichier**: `src/app/api/links/[linkId]/route.ts`

**Fonction**: Supprimer un seul lien

**Vérifications de permissions**:
- Vérifie si l'utilisateur est propriétaire du lien
- Si non propriétaire et lien dans un dossier, vérifie les permissions via la table `shares` (permission `edit` requise)
- Si non propriétaire et lien sans dossier, interdit la suppression

**Hook mis à jour**: `useDeleteLink` dans `src/hooks/useLinks.ts`

---

### 5. DELETE /api/links (amélioré)
**Fichier**: `src/app/api/links/route.ts` (méthode existante améliorée)

**Fonction**: Supprimer plusieurs liens

**Améliorations**:
- Ajout de vérifications de permissions pour chaque lien
- Récupère tous les liens avec leurs `folder_id` en une seule requête
- Pour chaque lien, vérifie les permissions (propriétaire ou permission `edit` via `shares`)

**Note**: Ce hook utilisait déjà l'API route, mais la route ne vérifiait pas les permissions. C'est maintenant corrigé.

---

### 6. POST /api/links (amélioré)
**Fichier**: `src/app/api/links/route.ts` (méthode existante améliorée)

**Fonction**: Créer un lien

**Améliorations**:
- Ajout de vérifications de permissions si le lien est créé dans un dossier partagé
- Vérifie si l'utilisateur est propriétaire du dossier
- Si non propriétaire, vérifie les permissions via la table `shares` (permission `edit` requise)

**Hook mis à jour**: `useCreateLink` dans `src/hooks/useLinks.ts` (utilisait directement le service avant)

---

### Note importante : Restructuration des routes

Pour éviter un conflit de nommage dans Next.js 15, la route GET pour récupérer les dossiers d'un groupe a été déplacée :
- **Ancien chemin** : `/api/folders/[groupId]`
- **Nouveau chemin** : `/api/folders/groups/[groupId]`

Cette restructuration permet d'avoir `/api/folders/[folderId]` pour les opérations PATCH sur un dossier individuel sans conflit avec le paramètre dynamique `[groupId]`.

## Structure de vérification des permissions

Toutes les API routes suivent le même pattern:

```typescript
// 1. Authentification
const authHeader = request.headers.get('Authorization');
const accessToken = authHeader?.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(accessToken);

// 2. Vérification propriétaire
const { data: resource } = await supabase
  .from('table')
  .select('user_id')
  .eq('id', resourceId)
  .single();

const isOwner = resource.user_id === user.id;

// 3. Si non propriétaire, vérifier permissions de partage
if (!isOwner) {
  const { data: share } = await supabase
    .from('shares')
    .select('permission')
    .eq('folder_id', folderId)
    .eq('shared_with_email', user.email)
    .eq('is_active', true)
    .eq('permission', 'edit')
    .maybeSingle();

  const hasEditPermission = share?.permission === 'edit';

  if (!hasEditPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

// 4. Appel au service domain
const service = Factory.createService(supabase);
const result = await service.method(...);
```

## Hooks mis à jour

### Dossiers (`src/hooks/useFolders.ts`)
- ✅ `useRenameFolder` - Utilise PATCH /api/folders/[folderId]
- ✅ `useDeleteFolders` - Utilise DELETE /api/folders
- ✅ `useMoveFolderToGroup` - Utilise PATCH /api/folders/[folderId]/move
- ✅ `useCreateFolder` - Utilisait déjà POST /api/folders (inchangé)

### Liens (`src/hooks/useLinks.ts`)
- ✅ `useDeleteLink` - Utilise DELETE /api/links/[linkId]
- ✅ `useDeleteLinks` - Utilisait déjà DELETE /api/links (route améliorée)
- ✅ `useCreateLink` - Utilise POST /api/links (modifié pour utiliser l'API au lieu du service direct)

### Partages (`src/hooks/useShares.ts`)
- ✅ Tous les hooks utilisaient déjà les API routes (aucun changement nécessaire)

## Architecture finale

```
Client (Browser)
    ↓
React Hook (useMutation)
    ↓
API Route (Next.js /api)
    ↓ [Vérification permissions via table shares]
    ↓
Service Domain
    ↓
Repository (Infrastructure)
    ↓
Supabase (Database)
```

## Avantages

1. **Sécurité**: Toutes les vérifications de permissions se font côté serveur
2. **Partage**: Les utilisateurs avec permissions `edit` peuvent maintenant modifier/supprimer des ressources partagées
3. **Cohérence**: Toutes les mutations suivent le même pattern d'architecture
4. **Maintenabilité**: La logique de vérification est centralisée dans les API routes
5. **Évolutivité**: Facile d'ajouter de nouvelles vérifications ou middlewares

## Tests recommandés

Pour chaque opération, tester:
1. ✅ Propriétaire peut effectuer l'opération
2. ✅ Utilisateur avec permission `edit` peut effectuer l'opération
3. ✅ Utilisateur avec permission `view` ne peut PAS effectuer l'opération
4. ✅ Utilisateur sans aucun partage ne peut PAS effectuer l'opération
5. ✅ Opération sur ressource inexistante retourne 404
6. ✅ Opération sans authentification retourne 401

## Points d'attention

- Toutes les API routes incluent le support CORS (via `handleCorsPreFlight` et `addCorsHeaders`)
- Les tokens d'accès sont récupérés via `supabase.auth.getSession()` côté client
- Les invalidations de cache React Query sont maintenues dans les hooks
- Les services domain restent inchangés (logique métier préservée)

