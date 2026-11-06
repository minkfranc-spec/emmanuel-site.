# 🔄 Plan de Migration — Projet Emmanuel-DPV (Janvier 2027)

> **À copier-coller dans un nouveau chat le 31 décembre 2026.**

---

## Le problème identifié

- Les **images** du site sont hébergées sur **imgbb** (gratuit, instable) → l'image du jour ne s'affiche pas le matin, elle arrive le soir quand le service revient.
- Les **audios** sont hébergés sur **Pecon / Leopard Hosting** (projet d'un seul développeur, aucune garantie de durée).
- Les anciennes images s'affichent grâce au **cache du service worker** (`sw.js`), mais les nouvelles images ne peuvent pas être cachées car elles n'ont jamais été téléchargées.

## La solution décidée

| Type | Avant | Après |
|---|---|---|
| 🖼️ **Images** (~700 Ko chacune) | imgbb ❌ | Dossier `images/` dans le projet GitHub → servies par Cloudflare Pages ✅ |
| 🔊 **Audios** (~15 Mo chacun) | Pecon ⚠️ | **Cloudflare R2** (10 Go gratuits par compte) ✅ |

## Pourquoi cette répartition

- **Images dans GitHub** : 700 Ko × 365 = ~250 Mo/an → GitHub recommande < 1 Go, donc largement OK.
- **Audios sur Cloudflare R2** : 15 Mo × 365 = ~5,5 Go/an → trop lourd pour GitHub, mais dans les 10 Go gratuits de R2.
- **Stratégie de remplacement** (pas d'ajout) à partir de janvier → le poids reste stable, ne grossit jamais.

## Les étapes à faire en janvier

### Étape 1 — Activer Cloudflare R2
- Aller dans le tableau de bord Cloudflare → R2 → Activer
- ⚠️ Cloudflare demande une carte bancaire pour vérification, mais c'est gratuit sous 10 Go
- Créer un "bucket" (espace de rangement) pour les audios

### Étape 2 — Créer le dossier images dans le projet
- Créer un dossier `images/` dans le projet `emmanuel-site.`
- Y mettre les images au lieu de les uploader sur imgbb

### Étape 3 — Migrer progressivement
- Pendant la révision des messages, remplacer les liens dans `data.json` :
  - Images : de `https://i.ibb.co/...` vers `./images/nom-image.jpg`
  - Audios : de `https://leopard.hosting.pecon.us/...` vers l'URL du bucket R2
- Pas besoin de tout faire d'un coup — message par message pendant la révision

### Étape 4 — Vérifier
- Tester que les images et audios s'affichent correctement
- Vérifier que le service worker cache bien les nouvelles images locales

## Infos techniques à retenir

- **Architecture** : GitHub (stockage code + images) → Cloudflare Pages (déploie et sert le site)
- **Cloudflare R2** : service séparé de Pages, même compte, 10 Go partagés entre tous les projets
- **Limites** : GitHub < 1 Go recommandé | Cloudflare Pages fichier < 25 Mo | R2 < 10 Go gratuit
- **Service worker** (`sw.js`) : cache déjà les images visitées, mais ne peut pas cacher ce qui n'a jamais été téléchargé
- **Fichier MCP Kiro** : `.kiro/settings/mcp.json` contient la config Cloudflare + GitHub (⚠️ le token GitHub a été exposé dans l'ancien chat — il a été révoqué et remplacé)

## Sécurité — Action faite ✅

- ⚠️ Le token GitHub (`github_pat_11B4W6MYY...`) dans `.kiro/settings/mcp.json` a été **exposé** dans un chat.
- ✅ **Action requise** : aller sur GitHub → Settings → Developer settings → Personal access tokens → révoquer l'ancien token et en créer un nouveau.
- ✅ Mettre à jour le nouveau token dans `.kiro/settings/mcp.json`
