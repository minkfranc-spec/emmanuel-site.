# Système de Cache-Busting Automatique - Site Emmanuel

## 🎯 Problème résolu
Le site affiche maintenant automatiquement le nouveau message chaque jour à minuit WAT, même sur les appareils qui ont mis en cache l'ancienne version.

## 🔧 Solutions implémentées

### 1. **Système de versioning automatique**
- Chaque jour a sa propre version (format: YYYY.MM.DD)
- Si la version change, le cache est automatiquement vidé
- Fonctionne sur tous les navigateurs et appareils

### 2. **Cache-busting multi-niveaux**
- **localStorage** : Vidé automatiquement
- **sessionStorage** : Vidé automatiquement  
- **Cache navigateur** : Vidé via l'API Cache
- **Cache serveur** : Désactivé via .htaccess

### 3. **Vérifications automatiques**
- À minuit WAT : Mise à jour automatique
- Toutes les 30 min : Vérification du changement de jour
- Au chargement : Vérification de version

### 4. **Headers HTTP agressifs**
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

## 📅 Utilisation quotidienne

### Option 1: Automatique (Recommandée)
Le système se met à jour automatiquement à minuit WAT. Aucune action requise.

### Option 2: Manuelle avec script
```bash
# Exécuter chaque matin pour forcer la mise à jour
node update-version.js
```

### Option 3: Manuelle dans les fichiers
1. **Dans script.js**, ligne 8 :
   ```javascript
   const CURRENT_VERSION = '2026.04.25'; // Changer la date
   ```

2. **Dans index.html**, ligne 25 :
   ```javascript
   const version = '2026.04.25'; // Changer la date
   ```

## 🛠️ Fonctions de débogage

Dans la console du navigateur :
```javascript
// Forcer le vidage du cache
forcerMiseAJour()

// Vider uniquement le cache global
forceGlobalCacheRefresh()

// Vérifier la version actuelle
localStorage.getItem('emmanuel_version')
```

## 📊 Monitoring

Le système affiche des logs dans la console :
- Date WAT actuelle
- Nombre de messages disponibles
- Détection des changements de version/jour
- Statut du vidage de cache

## 🚀 Déploiement

1. Télécharger tous les fichiers modifiés
2. S'assurer que `.htaccess` est présent sur le serveur
3. Optionnel : Configurer une tâche cron pour `update-version.js`

## ⚡ Performance

- Le cache est vidé intelligemment (seulement quand nécessaire)
- Les ressources statiques (images, fonts) restent en cache
- Seuls les fichiers critiques (JSON, JS, HTML) sont rechargés

## 🔍 Vérification

Pour tester si ça fonctionne :
1. Ouvrir la console (F12)
2. Regarder les logs au chargement
3. Vérifier que la date WAT correspond à aujourd'hui
4. Confirmer que le bon nombre de messages s'affiche

## 📱 Compatibilité

- ✅ Chrome/Edge (toutes versions récentes)
- ✅ Firefox (toutes versions récentes)  
- ✅ Safari (iOS/macOS)
- ✅ Navigateurs mobiles
- ✅ Applications WebView
