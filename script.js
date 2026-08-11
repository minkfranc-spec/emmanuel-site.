let currentLang = 'fr';
let tousLesMessages = [];
let msgPartageTemp = "";
let titrePartageTemp = "";
let lectureContineActive = false;
let archivePlaylist = [];
let archivePlayIndex = -1;
let archiveContext = null;
let scrollRAF = null;
let scrollCard = null;
let scrollAudio = null;
let wakeLock = null;

const CACHE_KEY = 'emmanuel_data_v3';
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
    const aujourdhui = new Date().toISOString().split('T')[0];
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { ts, data } = JSON.parse(cached);
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
    arreterLectureContinue();
    const msg = tousLesMessages.find(m => m.id === id);
    document.getElementById('titres-liste').innerHTML = '';

    if (type === 'chrono') {
        archivePlaylist = tousLesMessages.filter(m => (new Date(m.date).getMonth() + 1) === val).sort((a, b) => a.id - b.id).map(m => m.id);
        archiveContext = { type, val };
    } else {
        const vus = {};
        archivePlaylist = [];
        tousLesMessages.filter(m => m.categorie === val).sort((a, b) => b.id - a.id).forEach(m => {
            const k = (m.titre || '').trim().toLowerCase();
            if (!vus[k]) { vus[k] = true; archivePlaylist.push(m.id); }
        });
        archiveContext = { type, val };
    }
    archivePlayIndex = archivePlaylist.indexOf(id);

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

function creerCard(msg, isPremiere = false) {
    const dateObj = new Date(msg.date);
    const dateAffichee = currentLang === 'fr' ? dateObj.toLocaleDateString('fr-FR') : dateObj.toLocaleDateString('en-US');
    const texteOriginal = t(msg, 'texte');
    const titre = t(msg, 'titre');
    const categorie = t(msg, 'categorie');
    const texteFormate = texteOriginal.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const imgHtml = msg.image ? `<img src="${msg.image}" class="msg-img" loading="lazy" alt="${titre}">` : '';
    let audioHtml = msg.audio ? `<audio src="${msg.audio}" controls preload="auto" style="width:100%;height:35px;margin:15px 0;border-radius:8px;" class="${isPremiere ? 'audio-premiere audio-invite' : ''}"></audio>` : '';
    if (msg.audio2) audioHtml += `<audio src="${msg.audio2}" controls preload="auto" style="width:100%;height:35px;margin:5px 0 15px 0;border-radius:8px;"></audio>`;

    const titreEnc = encodeTexte(titre);
    const texteEnc = encodeTexte(texteOriginal);
    const cardId = 'card-' + msg.id;

    const boutonsLecture = msg.audio ? `
        <div class="lecture-controls">
            <button class="btn-boucle" id="btn-boucle-${msg.id}" onclick="toggleBoucle('${cardId}', ${msg.id})" data-tip="Répéter ce message">🔁</button>
            <button class="btn-continue" id="btn-continue-${msg.id}" onclick="toggleLectureContinue('${cardId}', ${msg.id})" data-tip="Lecture enchaînée">⏭</button>
            <button class="btn-scroll" id="btn-scroll-${msg.id}" onclick="toggleScrollSync('${cardId}', ${msg.id})" data-tip="Défiler avec l'audio">📜</button>
        </div>` : '';

    return `<div class="message-card" id="${cardId}">${imgHtml}<span style="font-size:0.7em;color:#d4af37;font-weight:900;text-transform:uppercase;">${categorie}</span><h3 class="msg-title">${titre}</h3>${audioHtml}${boutonsLecture}<div class="msg-content">${texteFormate}</div><button class="copy-btn" onclick="ouvrirMenuPartage('${titreEnc}','${texteEnc}')">${translations[currentLang].shareBtn}</button><span class="published-date">${translations[currentLang].published} ${dateAffichee}</span></div>`;
}

function demarrerScrollSync(card, audio) {
    arreterScrollSync();
    // Ne pas démarrer si le bouton scroll est désactivé pour cette carte
    const cardId = card.id;
    const msgId = cardId.replace('card-', '');
    const btnScroll = document.getElementById('btn-scroll-' + msgId);
    if (btnScroll && !btnScroll.classList.contains('actif')) return;

    scrollCard = card;
    scrollAudio = audio;
    const contenu = card.querySelector('.msg-content');
    if (!contenu) return;

    function boucle() {
        if (!scrollAudio || scrollAudio.paused || scrollAudio.ended) return;
        const dur = scrollAudio.duration;
        if (!dur || isNaN(dur)) { scrollRAF = requestAnimationFrame(boucle); return; }
        const scrollable = contenu.scrollHeight - contenu.clientHeight;
        if (scrollable <= 0) return;
        contenu.scrollTop = (scrollAudio.currentTime / dur) * scrollable;
        scrollRAF = requestAnimationFrame(boucle);
    }

    card.classList.add('scroll-actif');
    audio.addEventListener('seeked', () => {
        if (audio.currentTime < 1) contenu.scrollTop = 0;
    });
    scrollRAF = requestAnimationFrame(boucle);
}

function toggleScrollSync(cardId, msgId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const audio = card.querySelector('audio');
    const btnScroll = document.getElementById('btn-scroll-' + msgId);
    const estActif = btnScroll.classList.contains('actif');
    if (estActif) {
        btnScroll.classList.remove('actif');
        arreterScrollSync();
    } else {
        btnScroll.classList.add('actif');
        // Si un audio est en cours, calculer la position actuelle et démarrer
        if (audio && !audio.paused && !audio.ended) {
            demarrerScrollSync(card, audio);
        }
    }
}

async function activerWakeLock() {
    if ('wakeLock' in navigator) {
        try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
    }
}

function libererWakeLock() {
    if (wakeLock) { wakeLock.release(); wakeLock = null; }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const audios = document.querySelectorAll('audio');
        const enCours = [...audios].some(a => !a.paused);
        if (enCours) activerWakeLock(); else libererWakeLock();
    }
});

function attacherWakeLockAudio(audio) {
    audio.addEventListener('play', activerWakeLock);
    audio.addEventListener('pause', libererWakeLock);
    audio.addEventListener('ended', libererWakeLock);
}

const _wakeLockObserver = new MutationObserver(mutations => {
    for (const m of mutations)
        for (const node of m.addedNodes)
            if (node.nodeName === 'AUDIO') attacherWakeLockAudio(node);
            else if (node.querySelectorAll) node.querySelectorAll('audio').forEach(attacherWakeLockAudio);
});
_wakeLockObserver.observe(document.body, { childList: true, subtree: true });

function arreterScrollSync() {
    if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
    if (scrollCard) { scrollCard.classList.remove('scroll-actif'); scrollCard = null; }
    scrollAudio = null;
}

function toggleBoucle(cardId, msgId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const audio = card.querySelector('audio');
    if (!audio) return;
    const btnBoucle = document.getElementById('btn-boucle-' + msgId);
    const btnContinue = document.getElementById('btn-continue-' + msgId);
    const estActif = btnBoucle.classList.contains('actif');
    if (estActif) {
        audio.loop = false;
        btnBoucle.classList.remove('actif');
        arreterScrollSync();
    } else {
        if (btnContinue.classList.contains('actif')) arreterLectureContinue();
        audio.loop = true;
        btnBoucle.classList.add('actif');
        audio.play().catch(() => {});
        activerWakeLock();
        audio.addEventListener('pause', () => { arreterScrollSync(); libererWakeLock(); }, { once: true });
        demarrerScrollSync(card, audio);
    }
}

function toggleLectureContinue(cardId, msgId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const audio = card.querySelector('audio');
    if (!audio) return;
    const btnContinue = document.getElementById('btn-continue-' + msgId);
    const btnBoucle = document.getElementById('btn-boucle-' + msgId);
    const estActif = btnContinue.classList.contains('actif');
    if (estActif) {
        arreterLectureContinue();
    } else {
        if (btnBoucle.classList.contains('actif')) {
            audio.loop = false;
            btnBoucle.classList.remove('actif');
        }
        lectureContineActive = true;
        btnContinue.classList.add('actif');
        const idsFlux = [...document.querySelectorAll('#flux-messages .message-card')].map(c => parseInt(c.id.replace('card-', '')));
        const sorted = [...tousLesMessages].sort((a, b) => {
            if (a.categorie < b.categorie) return -1;
            if (a.categorie > b.categorie) return 1;
            return a.id - b.id;
        });
        archivePlaylist = sorted.filter(m => !idsFlux.includes(m.id)).map(m => m.id);
        archivePlayIndex = -1;
        archiveContext = { type: 'chrono', val: 0 };
        audio.addEventListener('ended', surFinAudio, { once: true });
        audio.play().catch(() => {});
        activerWakeLock();
        demarrerScrollSync(card, audio);
    }
}

function surFinAudio() {
    if (!lectureContineActive) return;

    // Mode archive
    if (archivePlaylist.length > 0 && archivePlayIndex >= 0) {
        let nextIndex = archivePlayIndex + 1;
        while (nextIndex < archivePlaylist.length) {
            const nextMsg = tousLesMessages.find(m => m.id === archivePlaylist[nextIndex]);
            if (nextMsg && nextMsg.audio) break;
            nextIndex++;
        }
        if (nextIndex >= archivePlaylist.length) { arreterLectureContinue(); return; }
        archivePlayIndex = nextIndex;
        const nextMsg = tousLesMessages.find(m => m.id === archivePlaylist[nextIndex]);
        const { type, val } = archiveContext;
        const btnRetour = type === 'chrono'
            ? `<button class="archive-main-btn" onclick="revenirChrono(${val})">${translations[currentLang].backList}</button>`
            : `<button class="archive-main-btn" onclick="revenirTheme('${val.replace(/'/g, "\\'")}')">${translations[currentLang].backList}</button>`;
        document.getElementById('message-detail').innerHTML = creerCard(nextMsg) + btnRetour;
        // Ouvrir la section archives si elle est fermée
        document.getElementById('archiveSection').style.display = 'block';
        scrollTransition = true;
        document.getElementById('message-detail').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => { scrollTransition = false; }, 1000);
        const audio = document.getElementById('card-' + nextMsg.id)?.querySelector('audio');
        if (audio) {
            const btn = document.getElementById('btn-continue-' + nextMsg.id);
            if (btn) btn.classList.add('actif');
            const btnScroll = document.getElementById('btn-scroll-' + nextMsg.id);
            if (btnScroll) btnScroll.classList.add('actif');
            audio.addEventListener('ended', surFinAudio, { once: true });
            audio.play().catch(() => {});
            activerWakeLock();
            const nextCard = document.getElementById('card-' + nextMsg.id);
            if (nextCard) demarrerScrollSync(nextCard, audio);
        }
        return;
    }

    // Mode flux accueil
    const container = document.getElementById('flux-messages');
    const cards = Array.from(container.querySelectorAll('.message-card'));
    if (cards.length < 2) {
        // Plus de carte suivante dans le flux, basculer vers la playlist archive
        if (archivePlaylist.length > 0) {
            surFinAudio();
        } else {
            arreterLectureContinue();
        }
        return;
    }

    cards[0].classList.add('card-sortie-haut');
    cards[1].classList.add('card-monte');

    setTimeout(() => {
        cards[0].remove();
        cards[1].classList.remove('card-monte');
        const cardsRestantes = container.querySelectorAll('.message-card');
        let audioSuivant = null;
        for (const c of cardsRestantes) {
            const a = c.querySelector('audio');
            if (a) { audioSuivant = a; break; }
        }
        if (audioSuivant) {
            const cardSuivante = audioSuivant.closest('.message-card');
            scrollTransition = true;
            cardSuivante?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => { scrollTransition = false; }, 1000);
            const msgIdSuivant = cardSuivante?.id?.replace('card-', '');
            if (msgIdSuivant) {
                const btnC = document.getElementById('btn-continue-' + msgIdSuivant);
                if (btnC) btnC.classList.add('actif');
                const btnS = document.getElementById('btn-scroll-' + msgIdSuivant);
                if (btnS) btnS.classList.add('actif');
            }
            audioSuivant.addEventListener('ended', surFinAudio, { once: true });
            audioSuivant.play().catch(() => {});
            activerWakeLock();
            if (cardSuivante) demarrerScrollSync(cardSuivante, audioSuivant);
        } else {
            arreterLectureContinue();
        }
    }, 500);
}

function arreterLectureContinue() {
    lectureContineActive = false;
    archivePlaylist = [];
    archivePlayIndex = -1;
    archiveContext = null;
    arreterScrollSync();
    libererWakeLock();
    document.querySelectorAll('[id^="btn-continue-"]').forEach(b => b.classList.remove('actif'));
    document.querySelectorAll('audio').forEach(a => a.removeEventListener('ended', surFinAudio));
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
    if (type === 'wa') { const w = window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(messageComplet), '_blank'); if (w) w.opener = null; }
    else if (type === 'fb') { const w = window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url), '_blank'); if (w) w.opener = null; }
    else if (type === 'mail') window.location.href = `mailto:?subject=${encodeURIComponent(titrePartageTemp)}&body=${encodeURIComponent(messageComplet)}`;
    else if (type === 'copy') {
        navigator.clipboard.writeText(messageComplet);
        afficherToast(translations[currentLang].copied);
    }
    fermerPartage();
}

function afficherAccueil() {
    arreterLectureContinue();
    const container = document.getElementById('flux-messages');
    const derniers = [...tousLesMessages].sort((a, b) => b.id - a.id).slice(0, 3);
    container.innerHTML = derniers.map((msg, i) => creerCard(msg, i === 0)).join('');
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

let lastScrollY = window.scrollY;
let scrollTransition = false;
window.onscroll = function() {
    document.getElementById("scrollTopLink").style.display = window.scrollY > 400 ? "flex" : "none";
    if (lectureContineActive && !scrollTransition && window.scrollY > lastScrollY + 30) {
        arreterLectureContinue();
        afficherAccueil();
    }
    lastScrollY = window.scrollY;
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
