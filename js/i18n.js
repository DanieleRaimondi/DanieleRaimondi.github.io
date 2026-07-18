// js/i18n.js — EN/IT language toggle.
// English is the default and lives in the HTML; this file holds only the
// Italian strings and swaps them in place (originals are cached per element).
// Technical terms, job titles and product names stay in English by design.
(function () {
  const IT = {
    // ─── Sidebar ───────────────────────────────────────────────────────────
    'sidebar.summary': "Senior Data Scientist e AI leader con 10 anni di esperienza nel portare sistemi di Data Science, AI, LLM e GenAI dal prototipo alla produzione. Tech Lead di team cross-funzionali e speaker internazionale, da PyData London al Parlamento Italiano. Profonda competenza in Data Science, sistemi AI e finanza quantitativa. Ex atleta della Nazionale Italiana con una mentalità ad alte prestazioni.",
    'nav.projects': 'Progetti',
    'nav.skills': 'Competenze',
    'nav.consulting': 'Consulenza',
    'nav.contact': 'Contatti',
    'a11y.skip': 'Salta al contenuto',
    'sidebar.location.label': 'Località',
    'sidebar.city': 'Basilea',
    'sidebar.country': 'Svizzera',
    'sidebar.role.label': 'Ruolo Attuale',
    'sidebar.spec.label': 'Specializzazione',

    // ─── Chatbot UI (static parts) ─────────────────────────────────────────
    'chat.status': 'AI Twin • Chiedimi qualsiasi cosa!',
    'chat.clear': 'Cancella',
    'chat.placeholder': 'Chiedimi del mio lavoro, progetti o carriera...',
    'chat.disclaimer': '⚠️ Basato su AI. Può commettere errori. ',

    // ─── Identity ticker ───────────────────────────────────────────────────
    'ticker.llm': 'Sistemi LLM in Produzione',
    'ticker.quant': 'Pensiero Quantitativo',
    'ticker.impact': 'Impatto sul Business',
    'ticker.discipline': 'Disciplina di Esecuzione',
    'ticker.cities': 'Basilea / Milano',

    // ─── Hero ──────────────────────────────────────────────────────────────
    'hero.title.pre': 'Trasformo i dati in ',
    'hero.title.post': '.',
    'hero.sub': 'Dieci anni di Data Science e AI — profondità scientifica e rigore quantitativo.',
    'hero.ask.parliament': '“Raccontami del talk alla Camera dei Deputati”',
    'hero.ask.churn': '“Come hai ridotto il churn su 6M di clienti?”',

    // ─── Highlights ────────────────────────────────────────────────────────
    'hl.subtitle': "Dai palchi internazionali dell'AI alla Nazionale Italiana di atletica — i momenti che definiscono il percorso.",
    'tag.institutions': 'Istituzioni',
    'tag.athletics': 'Atletica · Nazionale',
    'tag.nextstop': 'Prossima Tappa',
    'status.july2026': 'Luglio 2026',
    'hl.camera1.title': 'Camera dei Deputati · Roma',
    'hl.camera1': 'La presentazione di una piattaforma AI per le decisioni di politica pubblica al Parlamento Italiano.',
    'hl.camera2.title': 'Conferenza Stampa · Camera dei Deputati',
    'hl.camera2': "Sul palco della sala stampa del Parlamento, parlando di AI per ricerca e innovazione.",
    'hl.gg.title': 'Golden Gala · Stadio Olimpico, Roma',
    'hl.gg': 'Staffetta 4x400m con la Nazionale Assoluta Italiana in uno dei principali eventi della Diamond League.',
    'hl.pydata': "Sul palco con pipeline LLM su larga scala, per una delle principali community data d'Europa.",
    'hl.eicbcn': "Sistemi AI applicati e sperimentazione orientata all'impatto.",
    'hl.euroscipy24': 'Tracking dei manoscritti rifiutati con Qdrant e Specter2, presentato alla community Python scientifica.',
    'hl.bidigital': 'Modelli di data science per Bitcoin e supporto alle decisioni.',
    'hl.eichou': 'Iniziative AI e innovazione editoriale, presentate negli Stati Uniti.',
    'hl.eicparis': 'Strategia AI e processi data-driven scalabili per le operazioni editoriali.',
    'hl.relay.title': 'La 4x400m Azzurra',
    'hl.relay': 'La formazione azzurra a Roma — la stessa disciplina che oggi porto nella delivery AI.',
    'hl.sds.title': 'Swiss Data Science Conference · Zurigo',
    'hl.sds': 'AI applicata e impatto reale della data science, presentati alla community data svizzera.',
    'hl.krakow': 'Due talk accettati su workflow AI open-source pronti per la produzione.',

    // ─── Feature row (flagship + speaking) ─────────────────────────────────
    'feat.flagship.label': 'Iniziativa di Punta',
    'feat.flagship.desc': 'AI applicata alla finanza quantitativa: modelli, workflow di analisi e sistemi decisionali progettati per investimenti pratici ed esecuzione risk-aware.',
    'feat.speaking.title': 'Palchi internazionali, da PyData al Parlamento',
    'status.delivered': 'Tenuto',
    'city.rome.inline': ' · Roma',
    'city.zurich.inline': ' · Zurigo',
    'city.london.inline': ' · Londra',
    'misc.twotalks': ' · 2 talk',

    // ─── Background ────────────────────────────────────────────────────────
    'bg.title': 'Esperienza',
    'bg.subtitle': 'Percorso professionale in ordine cronologico decrescente.',
    'period.present': '2023 – Oggi',
    'city.basel.inline': ' · Basilea, Svizzera 🇨🇭',
    'city.milan.inline': ' · Milano, Italia 🇮🇹',
    'bg.mdpi': 'Tech Lead del Data Intelligence Team: responsabile di roadmap e delivery di prodotti ML e LLM, tra cui semantic tagging su milioni di record, graph clustering basato su ontologie e pipeline in produzione con Azure OpenAI, Qdrant e Prefect.',
    'bg.esselunga': 'Alla guida della data science in una realtà retail multimiliardaria: +3% di ricavi e margine, churn ridotto del 20% su 6M+ clienti, CLV migliorato del 15% e workflow automatizzati con oltre il 90% di tempo risparmiato.',
    'bg.accenture': 'Consulenza quantitativa per clienti bancari con SPSS, SAS e Python in progetti di trasformazione finance e risk.',
    'bg.fiditalia': 'Modelli statistici per credit risk e scoring, tra cui Machine Learning, Value at Risk, Expected Loss, Loss Given Default ed Exposure at Default.',

    // ─── Education ─────────────────────────────────────────────────────────
    'edu.title': 'Formazione',
    'edu.subtitle': 'Formazione quantitativa tra statistica, economia, finanza e data science moderna.',
    'edu.master.title': 'Master · Data Science',
    'edu.msc.title': 'MSc · Statistica Economica',
    'edu.bsc.title': 'BSc · Statistica',
    'edu.unimib': 'Università di Milano-Bicocca',
    'edu.master.year': '2021 · ML avanzato, NLP e data products',
    'edu.msc.year': '2017 · Mercati finanziari, assicurazioni e risk analytics',
    'edu.bsc.year': '2014 · Modellazione statistica ed econometria',
    'edu.note': "Intanto, in pista: i 400m per l'Italia — Golden Gala 2012 con la Nazionale assoluta, argento agli Europei U23 con la staffetta 4x400.",

    // ─── Beyond Work ───────────────────────────────────────────────────────
    'passions.title': 'Oltre il Lavoro',
    'passions.subtitle': 'Sei aree che definiscono la mia curiosità, energia e crescita nel lungo periodo.',
    'passions.core.label': 'Interesse Principale',
    'passions.core.title': 'Data Science e AI',
    'passions.core': 'Sperimentazione continua su modelli, sistemi LLM e applicazioni AI pratiche con impatto reale.',
    'passions.markets.label': 'Mercati',
    'passions.markets.title': 'Finanza Quantitativa',
    'passions.markets': 'Ricerca su comportamento dei mercati, logiche di portafoglio e investimenti data-driven tra asset tradizionali e digitali.',
    'passions.community.title': 'Speaking e Mentoring',
    'passions.community': 'Condivido lezioni pratiche attraverso conferenze, mentoring e collaborazioni con professionisti e studenti.',
    'passions.discipline.label': 'Disciplina',
    'passions.discipline.title': 'Mentalità da Sport Agonistico',
    'passions.discipline': 'Ex atleta della Nazionale Italiana, focalizzato su costanza, resilienza e performance sotto pressione.',
    'passions.systems.label': 'Sistemi',
    'passions.systems.title': 'Automazione e Produttività',
    'passions.systems': 'Progetto workflow efficienti e processi scalabili per amplificare qualità di esecuzione e output del team.',
    'passions.hobbies.label': 'Hobby',
    'passions.hobbies.title': 'Numismatica, Biliardo, Calcio, Musica',
    'passions.hobbies': 'Interessi personali che mi mantengono creativo ed equilibrato, con un posto speciale per il genere italodance.',

    // ─── Projects ──────────────────────────────────────────────────────────
    'projects.title.a': 'Alcuni ',
    'projects.title.b': 'Progetti',
    'projects.subtitle': 'Una selezione curata di progetti tra machine learning, NLP e AI product engineering.',
    'projects.bitcoin': 'Framework di Data Science per analizzare le dinamiche del mercato Bitcoin, pattern di prezzo e segnali di trading con modelli predittivi.',
    'projects.aitwin': 'Chatbot AI conversazionale basato su tecnologia LLM che agisce da gemello digitale, rispondendo a domande su lavoro, progetti e carriera con architettura RAG e risposte in streaming.',
    'projects.billiard': "Ricostruzione delle traiettorie delle bilie su partite di biliardo e biliardo all'italiana usando computer vision classica: detection basata sul colore, tracking multi-oggetto con Kalman filter e Hungarian assignment, homography per la mappa dall'alto e fisica del rimbalzo sulle sponde.",
    'projects.sentiment': 'Pipeline NLP che aggrega il sentiment da social media e news per individuare inversioni di trend di Bitcoin e supportare le decisioni di trading.',
    'projects.betting': 'Scraping in tempo reale e data pipeline per le quote dei betting exchange e statistiche calcistiche live a supporto di strategie di sports analytics.',
    'projects.music': 'Pipeline end-to-end per embedding musicali handcrafted, classificazione di genere con SHAP e similarity search su un dataset Italodance/Trance.',
    'projects.view': 'Vedi Progetto',
    'projects.private': 'Progetto Privato',

    // ─── Publications ──────────────────────────────────────────────────────
    'nav.publications': 'Pubblicazioni',
    'pub.title.a': 'Le mie ',
    'pub.title.b': 'Pubblicazioni',
    'pub.subtitle': 'Libri e saggi che ho scritto — liberi da leggere online o scaricare.',
    'pub.kicker': "Saggio sull'Intelligenza Artificiale",
    'pub.pages': 'pagine',
    'pub.lang': 'Italiano',
    'pub.aidesc': "Un saggio chiaro e senza tecnicismi sull'intelligenza artificiale, scritto per chi deve prendere decisioni: dirigenti, manager e policymaker. Cos'è davvero l'AI, cosa può e cosa non può fare, e come governarla in modo responsabile.",
    'pub.tag.essay': 'Saggio',
    'pub.read': 'Leggi online',
    'pub.readoverlay': 'Leggi online',
    'pub.comingsoon': 'Prossimamente',
    'pub.download': 'Scarica PDF',
    'pub.newtab': 'Apri in una nuova scheda',
    'pub.close': 'Chiudi',

    // ─── Skills ────────────────────────────────────────────────────────────
    'skills.title.a': 'Competenze ',
    'skills.title.b': 'Tecniche',
    'skills.subtitle': 'Capacità end-to-end dalla ricerca statistica ai sistemi AI production-grade.',
    'skills.quant.title': 'Finanza Quantitativa',
    'skills.quant.etf': 'ETF e Ottimizzazione di Portafoglio',
    'skills.quant.crypto': 'Crypto e Mercati Tradizionali',
    'skills.quant.macro': 'Analisi Macroeconomica',
    'skills.quant.modeling': 'Modellazione Finanziaria',
    'skills.quant.strategy': 'Sviluppo di Strategie di Investimento',

    // ─── Talks ─────────────────────────────────────────────────────────────
    'talks.title.a': 'Talk',
    'talks.title.b': ' & Conferenze',
    'talks.subtitle': 'Sessioni a conferenze, talk su invito ed eventi accademici raggruppati per anno.',
    'talks.featured.tag': 'In Evidenza · Istituzioni',
    'talks.featured.title': 'Camera dei Deputati · Roma — Giugno 2026',
    'talks.featured.desc': 'Il mio intervento al Parlamento Italiano, presentando una piattaforma AI per le decisioni di politica pubblica in ricerca e innovazione (in italiano).',
    'talks.upcoming': '2026 · In Programma',
    'talks.delivered': '2026 · Tenuti',
    'meta.krakow': 'Cracovia, Polonia · Luglio 2026',
    'meta.london': 'Londra, Regno Unito · 2026',
    'meta.rome26': 'Roma, Italia · Giugno 2026',
    'meta.zurich': 'Zurigo, Svizzera · 2026',
    'meta.houston': 'Houston, Stati Uniti · 2025',
    'meta.paris': 'Parigi, Francia · 2025',
    'meta.barcelona': 'Barcellona, Spagna · 2025',
    'meta.szczecin': 'Stettino, Polonia · 2024',
    'meta.biella24': 'Biella, Italia · 2024',
    'meta.biella22': 'Biella, Italia · 2022',
    'meta.milan22': 'Milano, Italia · 2022',
    'meta.castellanza': 'Castellanza, Italia · 2021',
    'meta.milan21': 'Milano, Italia · 2021',
    'talks.euroscipy1': 'Primo talk EuroSciPy accettato nel programma della conferenza 2026.',
    'talks.euroscipy2': 'Secondo talk EuroSciPy accettato, un approfondimento su workflow AI open-source pronti per la produzione.',
    'talks.pydata': 'Talk a PyData London su AI pratica e delivery di data product.',
    'talks.camera': 'Presentazione di una piattaforma AI a supporto delle decisioni di politica pubblica in ricerca e innovazione, in una conferenza stampa della Camera dei Deputati.',
    'talks.sds': 'Sessione su invito dedicata ad AI applicata e impatto reale della data science.',
    'talks.eichou': "Speaker su iniziative AI e innovazione editoriale all'EIC Summit di MDPI.",
    'talks.eicparis': 'Talk su strategia AI, operazioni editoriali e processi data-driven scalabili.',
    'talks.eicbcn': "Sessione su sistemi AI applicati e sperimentazione orientata all'impatto.",
    'talks.euroscipy24': 'Talk sul tracking dei manoscritti rifiutati con Qdrant e Specter2.',
    'talks.bidigital': 'Sessione su modelli di data science per Bitcoin e supporto alle decisioni.',
    'talks.pbg1': 'Sessione community su Python, data pipeline e workflow di engineering pratici.',
    'talks.pbg2': 'Secondo talk su sperimentazione AI e mentalità production per sviluppatori Python.',
    'talks.cattolica22': 'Talk su invito sui percorsi di carriera da data analyst e data scientist.',
    'talks.liuc': 'Talk su applicazioni di dati e analytics per studenti di business e ingegneria.',
    'talks.cattolica21.title': 'Università Cattolica · Progetti con Studenti',
    'talks.cattolica21': 'Progetti industriali con laureandi, focalizzati su analytics e problem solving.',
    'talks.joinrs.title': 'Intervista Joinrs',
    'talks.joinrs': 'Intervista sul mio percorso da Data Scientist in Esselunga.',
    'link.talkpage': 'Pagina del Talk',
    'link.video': 'Video',
    'link.press.freccia': 'Stampa · La Freccia',
    'link.press.opinione': 'Stampa · Opinione',
    'link.eventpage': 'Pagina Evento',
    'link.interview': 'Intervista',
    'link.mdpinews': 'News MDPI',

    // ─── Sport ─────────────────────────────────────────────────────────────
    'sport.title.a': 'Traguardi ',
    'sport.title.b': 'Sportivi',
    'sport.subtitle': 'Tappe sportive dei miei anni con le staffette 4x400m della Nazionale Italiana.',
    'sport.gg.title': 'Golden Gala 2012 · Nazionale Assoluta Italiana',
    'sport.gg.meta': 'Roma, Italia · 2012',
    'sport.gg.desc': 'Convocato per la staffetta 4x400m al Golden Gala di Roma, in gara con la Nazionale Assoluta Italiana in uno dei principali eventi europei di atletica.',
    'sport.u23.title': 'Campionati Europei U23 · Nazionale Italiana',
    'sport.u23.meta': 'Tampere, Finlandia · 2013',
    'sport.u23.desc': 'Membro della staffetta italiana 4x400m ai Campionati Europei U23 di Tampere, dove abbiamo chiuso secondi in Europa.',
    'link.racevideo': 'Video Gara',

    // ─── Consulting ────────────────────────────────────────────────────────
    'consulting.badge': 'Disponibile per collaborazioni selezionate',
    // EN reads "AI Consulting" (accent on "Consulting"); IT flips the word
    // order so the accent lands on "AI": "Consulenza AI"
    'consulting.title.a': 'Consulenza ',
    'consulting.title.b': 'AI',
    'consulting.subtitle': "Aiuto le aziende a trasformare le ambizioni AI in sistemi funzionanti — la stessa esperienza su LLM, GenAI e data science che applico ogni giorno in produzione, a disposizione del tuo team.",
    'consulting.strategy.title': 'Strategia AI & Advisory',
    'consulting.strategy.desc': 'Quali use case vale la pena costruire, quali comprare e quali evitare. Roadmap, analisi di fattibilità e risposte oneste prima di impegnare il budget.',
    'consulting.strategy.tag1': 'Triage degli use case',
    'consulting.llm.title': 'Sistemi LLM & GenAI',
    'consulting.llm.desc': "Progettazione e delivery hands-on di pipeline LLM, RAG e sistemi agentici — con l'evaluation e il monitoring che li rendono production-grade.",
    'consulting.llm.tag3': 'Evals & Monitoring',
    'consulting.training.title': 'Workshop & Formazione',
    'consulting.training.desc': 'Dalle sessioni per executive ai corsi hands-on per i team di ingegneria — lo stesso materiale che porto sui palchi internazionali, adattato al tuo contesto.',
    'consulting.training.tag1': 'Briefing executive',
    'consulting.training.tag2': 'Lab hands-on',
    'consulting.quant.title': 'Data Science & Modelli Quant',
    'consulting.quant.desc': "Forecasting, modellazione statistica e sistemi di finanza quantitativa, end to end: dall'inquadramento del problema a modelli che il tuo team può mantenere.",
    'consulting.quant.tag2': 'Statistica',
    'consulting.how.title': 'Come funziona una collaborazione',
    'consulting.step1.title': 'Call conoscitiva',
    'consulting.step1.desc': "Una conversazione gratuita di 30 minuti per capire il problema — e dirti onestamente se l'AI è la risposta giusta.",
    'consulting.step2.title': 'Proposta su misura',
    'consulting.step2.desc': 'Un piano chiaro: deliverable, tempi e costi. Nessun incarico a tempo indeterminato, nessuna sorpresa.',
    'consulting.step3.title': 'Delivery & Handover',
    'consulting.step3.desc': 'Sprint mirati o advisory continuativa, con knowledge transfer integrato perché il tuo team resti autonomo.',
    'consulting.nda': 'Riservatezza di default — le collaborazioni sono coperte da NDA e i nomi dei clienti non vengono mai pubblicati. Posso raccontarti approccio e risultati di persona, e le referenze sono disponibili su richiesta.',
    'consulting.cta.title': 'Hai un progetto in mente?',
    'consulting.cta.desc': "Racconta al mio AI Twin a cosa stai lavorando — conosce il mio background e può dirti subito se c'è un fit. Oppure contattami direttamente.",
    'consulting.cta.chat': 'Chiedi al mio AI Twin',
    'consulting.cta.email': 'Scrivimi',

    // ─── Contact ───────────────────────────────────────────────────────────
    'contact.title.a': 'Mettiamoci in ',
    'contact.title.b': 'Contatto',
    'contact.subtitle': 'Per consulenze, speaking o anche solo per parlare di dati e AI — la mia inbox è aperta.',
    'contact.ai.label': 'Risposta immediata',
    'contact.ai.title': 'Chiedi al mio AI Twin',
    'contact.ai.desc': 'Risposte immediate sul mio lavoro, 24/7',
    'contact.email.desc': 'Per proposte e richieste',
    'contact.linkedin.desc': 'Connettiamoci',

    // ─── Footer ────────────────────────────────────────────────────────────
    'footer.location': 'Basilea, Svizzera 🇨🇭'
  };

  const META_IT = {
    title: 'Daniele Raimondi | Senior Data Scientist & Consulente AI a Basilea',
    description: 'Senior Data Scientist e AI Tech Lead a Basilea. Sistemi LLM, GenAI, agentic AI e finanza quantitativa in produzione. Consulenza AI per aziende. Speaker internazionale: PyData London, EuroSciPy, Swiss Data Science Conference, Parlamento Italiano.'
  };

  const ROTATOR_IT = ['intelligenza', 'decisioni', 'visione', 'alpha'];

  // Original English content, cached per element on first swap
  const enText = new WeakMap();
  const enPlaceholder = new WeakMap();
  let metaEn = null;

  function currentLang() {
    return localStorage.getItem('site_lang') === 'it' ? 'it' : 'en';
  }

  function applyLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (!(key in IT)) return;
      if (!enText.has(el)) enText.set(el, el.textContent);
      el.textContent = lang === 'it' ? IT[key] : enText.get(el);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (!(key in IT)) return;
      if (!enPlaceholder.has(el)) enPlaceholder.set(el, el.getAttribute('placeholder'));
      el.setAttribute('placeholder', lang === 'it' ? IT[key] : enPlaceholder.get(el));
    });

    // <title> + meta description + <html lang>
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaEn) metaEn = { title: document.title, description: metaDesc ? metaDesc.content : '' };
    document.title = lang === 'it' ? META_IT.title : metaEn.title;
    if (metaDesc) metaDesc.content = lang === 'it' ? META_IT.description : metaEn.description;
    document.documentElement.lang = lang;

    // Hero rotating word: the inline rotator script reads this global each tick
    window.__heroRotatorWords = lang === 'it' ? ROTATOR_IT : null;
    const rotator = document.getElementById('hero-rotator');
    if (rotator) rotator.textContent = lang === 'it' ? ROTATOR_IT[0] : 'intelligence';

    // Toggle UI state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    // Let dynamic components (chatbot) react
    window.dispatchEvent(new CustomEvent('sitelang-changed', { detail: { lang } }));
  }

  function setLang(lang) {
    localStorage.setItem('site_lang', lang);
    applyLang(lang);
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lang !== currentLang()) setLang(btn.dataset.lang);
    });
  });

  // Default is English (the HTML itself); only apply on load if Italian was chosen
  if (currentLang() === 'it') applyLang('it');
})();
