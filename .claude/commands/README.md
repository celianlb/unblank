# Custom Workflows

Ce dossier contient des templates de workflow pour guider Claude Code dans des tâches spécifiques.

## Comment utiliser

Ces workflows ne sont **pas** des commandes slash comme dans certains autres outils. Ce sont des templates d'instructions que vous référencez dans vos messages à Claude.

### Méthode 1 : Référence directe (Recommandé)

Utilisez `@` pour référencer le fichier dans votre message :

```
@commands/explore-and-plan.md Implémente la fonctionnalité d'export PDF
```

```
@commands/fix-pr-comments.md
```

```
@commands/run-tasks.md #123
```

### Méthode 2 : Script helper

```bash
./.claude/scripts/load-workflow.sh explore-and-plan
```

## Workflows disponibles

### 1. explore-and-plan.md
**Workflow EPCT (Explore, Plan, Code, Test)**

Processus complet pour implémenter une nouvelle fonctionnalité :
1. **Explore** - Utilise des agents parallèles pour trouver les fichiers pertinents
2. **Plan** - Crée un plan d'implémentation détaillé
3. **Code** - Implémente en suivant le style du projet
4. **Test** - Vérifie que tout fonctionne avec des tests automatisés

**Quand l'utiliser :**
- Nouvelles fonctionnalités complexes
- Refactoring important
- Quand vous voulez une approche méthodique

**Exemple :**
```
@commands/explore-and-plan.md Ajoute un système de notifications par email
```

### 2. fix-pr-comments.md
**Résolution automatique des commentaires de PR**

Workflow pour traiter les retours de code review :
1. Récupère les commentaires non résolus via `gh cli`
2. Planifie les modifications nécessaires
3. Implémente les changements
4. Commit et push

**Quand l'utiliser :**
- Après une code review
- Pour traiter plusieurs commentaires d'un coup
- Quand vous voulez automatiser la résolution de feedback

**Exemple :**
```
@commands/fix-pr-comments.md
```

### 3. run-tasks.md
**Exécution de tâches depuis issues ou fichiers**

Workflow pour implémenter une tâche complète :
1. Récupère les informations (fichier ou issue GitHub)
2. Crée un plan d'implémentation
3. Implémente avec vérifications TypeScript
4. Commit les changements
5. Crée une pull request

**Quand l'utiliser :**
- Travailler sur une issue GitHub spécifique
- Implémenter une fonctionnalité depuis une spec
- Processus complet de la tâche à la PR

**Exemple :**
```
@commands/run-tasks.md #42
```
ou
```
@commands/run-tasks.md specs/new-feature.md
```

## Créer vos propres workflows

Vous pouvez créer de nouveaux workflows en ajoutant des fichiers `.md` dans ce dossier.

**Structure recommandée :**

```markdown
---
description: Description courte du workflow
---

# Titre du Workflow

Instructions détaillées pour Claude...

1. Première étape
2. Deuxième étape
...
```

**Important :**
- Utilisez le frontmatter YAML avec une `description`
- Soyez précis dans les instructions
- Incluez des exemples si nécessaire
- Pensez à la réutilisabilité

## Notes

- Ces workflows sont lus et exécutés par Claude Code, pas par un système de commandes
- Ils sont documentés dans `CLAUDE.md` pour les futures instances de Claude
- Le script `validate-command.js` dans `.claude/scripts/` est pour la sécurité, pas pour les workflows
