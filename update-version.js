#!/usr/bin/env node

/**
 * Script pour mettre à jour automatiquement la version dans les fichiers
 * À exécuter chaque jour pour forcer le vidage du cache sur tous les appareils
 */

const fs = require('fs');
const path = require('path');

// Générer la version du jour (format YYYY.MM.DD)
const today = new Date();
const version = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

console.log(`🔄 Mise à jour de la version vers: ${version}`);

// Fichiers à mettre à jour
const files = [
    {
        path: './script.js',
        pattern: /const CURRENT_VERSION = '[^']+'/,
        replacement: `const CURRENT_VERSION = '${version}'`
    },
    {
        path: './index.html',
        pattern: /const version = '[^']+'/,
        replacement: `const version = '${version}'`
    }
];

// Mettre à jour chaque fichier
files.forEach(file => {
    try {
        const filePath = path.resolve(file.path);
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (file.pattern.test(content)) {
            content = content.replace(file.pattern, file.replacement);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${file.path} mis à jour`);
        } else {
            console.log(`⚠️  Pattern non trouvé dans ${file.path}`);
        }
    } catch (error) {
        console.error(`❌ Erreur avec ${file.path}:`, error.message);
    }
});

console.log(`🎉 Mise à jour terminée! Version: ${version}`);
console.log(`📝 N'oubliez pas de déployer les fichiers modifiés.`);
