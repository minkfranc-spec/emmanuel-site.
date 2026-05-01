const fs = require('fs');

// Date du jour en WAT (UTC+1)
const maintenant = new Date();
const watDate = new Date(maintenant.getTime() + 60 * 60000);
const aujourdhui = watDate.toISOString().split('T')[0];

console.log(`📅 Date WAT: ${aujourdhui}`);

// Lire les deux fichiers
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const data2 = JSON.parse(fs.readFileSync('data2.json', 'utf8'));

// Chercher le message du jour dans data2.json
const messageduJour = data2.messages.find(msg => msg.date === aujourdhui);

if (!messageduJour) {
    console.log(`⚠️ Aucun message trouvé pour le ${aujourdhui}`);
    process.exit(0);
}

// Vérifier si le message existe déjà dans data.json
const dejaPresent = data.messages.find(msg => msg.id === messageduJour.id);
if (dejaPresent) {
    console.log(`✅ Message du ${aujourdhui} déjà présent`);
    process.exit(0);
}

// Ajouter le message EN HAUT de data.json
data.messages.unshift(messageduJour);

// Sauvegarder data.json
fs.writeFileSync('data.json', JSON.stringify(data, null, 4), 'utf8');

console.log(`✅ Message ajouté: ${messageduJour.titre}`);
