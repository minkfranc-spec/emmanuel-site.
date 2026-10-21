let currentLang = 'fr';
let tousLesMessages = [];
let searchTimer = null;
let msgPartageTemp = "";
let titrePartageTemp = "";
let idPartageTemp = "";
let lectureContineActive = false;
let archivePlaylist = [];
let archivePlayIndex = -1;
let archiveContext = null;
let scrollRAF = null;
let scrollCard = null;
let scrollAudio = null;
let wakeLock = null;
let communiqueData = null; // stocke les 3 versions du communiqué
const NOTIF_SEEN_KEY = 'emmanuel_notif_seen_v1'; // clé localStorage pour mémoriser la notif vue

// Génère une empreinte courte du communiqué (60 premiers caractères normalisés)
// Si le texte change → empreinte différente → badge "1" réapparaît
function communiqueEmpreinte(texte) {
    return String(texte || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

const CACHE_KEY = 'emmanuel_data_v3';
const CACHE_TTL = 15 * 60 * 1000;
const FAVORITES_KEY = 'emmanuel_favorite_messages_v1';
let messagesFavoris = new Set();

const moisNoms = {
    fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
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
        scrollBottom: "Aller en bas",
        help: "Besoin d'aide ?",
        update: "Le compteur s'actualise toutes les 15 min",
        selectTheme: "Choisir une thématique...",
        contactTitle: "Nous contacter",
        contactSubtitle: "La porte est toujours ouverte.",
        contactWa: "+237 678 356 844",
        contactClose: "Fermer",
        tipBoucle: "Répéter ce message",
        tipContinue: "Lecture enchaînée",
        tipScroll: "Défiler avec l'audio",
        archiveChrono: "📅 Chronologie",
        archiveTheme: "📂 Thématiques",
        shareTitle: "Partager la Parole",
        shareCancel: "Annuler",
        notifTitle: "📢 COMMUNICATIONS",
        notifHide: "Masquer",
        labelNotif: "Notifications",
        labelContact: "Contacts",
        favoriteAdd: "J'aime",
        favoriteRemove: "Retirer des favoris",
        favoritesOpen: "Mes favoris",
        favoritesTitle: "Mes messages favoris",
        favoritesEmpty: "Tu n'as pas encore de message favori.",
        favoritesBack: "⬅ Retour aux favoris",
        favoritesSaveError: "Impossible d'enregistrer les favoris sur cet appareil.",
        tousBtn: "Tout afficher",
        reduireBtn: "Réduire"
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
        scrollBottom: "Go to bottom",
        help: "Need help?",
        update: "The counter updates every 15 min",
        selectTheme: "Choose a theme...",
        contactTitle: "Contact us",
        contactSubtitle: "The door is always open.",
        contactWa: "+237 678 356 844",
        contactClose: "Close",
        tipBoucle: "Repeat this message",
        tipContinue: "Chained playback",
        tipScroll: "Scroll with audio",
        archiveChrono: "📅 Chronology",
        archiveTheme: "📂 Themes",
        shareTitle: "Share the Word",
        shareCancel: "Cancel",
        notifTitle: "📢 COMMUNICATIONS",
        notifHide: "Hide",
        labelNotif: "Notifications",
        labelContact: "Contacts",
        favoriteAdd: "Like",
        favoriteRemove: "Remove from favorites",
        favoritesOpen: "My favorites",
        favoritesTitle: "My favorite messages",
        favoritesEmpty: "You don't have any favorite messages yet.",
        favoritesBack: "⬅ Back to favorites",
        favoritesSaveError: "Favorites could not be saved on this device.",
        tousBtn: "Show all",
        reduireBtn: "Reduce"
    },
    es: {
        welcome: "Bienvenido a EMMANUEL",
        intro: "La Luz que ilumina cada paso en el camino de la Vida.",
        searchPlaceholder: "Buscar un mensaje...",
        archiveBtn: "📂 Consultar Archivos",
        archiveBtnClose: "❌ Cerrar Archivos",
        shareBtn: "📤 Compartir",
        copied: "✨ ¡Enlace copiado!",
        published: "Publicado el",
        statTitle: "COMUNIDAD EMMANUEL",
        statSub: "✨ Lectores por país y vistas ✨",
        backList: "⬅ Volver",
        scrollTop: "Volver arriba",
        scrollBottom: "Ir abajo",
        help: "¿Necesitas ayuda?",
        update: "El contador se actualiza cada 15 min",
        selectTheme: "Elegir un tema...",
        contactTitle: "Contáctenos",
        contactSubtitle: "La puerta siempre está abierta.",
        contactWa: "+237 678 356 844",
        contactClose: "Cerrar",
        tipBoucle: "Repetir este mensaje",
        tipContinue: "Reproducción encadenada",
        tipScroll: "Desplazar con el audio",
        archiveChrono: "📅 Cronología",
        archiveTheme: "📂 Temáticas",
        shareTitle: "Compartir la Palabra",
        shareCancel: "Cancelar",
        notifTitle: "📢 COMUNICACIONES",
        notifHide: "Ocultar",
        labelNotif: "Notificaciones",
        labelContact: "Contactos",
        favoriteAdd: "Me gusta",
        favoriteRemove: "Quitar de favoritos",
        favoritesOpen: "Mis favoritos",
        favoritesTitle: "Mis mensajes favoritos",
        favoritesEmpty: "Todavía no tienes mensajes favoritos.",
        favoritesBack: "⬅ Volver a favoritos",
        favoritesSaveError: "No se pudieron guardar los favoritos en este dispositivo.",
        tousBtn: "Ver todos",
        reduireBtn: "Reducir"
    }
};

function t(msg, champ) {
    if (currentLang === 'en' && msg[champ + '_en']) return msg[champ + '_en'];
    return msg[champ];
}

// Cache des traductions espagnoles en mémoire
const esCache = {};

async function traduireES(texte, cacheKey) {
    if (!texte) return '';
    if (esCache[cacheKey]) return esCache[cacheKey];
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=es&dt=t&q=${encodeURIComponent(texte)}`;
        const res = await fetch(url);
        const data = await res.json();
        const traduit = data[0].map(chunk => chunk[0]).join('');
        esCache[cacheKey] = traduit;
        return traduit;
    } catch (e) {
        return texte; // En cas d'erreur, on retourne le texte original
    }
}

async function tES(msg, champ) {
    const source = msg[champ + '_en'] || msg[champ];
    const cacheKey = `${msg.id}_${champ}`;
    return await traduireES(source, cacheKey);
}

function encodeTexte(str) { return encodeURIComponent(str); }
function decodeTexte(str) { return decodeURIComponent(str); }

function afficherToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function chargerFavoris() {
    try {
        const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        if (!Array.isArray(saved)) throw new Error('Le format des favoris enregistrés est invalide.');
        messagesFavoris = new Set(saved.filter(Number.isSafeInteger));
    } catch (err) {
        console.error("Erreur lors du chargement des favoris:", err);
        messagesFavoris = new Set();
    }
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
            // Stocker les 3 versions en mémoire
            communiqueData = {
                fr: data.communique,
                en: data.communique_en || data.communique,
                es: data.communique_es || data.communique
            };
            const bubble = document.getElementById('notif-bubble');
            bubble.style.display = 'flex';
            // Remet les icônes à leur position normale (bulle visible)
            document.body.classList.remove('notif-masquee');
            // Vérifie si ce communiqué a déjà été vu (mémorisé dans le localStorage)
            const dejavu = localStorage.getItem(NOTIF_SEEN_KEY);
            if (dejavu === communiqueEmpreinte(data.communique)) {
                // Même communiqué → pas de badge, icône visible mais discrète
                bubble.innerHTML = '<span style="color:white; font-size:18px;">🔔</span>';
            } else {
                // Nouveau communiqué → badge "1" visible
                bubble.innerHTML = '<span style="color:white; font-size:18px;">🔔</span><div class="notif-badge">1</div>';
            }
            afficherCommunique();
        }

        if (data.status === "standby") {
            document.body.innerHTML = `<div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#1a1a1a; color:#d4af37; text-align:center; padding:20px;"><h1 style="color:#d4af37; font-size:3em; font-family:'Montserrat';">🏛️ EMMANUEL</h1><p style="font-family:'Lora'; font-size:1.5em;">Le sanctuaire est momentanément fermé pour maintenance.</p><p style="font-style:italic; opacity:0.7;">La Voix de la Vérité revient bientôt.</p></div>`;
            return;
        }

        const listeBrute = data.messages || [];
        const aujourdhui = new Date().toISOString().split('T')[0];
        tousLesMessages = listeBrute.filter(msg => msg.date <= aujourdhui);

        const syslang = (navigator.language || navigator.userLanguage || 'fr').toLowerCase();
        const lang = syslang.startsWith('en') ? 'en' : syslang.startsWith('es') ? 'es' : 'fr';
        setLanguage(lang);
        genererBoutonsThemes();

        // Ouvrir directement un message si l'URL contient un hash #id
        const hash = window.location.hash.replace('#', '').trim();
        if (hash) {
            const msgCible = tousLesMessages.find(m => String(m.id) === hash);
            if (msgCible) {
                const container = document.getElementById('flux-messages');
                container.innerHTML = creerCard(msgCible, true);
                setTimeout(() => {
                    const card = document.getElementById('card-' + msgCible.id);
                    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 400);
            }
        }

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
    document.getElementById('btn-es').classList.toggle('active', lang === 'es');
    document.getElementById('welcome-txt').innerText = translations[lang].welcome;
    document.getElementById('intro-txt').innerText = translations[lang].intro;
    document.getElementById('stat-title').innerText = translations[lang].statTitle;
    document.getElementById('stat-sub').innerText = translations[lang].statSub;
    document.getElementById('label-top').innerText = translations[lang].scrollTop;
    document.getElementById('label-bottom').innerText = translations[lang].scrollBottom;
    document.getElementById('update-txt').innerHTML = translations[lang].update;
    document.getElementById('searchInput').placeholder = translations[lang].searchPlaceholder;
    document.getElementById('btn-archive').innerText = translations[lang].archiveBtn;
    document.getElementById('contact-title').innerText = translations[lang].contactTitle;
    document.getElementById('contact-subtitle').innerText = translations[lang].contactSubtitle;
    document.getElementById('contact-wa-label').innerText = translations[lang].contactWa;
    document.getElementById('contact-close-btn').innerText = translations[lang].contactClose;
    // Boutons navigation archives
    document.getElementById('nav-chrono').innerText = translations[lang].archiveChrono;
    document.getElementById('nav-theme').innerText = translations[lang].archiveTheme;
    // Modal partage
    document.getElementById('share-modal-title').innerText = translations[lang].shareTitle;
    document.getElementById('share-cancel-btn').innerText = translations[lang].shareCancel;
    // Panneau notifications
    document.getElementById('notif-title').innerText = translations[lang].notifTitle;
    document.getElementById('notif-hide-btn').innerText = translations[lang].notifHide;
    document.getElementById('label-notif').innerText = translations[lang].labelNotif;
    document.getElementById('label-contact').innerText = translations[lang].labelContact;
    document.getElementById('label-favorites').innerText = translations[lang].favoritesOpen;
    // Mettre à jour le label du bouton "Tout afficher" selon la langue
    document.getElementById('label-tous').innerText = affichageTousActif ? translations[lang].reduireBtn : translations[lang].tousBtn;
    // Mettre à jour le communiqué selon la langue
    if (communiqueData) afficherCommunique();
    document.getElementById('favorites-title').innerText = translations[lang].favoritesTitle;
    mettreAJourBoutonsFavoris();
    afficherAccueil();
    genererBoutonsMois();
}

function afficherCommunique() {
    const texte = communiqueData[currentLang] || communiqueData.fr;
    document.getElementById('notif-list').innerHTML = `
        <div class="notif-item">${texte}</div>`;
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

function ouvrirNotif() {
    const panel = document.getElementById('notif-panel');
    panel.style.display = 'flex';
    // Pas de fermeture automatique — l'utilisateur choisit : Masquer ou clic ailleurs
    // Mémorise ce communiqué comme déjà vu → retire le badge "1"
    if (communiqueData) {
        try { localStorage.setItem(NOTIF_SEEN_KEY, communiqueEmpreinte(communiqueData.fr)); } catch {}
        const bubble = document.getElementById('notif-bubble');
        bubble.innerHTML = '<span style="color:white; font-size:18px;">🔔</span>';
    }
}
function fermerPanelSeulement() {
    // Ferme le panneau SANS cacher la bulle (clic ailleurs)
    document.getElementById('notif-panel').style.display = 'none';
}
function toutMasquer() {
    // Ferme panneau ET bulle (bouton "Masquer" uniquement)
    document.getElementById('notif-panel').style.display = 'none';
    document.getElementById('notif-bubble').style.display = 'none';
    // Les icônes du dessous remontent pour combler le vide
    document.body.classList.add('notif-masquee');
}

function mettreAJourBoutonsFavoris() {
    document.querySelectorAll('[data-favorite-id]').forEach(button => {
        const isFavorite = messagesFavoris.has(Number(button.dataset.favoriteId));
        button.classList.toggle('is-favorite', isFavorite);
        button.setAttribute('aria-pressed', String(isFavorite));
        const label = translations[currentLang][isFavorite ? 'favoriteRemove' : 'favoriteAdd'];
        button.setAttribute('aria-label', label);
        button.setAttribute('data-tip', label);
        button.innerHTML = isFavorite ? '❤️' : '🤍';
    });
    document.getElementById('favorites-count').textContent = messagesFavoris.size;
}

function toggleFavori(id) {
    const messageId = Number(id);
    const wasFavorite = messagesFavoris.has(messageId);
    if (wasFavorite) messagesFavoris.delete(messageId);
    else messagesFavoris.add(messageId);

    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...messagesFavoris]));
    } catch (err) {
        if (wasFavorite) messagesFavoris.add(messageId);
        else messagesFavoris.delete(messageId);
        console.error("Erreur lors de l'enregistrement des favoris:", err);
        afficherToast(translations[currentLang].favoritesSaveError);
        mettreAJourBoutonsFavoris();
        return;
    }

    mettreAJourBoutonsFavoris();
}

function afficherFavoris() {
    const section = document.getElementById('favoritesSection');
    const list = document.getElementById('favorites-list');
    document.getElementById('notif-panel').style.display = 'none';
    document.getElementById('favorite-detail').innerHTML = '';
    list.style.display = 'grid';
    list.innerHTML = tousLesMessages
        .filter(msg => messagesFavoris.has(Number(msg.id)))
        .sort((a, b) => b.id - a.id)
        .map(msg => `<button type="button" class="titre-archive-item favorite-item" onclick="ouvrirFavori(${msg.id})">${t(msg, 'titre')}</button>`)
        .join('') || `<div class="favorites-empty">${translations[currentLang].favoritesEmpty}</div>`;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ouvrirFavori(id) {
    const msg = tousLesMessages.find(message => Number(message.id) === Number(id));
    if (!msg) return;
    document.getElementById('favorites-list').style.display = 'none';
    document.getElementById('favorite-detail').innerHTML = `
        ${creerCard(msg)}
        <button type="button" class="archive-main-btn" onclick="revenirAuxFavoris()">${translations[currentLang].favoritesBack}</button>`;
    document.getElementById('favorite-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function revenirAuxFavoris() {
    document.getElementById('favorite-detail').innerHTML = '';
    document.getElementById('favorites-list').style.display = 'grid';
    afficherFavoris();
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
    const idEnc = String(msg.id);
    const cardId = 'card-' + msg.id;
    const favorite = messagesFavoris.has(Number(msg.id));
    const favoriteButton = `<button type="button" class="favorite-toggle${favorite ? ' is-favorite' : ''}" data-favorite-id="${msg.id}" data-tip="${translations[currentLang][favorite ? 'favoriteRemove' : 'favoriteAdd']}" aria-label="${translations[currentLang][favorite ? 'favoriteRemove' : 'favoriteAdd']}" aria-pressed="${favorite}" onclick="toggleFavori(${msg.id})">${favorite ? '❤️' : '🤍'}</button>`;

    const boutonsLecture = msg.audio ? `
        <div class="lecture-controls">
            <button class="btn-boucle" id="btn-boucle-${msg.id}" onclick="toggleBoucle('${cardId}', ${msg.id})" data-tip="${translations[currentLang].tipBoucle}">🔁</button>
            <button class="btn-continue" id="btn-continue-${msg.id}" onclick="toggleLectureContinue('${cardId}', ${msg.id})" data-tip="${translations[currentLang].tipContinue}">⏭</button>
            <button class="btn-scroll" id="btn-scroll-${msg.id}" onclick="toggleScrollSync('${cardId}', ${msg.id})" data-tip="${translations[currentLang].tipScroll}">📜</button>
        </div>` : '';
    const messageActions = `<div class="message-actions">${boutonsLecture}${favoriteButton}</div>`;

    // Pour l'espagnol, on génère d'abord avec le texte FR/EN, puis on traduit en arrière-plan
    if (currentLang === 'es') {
        const html = `<div class="message-card" id="${cardId}">${imgHtml}<span style="font-size:0.7em;color:#d4af37;font-weight:900;text-transform:uppercase;" id="cat-${msg.id}">${categorie}</span><h3 class="msg-title" id="tit-${msg.id}">${titre}</h3>${audioHtml}${messageActions}<div class="msg-content" id="txt-${msg.id}"><span style="color:#aaa;font-style:italic;">Traduciendo... ✨</span></div><button class="copy-btn" data-titre="${titreEnc}" data-texte="${texteEnc}" data-id="${idEnc}">${translations[currentLang].shareBtn}</button><span class="published-date">${translations[currentLang].published} ${dateObj.toLocaleDateString('es-ES')}</span></div>`;
        // Traduction en arrière-plan
        (async () => {
            const [titreTrad, texteTrad, categorieTrad] = await Promise.all([
                tES(msg, 'titre'),
                tES(msg, 'texte'),
                tES(msg, 'categorie')
            ]);
            const elTit = document.getElementById('tit-' + msg.id);
            const elTxt = document.getElementById('txt-' + msg.id);
            const elCat = document.getElementById('cat-' + msg.id);
            if (elTit) elTit.innerHTML = titreTrad;
            if (elCat) elCat.innerHTML = categorieTrad;
            if (elTxt) elTxt.innerHTML = texteTrad.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        })();
        return html;
    }

    return `<div class="message-card" id="${cardId}">${imgHtml}<span style="font-size:0.7em;color:#d4af37;font-weight:900;text-transform:uppercase;">${categorie}</span><h3 class="msg-title">${titre}</h3>${audioHtml}${messageActions}<div class="msg-content">${texteFormate}</div><button class="copy-btn" data-titre="${titreEnc}" data-texte="${texteEnc}" data-id="${idEnc}">${translations[currentLang].shareBtn}</button><span class="published-date">${translations[currentLang].published} ${dateAffichee}</span></div>`;
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
        audio.currentTime = 0;
        audio.load();
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

function ouvrirMenuPartage(titreEnc, texteEnc, id) {
    titrePartageTemp = decodeTexte(titreEnc);
    msgPartageTemp = decodeTexte(texteEnc).replace(/\*\*/g, '');
    idPartageTemp = id || "";
    document.getElementById('modalOverlay').style.display = 'block';
    document.getElementById('shareModal').style.display = 'block';
}

function fermerPartage() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('shareModal').style.display = 'none';
}

function actionPartage(type) {
    const baseUrl = "https://emmanuel-dpv.pages.dev";
    const urlMessage = idPartageTemp ? `${baseUrl}/#${idPartageTemp}` : baseUrl;
    const messageComplet = `${titrePartageTemp}\n\n${msgPartageTemp}\n\nLire la suite : ${urlMessage}`;
    if (type === 'wa') { const w = window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(messageComplet), '_blank'); if (w) w.opener = null; }
    else if (type === 'fb') { const w = window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(urlMessage), '_blank'); if (w) w.opener = null; }
    else if (type === 'mail') window.location.href = `mailto:?subject=${encodeURIComponent(titrePartageTemp)}&body=${encodeURIComponent(messageComplet)}`;
    else if (type === 'copy') {
        navigator.clipboard.writeText(urlMessage);
        afficherToast(translations[currentLang].copied);
    }
    else if (type === 'pdf') { fermerPartage(); telechargerPDF(); return; }
    else if (type === 'image') { fermerPartage(); telechargerImage(); return; }
    fermerPartage();
}

function telechargerPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margeG = 20, margeD = 20, largeur = 210 - margeG - margeD;
    const couleurOr = [212, 175, 55];
    const couleurNoir = [26, 26, 26];
    const couleurGris = [100, 100, 100];

    // Fond blanc
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Bandeau supérieur doré
    doc.setFillColor(...couleurOr);
    doc.rect(0, 0, 210, 18, 'F');

    // Nom de la congrégation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('EMMANUEL — DPV', 105, 11, { align: 'center' });

    // Ligne décorative sous le bandeau
    doc.setDrawColor(...couleurOr);
    doc.setLineWidth(0.5);
    doc.line(margeG, 22, 210 - margeD, 22);

    // Titre du message
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...couleurNoir);
    const lignesTitre = doc.splitTextToSize(titrePartageTemp.toUpperCase(), largeur);
    doc.text(lignesTitre, 105, 34, { align: 'center' });

    // Ligne séparatrice sous le titre
    const hauteurTitre = 34 + lignesTitre.length * 7;
    doc.setDrawColor(...couleurOr);
    doc.setLineWidth(0.3);
    doc.line(margeG, hauteurTitre + 3, 210 - margeD, hauteurTitre + 3);

    // Texte du message
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...couleurNoir);
    const texteNettoye = msgPartageTemp.replace(/\*\*/g, '');
    const lignesTexte = doc.splitTextToSize(texteNettoye, largeur);
    let curseur = hauteurTitre + 12;
    lignesTexte.forEach(ligne => {
        if (curseur > 270) {
            doc.addPage();
            curseur = 20;
        }
        doc.text(ligne, margeG, curseur);
        curseur += 6;
    });

    // Bas de page
    doc.setDrawColor(...couleurOr);
    doc.setLineWidth(0.5);
    doc.line(margeG, 282, 210 - margeD, 282);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...couleurGris);
    doc.text('emmanuel-dpv.pages.dev', 105, 288, { align: 'center' });

    const nomFichier = titrePartageTemp.replace(/[^a-zA-Z0-9\u00C0-\u024F ]/g, '').trim().replace(/\s+/g, '_').slice(0, 50) || 'message';
    doc.save(`${nomFichier}.pdf`);
}

function telechargerImage() {
    // Créer une carte visuelle hors écran
    const carte = document.createElement('div');
    carte.style.cssText = `
        position:fixed; left:-9999px; top:0;
        width:540px; min-height:960px;
        background: linear-gradient(160deg, #1a1a1a 0%, #2d2410 50%, #1a1a1a 100%);
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        padding:60px 40px; box-sizing:border-box; font-family:'Montserrat',sans-serif;
    `;

    carte.innerHTML = `
        <div style="color:#d4af37;font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;margin-bottom:30px;opacity:0.8;">EMMANUEL — DPV</div>
        <div style="width:40px;height:2px;background:#d4af37;margin-bottom:30px;"></div>
        <div style="color:#ffffff;font-size:20px;font-weight:900;text-align:center;text-transform:uppercase;letter-spacing:1px;line-height:1.4;margin-bottom:30px;">${titrePartageTemp}</div>
        <div style="width:40px;height:2px;background:#d4af37;margin-bottom:30px;"></div>
        <div style="color:#e8e8e8;font-size:13px;line-height:1.9;text-align:center;max-width:440px;">${msgPartageTemp.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#d4af37;">$1</strong>').replace(/\n/g, '<br>')}</div>
        <div style="margin-top:40px;color:#d4af37;font-size:10px;letter-spacing:2px;opacity:0.7;">emmanuel-dpv.pages.dev</div>
    `;

    document.body.appendChild(carte);

    html2canvas(carte, { scale: 2, useCORS: true, backgroundColor: null }).then(canvas => {
        document.body.removeChild(carte);
        const lien = document.createElement('a');
        const nomFichier = titrePartageTemp.replace(/[^a-zA-Z0-9\u00C0-\u024F ]/g, '').trim().replace(/\s+/g, '_').slice(0, 50) || 'message';
        lien.download = `${nomFichier}.png`;
        lien.href = canvas.toDataURL('image/png');
        lien.click();
    }).catch(() => {
        afficherToast('Erreur lors de la génération de l\'image.');
    });
}

let affichageTousActif = false;

function toggleAffichageTous() {
    affichageTousActif = !affichageTousActif;
    const btnContainer = document.getElementById('tousLink');
    const label = document.getElementById('label-tous');
    const btnArchive = document.getElementById('btn-archive');
    const archiveSection = document.getElementById('archiveSection');
    const container = document.getElementById('flux-messages');

    if (affichageTousActif) {
        // Activer : afficher tous les messages, cacher les boutons du bas
        btnContainer.classList.add('actif');
        label.textContent = translations[currentLang].reduireBtn || 'Réduire';
        btnArchive.style.display = 'none';
        archiveSection.style.display = 'none';
        const tous = [...tousLesMessages].sort((a, b) => b.id - a.id);
        container.innerHTML = tous.map((msg, i) => creerCard(msg, i === 0)).join('');
    } else {
        // Désactiver : retour à 3 messages, réafficher les boutons du bas
        btnContainer.classList.remove('actif');
        label.textContent = translations[currentLang].tousBtn || 'Tout afficher';
        btnArchive.style.display = '';
        afficherAccueil();
    }

    // Afficher le label puis le masquer automatiquement après 4s (mobile)
    label.style.opacity = '1';
    label.style.transform = 'translateX(0)';
    clearTimeout(window._labelTousTimer);
    window._labelTousTimer = setTimeout(() => {
        label.style.opacity = '0';
        label.style.transform = 'translateX(10px)';
    }, 4000);
}

function flashLabel(labelId) {
    const label = document.getElementById(labelId);
    if (!label) return;
    label.style.opacity = '1';
    label.style.transform = 'translateX(0)';
    clearTimeout(label._flashTimer);
    label._flashTimer = setTimeout(() => {
        label.style.opacity = '0';
        label.style.transform = 'translateX(10px)';
    }, 1500);
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
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const container = document.getElementById('flux-messages');
        if (query === "") { afficherAccueil(); return; }
        const resultats = tousLesMessages.filter(msg => {
            const searchIn = ((msg.titre || "") + (msg.titre_en || "") + (msg.texte || "") + (msg.texte_en || "") + (msg.categorie || "") + (msg.categorie_en || "")).toLowerCase();
            return searchIn.includes(query);
        });
        container.innerHTML = resultats.sort((a, b) => b.id - a.id).map(msg => creerCard(msg)).join('');
    }, 50);
}

let lastScrollY = window.scrollY;
let scrollTransition = false;
window.onscroll = function() {
    const scrollY = window.scrollY;
    const atBottom = (window.innerHeight + scrollY) >= document.body.scrollHeight - 50;
    document.getElementById("scrollTopLink").style.display = scrollY > 400 ? "flex" : "none";
    document.getElementById("tousLink").style.display = scrollY > 400 ? "flex" : "none";
    document.getElementById("scrollBottomLink").style.display = (scrollY > 400 && !atBottom) ? "flex" : "none";
    if (lectureContineActive && !scrollTransition && scrollY > lastScrollY + 30) {
        arreterLectureContinue();
        afficherAccueil();
    }
    lastScrollY = scrollY;
};

document.addEventListener('DOMContentLoaded', () => {
    chargerFavoris();
    chargerMessages();
    document.addEventListener('click', e => {
        const panel = document.getElementById('notif-panel');
        const bubble = document.getElementById('notif-bubble');
        if (panel.style.display === 'flex' && !panel.contains(e.target) && !bubble.contains(e.target)) {
            fermerPanelSeulement(); // ferme le panneau, la bulle reste visible
        }
    });
});

function toggleContact() {
    const panel = document.getElementById('contact-panel');
    const overlay = document.getElementById('contact-overlay');
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    overlay.classList.toggle('open', !isOpen);
}

// Label au survol de la cloche
document.addEventListener('DOMContentLoaded', function() {
    const bubble = document.getElementById('notif-bubble');
    const labelNotif = document.getElementById('label-notif');
    if (bubble && labelNotif) {
        bubble.addEventListener('mouseenter', () => { labelNotif.style.opacity = '1'; labelNotif.style.transform = 'translateX(0)'; });
        bubble.addEventListener('mouseleave', () => { labelNotif.style.opacity = '0'; labelNotif.style.transform = 'translateX(6px)'; });
    }

    // Délégation des clics sur les boutons Partager (data-attributes, robuste avec textes longs)
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.copy-btn');
        if (!btn) return;
        const titreEnc = btn.getAttribute('data-titre');
        const texteEnc = btn.getAttribute('data-texte');
        const id = btn.getAttribute('data-id');
        if (titreEnc && texteEnc) ouvrirMenuPartage(titreEnc, texteEnc, id);
    });

    // Label au survol du bouton "Tout afficher"
    const tousLink = document.getElementById('tousLink');
    const labelTous = document.getElementById('label-tous');
    if (tousLink && labelTous) {
        tousLink.addEventListener('mouseenter', () => { labelTous.style.opacity = '1'; labelTous.style.transform = 'translateX(0)'; });
        tousLink.addEventListener('mouseleave', () => { labelTous.style.opacity = '0'; labelTous.style.transform = 'translateX(10px)'; });
    }
});
