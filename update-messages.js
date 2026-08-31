const fs = require('fs');

// Date du jour au format YYYY-MM-DD (Fuseau Afrique/Lagos / WAT)
const aujourdhui = new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Lagos' });

console.log(`📅 Date du jour (WAT) : ${aujourdhui}`);

try {
  // 1. Chargement des fichiers JSON
  const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  const data2 = JSON.parse(fs.readFileSync('data2.json', 'utf8'));

  const messagesSource = data2.messages || [];
  const messagesCible = data.messages || [];

  // 2. Chercher le message correspondant à la date d'aujourd'hui dans data2.json
  const messageduJour = messagesSource.find(msg => msg.date === aujourdhui);

  if (!messageduJour) {
    console.log(`⚠️ Aucun message trouvé pour le ${aujourdhui} dans data2.json`);
    process.exit(0);
  }

  // 3. Vérifier si le message est déjà présent dans data.json
  const dejaPresent = messagesCible.some(msg => msg.id === messageduJour.id || msg.date === aujourdhui);

  if (dejaPresent) {
    console.log(`✅ Message du ${aujourdhui} (ID: ${messageduJour.id}) déjà présent dans data.json. Rien à faire.`);
    process.exit(0);
  }

  // 4. Insertion du nouveau message au début du tableau de data.json
  data.messages.unshift(messageduJour);

  // 5. Sauvegarde de data.json
  fs.writeFileSync('data.json', JSON.stringify(data, null, 4), 'utf8');

  console.log(`🎉 Succès : Message "${messageduJour.titre}" (ID: ${messageduJour.id}) ajouté à data.json`);

} catch (err) {
  console.error(`❌ Erreur dans le script : ${err.message}`);
  process.exit(1);
}
