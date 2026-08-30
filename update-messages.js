const fs = require('fs');

// Obtient la date YYYY-MM-DD locale WAT (UTC+1)
const aujourdhui = new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Lagos' });

console.log(`📅 Date WAT: ${aujourdhui}`);

try {
    // 1. Lire les deux fichiers
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const data2 = JSON.parse(fs.readFileSync('data2.json', 'utf8'));

    // 2. Chercher le message du jour dans data2.json
    const messageduJour = data2.messages.find(msg => msg.date === aujourdhui);

    if (!messageduJour) {
        console.log(`⚠️ Aucun message trouvé pour le ${aujourdhui}`);
        process.exit(0);
    }

    // 3. Vérifier si le message existe déjà dans data.json
    const dejaPresent = data.messages.find(msg => msg.id === messageduJour.id);
    if (dejaPresent) {
        console.log(`✅ Message du ${aujourdhui} déjà présent`);
        process.exit(0);
    }

    // 4. Ajouter le message EN HAUT de data.json
    data.messages.unshift(messageduJour);

    // 5. Sauvegarder data.json
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4), 'utf8');

    console.log(`✅ Message ajouté: ${messageduJour.titre}`);

} catch (err) {
    console.error(`❌ Erreur dans le script: ${err.message}`);
    process.exit(1); // Signale une erreur à GitHub Actions
}