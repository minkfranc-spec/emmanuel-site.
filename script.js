let currentLang = 'fr';
let tousLesMessages = [];
let msgPartageTemp = "";
let titrePartageTemp = "";

const CACHE_KEY = 'emmanuel_data_v2';
const CACHE_TTL = 15 * 60 * 1000;

const moisNoms = {
    fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

const translations = {
    fr: {
        welcome: "Bienvenue à EMMANUEL",
        intro: "La Lumière qui éclaire chaque pas sur le chemin de la Vie.",
        searchPlaceholder: "Rechercher un message...",
        archiveBtn: "📂 Consulter les Archives",
        archiveBtnClose: "❌ Fermer les Archives",
        shareBtn: "📤 Partager",
        copied: "✨ Lien copié !",
        published: "Publié le",
        statTitle: "COMMUNAUTÉ EMMANUEL",
        statSub: "✨ Lecteurs par pays et vues ✨",
        backList: "⬅ Retour",
        scrollTop: "Retour en haut",
        help: "Besoin d'aide ?",
        update: "Le compteur s'actualise toutes les 15 min",
        selectTheme: "Choisir une thématique..."
    },
    en: {
        welcome: "Welcome to EMMANUEL",
        intro: "The Light that guides every step on the path of Life.",
        searchPlaceholder: "Search for a message...",
        archiveBtn: "📂 View Archives",
        archiveBtnClose: "❌ Close Archives",
        shareBtn: "📤 Share",
        copied: "✨ Link copied!",
        published: "Published on",
        statTitle: "EMMANUEL COMMUNITY",
        statSub: "✨ Readers by country and views ✨",
        backList: "⬅ Back",
        scrollTop: "Back to top",
        help: "Need help?",
        update: "The counter updates every 15 min",
        selectTheme: "Choose a theme..."
    }
};

function t(msg, champ) {
    return (currentLang === 'en' && msg[champ + '_en']) ? msg[champ + '_en'] : msg[champ];
}

function encodeTexte(str) { return encodeURIComponent(str); }
function decodeTexte(str) { return decodeURIComponent(str); }

function afficherToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

async function fetchData() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { ts, data } = JSON.parse(cached);
        const aujourdhui = new Date().toISOString().split('T')[0];
        const dateCache = new Date(ts).toISOString().split('T')[0];
        if (Date.now() - ts < CACHE_TTL && dateCache === aujourdhui) return data;
    }

    const res = await fetch('data.json?v=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    return data;
}

async function chargerMessages() {
    try {
        const data = await fetchData();

        if (data.communique && data.communique.trim() !== "") {
            const bubble = document.getElementById('notif-bubble');
            bubble.style.display = 'flex';
            bubble.innerHTML = '<span style="color:white; font-size:18px;">🔔</span><div class="notif-badge">1</div>';
            document.getElementById('notif-list').innerHTML = `<div class="notif-item">${data.communique}</div>`;
        }

        if (data.status === "standby") {
            document.body.innerHTML = `<div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#1a1a1a; color:#d4af37; text-align:center; padding:20px;"><h1 style="color:#d4af37; font-size:3em; font-family:'Montserrat';">🏛️ EMMANUEL</h1><p style="font-family:'Lora'; font-size:1.5em;">Le sanctuaire est momentanément fermé pour maintenance.</p><p style="font-style:italic; opacity:0.7;">La Voix de la Vérité revient bientôt.</p></div>`;
            return;
        }

        const listeBrute = data.messages || [];
        const aujourdhui = new Date().toISOString().split('T')[0];
        tousLesMessages = listeBrute.filter(msg => msg.date <= aujourdhui);

        setLanguage('fr');
        genererBoutonsThemes();

        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    } catch (err) {
        console.error("Erreur:", err);
        if (document.getElementById('loading-screen')) document.getElementById('loading-screen').style.display = 'none';
    }
}

function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.getElementById('btn-fr').classList.toggle('active', lang === 'fr');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('welcome-txt').innerText = translations[lang].welcome;
    document.getElementById('intro-txt').innerText = translations[lang].intro;
    document.getElementById('stat-title').innerText = translations[lang].statTitle;
    document.getElementById('stat-sub').innerText = translations[lang].statSub;
    document.getElementById('label-top').innerText = translations[lang].scrollTop;
    document.getElementById('label-help').innerText = translations[lang].help;
    document.getElementById('update-txt').innerHTML = translations[lang].update;
    document.getElementById('searchInput').placeholder = translations[lang].searchPlaceholder;
    document.getElementById('btn-archive').innerText = translations[lang].archiveBtn;
    afficherAccueil();
    genererBoutonsMois();
}

function switchArchiveView(view) {
    document.getElementById('view-chrono').style.display = (view === 'chrono') ? 'block' : 'none';
    document.getElementById('view-theme').style.display = (view === 'theme') ? 'block' : 'none';
    document.getElementById('nav-chrono').classList.toggle('active', view === 'chrono');
    document.getElementById('nav-theme').classList.toggle('active', view === 'theme');
    document.getElementById('titres-liste').innerHTML = '';
    document.getElementById('message-detail').innerHTML = '';
    document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('themeDropdown').selectedIndex = 0;
}

function genererBoutonsThemes() {
    const select = document.getElementById('themeDropdown');
    const themes = [...new Set(tousLesMessages.map(m => m.categorie))].filter(t => t).sort();
    let options = `<option value="">-- ${translations[currentLang].selectTheme} --</option>`;
    options += themes.map(t => `<option value="${t}">📂 ${t}</option>`).join('');
    select.innerHTML = options;
}

function choisirThemeViaDropdown(theme) {
    const liste = document.getElementById('titres-liste');
    const detail = document.getElementById('message-detail');
    if (!theme) { liste.innerHTML = ''; detail.innerHTML = ''; return; }

    const vus = {};
    const uniqueResults = [];
    const sorted = tousLesMessages.filter(m => m.categorie === theme).sort((a, b) => b.id - a.id);
    for (const msg of sorted) {
        const cleanTitle = (msg.titre || "").trim().toLowerCase();
        if (!vus[cleanTitle]) { vus[cleanTitle] = true; uniqueResults.push(msg); }
    }
    liste.innerHTML = uniqueResults.map(msg => `<div class="titre-archive-item" onclick="voirDetail(${msg.id}, 'theme', '${theme.replace(/'/g, "\\'")}')">${t(msg, 'titre')}</div>`).join('');
}

function voirDetail(id, type, val) {
    const msg = tousLesMessages.find(m => m.id === id);
    document.getElementById('titres-liste').innerHTML = '';
    const btnRetour = type === 'chrono'
        ? `<button class="archive-main-btn" onclick="revenirChrono(${val})">${translations[currentLang].backList}</button>`
        : `<button class="archive-main-btn" onclick="revenirTheme('${val.replace(/'/g, "\\'")}')">${translations[currentLang].backList}</button>`;
    document.getElementById('message-detail').innerHTML = creerCard(msg) + btnRetour;
}

function revenirChrono(num) {
    const btn = document.querySelectorAll('.month-btn')[num - 1];
    btn.classList.remove('active');
    afficherTitresDuMois(num, btn);
}

function revenirTheme(th) {
    document.getElementById('themeDropdown').value = th;
    choisirThemeViaDropdown(th);
}

function ouvrirNotif() { document.getElementById('notif-panel').style.display = 'flex'; }
function toutMasquer() {
    document.getElementById('notif-panel').style.display = 'none';
    document.getElementById('notif-bubble').style.display = 'none';
}

function creerCard(msg) {
    const dateObj = new Date(msg.date);
    const dateAffichee = currentLang === 'fr' ? dateObj.toLocaleDateString('fr-FR') : dateObj.toLocaleDateString('en-US');
    const texteOriginal = t(msg, 'texte');
    const titre = t(msg, 'titre');
    const categorie = t(msg, 'categorie');
    const texteFormate = texteOriginal.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const imgHtml = msg.image ? `<img src="${msg.image}" class="msg-img" loading="lazy" alt="${titre}">` : '';
    let audioHtml = msg.audio ? `<audio src="${msg.audio}" controls style="width:100%;height:35px;margin:15px 0;border-radius:8px;"></audio>` : '';
    if (msg.audio2) audioHtml += `<audio src="${msg.audio2}" controls style="width:100%;height:35px;margin:5px 0 15px 0;border-radius:8px;"></audio>`;

    const titreEnc = encodeTexte(titre);
    const texteEnc = encodeTexte(texteOriginal);

    return `<div class="message-card">${imgHtml}<span style="font-size:0.7em;color:#d4af37;font-weight:900;text-transform:uppercase;">${categorie}</span><h3 class="msg-title">${titre}</h3>${audioHtml}<div class="msg-content">${texteFormate}</div><button class="copy-btn" onclick="ouvrirMenuPartage('${titreEnc}','${texteEnc}')">${translations[currentLang].shareBtn}</button><span class="published-date">${translations[currentLang].published} ${dateAffichee}</span></div>`;
}

function ouvrirMenuPartage(titreEnc, texteEnc) {
    titrePartageTemp = decodeTexte(titreEnc);
    msgPartageTemp = decodeTexte(texteEnc).replace(/\*\*/g, '');
    document.getElementById('modalOverlay').style.display = 'block';
    document.getElementById('shareModal').style.display = 'block';
}

function fermerPartage() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('shareModal').style.display = 'none';
}

function actionPartage(type) {
    const url = "https://emmanuel-dpv.pages.dev";
    const messageComplet = `${titrePartageTemp}\n\n${msgPartageTemp}\n\nLire la suite : ${url}`;
    if (type === 'wa') window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(messageComplet), '_blank');
    else if (type === 'fb') window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), '_blank');
    else if (type === 'mail') window.location.href = `mailto:?subject=${encodeURIComponent(titrePartageTemp)}&body=${encodeURIComponent(messageComplet)}`;
    else if (type === 'copy') {
        navigator.clipboard.writeText(messageComplet);
        afficherToast(translations[currentLang].copied);
    }
    fermerPartage();
}

function afficherAccueil() {
    const container = document.getElementById('flux-messages');
    const derniers = [...tousLesMessages].sort((a, b) => b.id - a.id).slice(0, 3);
    container.innerHTML = derniers.map(msg => creerCard(msg)).join('');
}

function toggleArchives() {
    const s = document.getElementById('archiveSection');
    const btn = document.getElementById('btn-archive');
    if (s.style.display === 'block') {
        s.style.display = 'none';
        btn.innerText = translations[currentLang].archiveBtn;
    } else {
        s.style.display = 'block';
        btn.innerText = translations[currentLang].archiveBtnClose;
    }
}

function genererBoutonsMois() {
    const grid = document.getElementById('monthGrid');
    grid.innerHTML = moisNoms[currentLang].map((nom, i) => `<button class="month-btn" onclick="afficherTitresDuMois(${i + 1}, this)">${nom}</button>`).join('');
}

function afficherTitresDuMois(numMois, btn) {
    const liste = document.getElementById('titres-liste');
    const detail = document.getElementById('message-detail');
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        liste.innerHTML = '';
        detail.innerHTML = '';
        return;
    }
    document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    detail.innerHTML = '';
    const filtered = tousLesMessages.filter(msg => (new Date(msg.date).getMonth() + 1) === numMois).sort((a, b) => a.id - b.id);
    liste.innerHTML = filtered.map(msg => `<div class="titre-archive-item" onclick="voirDetail(${msg.id}, 'chrono', ${numMois})">${t(msg, 'titre')}</div>`).join('');
}

function filtrerMessages() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('flux-messages');
    if (query === "") { afficherAccueil(); return; }
    const resultats = tousLesMessages.filter(msg => {
        const searchIn = ((msg.titre || "") + (msg.titre_en || "") + (msg.texte || "") + (msg.texte_en || "") + (msg.categorie || "") + (msg.categorie_en || "")).toLowerCase();
        return searchIn.includes(query);
    });
    container.innerHTML = resultats.sort((a, b) => b.id - a.id).map(msg => creerCard(msg)).join('');
}

window.onscroll = function() {
    document.getElementById("scrollTopLink").style.display = window.scrollY > 400 ? "flex" : "none";
};

document.addEventListener('DOMContentLoaded', () => {
    chargerMessages();
    document.addEventListener('click', e => {
        const panel = document.getElementById('notif-panel');
        const bubble = document.getElementById('notif-bubble');
        if (panel.style.display === 'flex' && !panel.contains(e.target) && !bubble.contains(e.target)) {
            panel.style.display = 'none';
        }
    });
});
