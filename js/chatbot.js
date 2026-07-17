// js/chatbot.js
(function() {
  const API_URL = 'https://ai-twin-backend.vercel.app/api/chat';
  let conversationHistory = [];
  let sessionId = null;
  let isProcessing = false;
  let currentAbortController = null;
  let retryTimeout = null;

  // ─── Markdown renderer (safe, DOM-based — no innerHTML with user content) ───

  function renderMarkdown(text) {
    const fragment = document.createDocumentFragment();
    const lines = text.split('\n');
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) fragment.appendChild(document.createElement('br'));
      const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(line.slice(lastIndex, match.index)));
        }
        if (match[2] !== undefined) {
          const el = document.createElement('strong');
          el.textContent = match[2];
          fragment.appendChild(el);
        } else if (match[3] !== undefined) {
          const el = document.createElement('em');
          el.textContent = match[3];
          fragment.appendChild(el);
        } else if (match[4] !== undefined) {
          const el = document.createElement('code');
          el.className = 'inline-code';
          el.textContent = match[4];
          fragment.appendChild(el);
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        fragment.appendChild(document.createTextNode(line.slice(lastIndex)));
      }
    });
    return fragment;
  }

  // ─── Auto-resize textarea ──────────────────────────────────────────────────

  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  const SUGGESTED_QUESTIONS = {
    en: [
      "What's your experience in AI and Data Science?",
      "Tell me about your talk at the Italian Parliament",
      "How did you build a taxonomy of 115,000 scientific concepts?"
    ],
    it: [
      "Qual è la tua esperienza in AI e Data Science?",
      "Raccontami del tuo intervento alla Camera dei Deputati",
      "Come hai costruito una tassonomia di 115.000 concetti scientifici?"
    ]
  };

  // All questions map directly to the backend knowledge base (data/*.txt)
  const FOLLOWUP_QUESTIONS = {
    en: [
      "Tell me about your talk at the Italian Parliament",
      "How did you build a taxonomy of 115,000 scientific concepts?",
      "How did you cut churn by 20% on 6 million customers?",
      "Which conferences are you speaking at in 2026?",
      "What was it like racing for the Italian national team?",
      "What do you do in quantitative finance?",
      "How does this AI Twin chatbot work?",
      "Is it true you produced Italodance music?",
      "Why did you move from Milan to Basel?",
      "What's the project you're most proud of?"
    ],
    it: [
      "Raccontami del tuo intervento alla Camera dei Deputati",
      "Come hai costruito una tassonomia di 115.000 concetti scientifici?",
      "Come hai ridotto il churn del 20% su 6 milioni di clienti?",
      "A quali conferenze parli nel 2026?",
      "Com'era gareggiare per la nazionale italiana?",
      "Di cosa ti occupi in finanza quantitativa?",
      "Come funziona questo chatbot AI Twin?",
      "È vero che producevi musica italodance?",
      "Perché ti sei trasferito da Milano a Basilea?",
      "Qual è il progetto di cui vai più fiero?"
    ]
  };
  const usedFollowups = new Set();
  let ctaShownThisLoad = false;

  const AVATARS = {
    assistant: 'assets/profile2.jpeg',
    user: 'assets/user-avatar.svg'
  };

  // Site-wide language chosen via the EN/IT flag toggle (js/i18n.js)
  function siteLang() {
    return localStorage.getItem('site_lang') === 'it' ? 'it' : 'en';
  }

  function welcomeMessage() {
    return siteLang() === 'it'
      ? "Ciao! Sono il gemello AI di Daniele. Chiedimi del mio lavoro in AI e Data Science, del mio intervento alla Camera dei Deputati o dei miei anni in Nazionale di atletica! (You can also write in English!)"
      : "Hi! I'm Daniele's AI twin. Ask me about my work in AI and Data Science, my talk at the Italian Parliament, or my time on the Italian national track team! (Puoi scrivermi anche in italiano!)";
  }

  function initChatbot() {
    sessionId = localStorage.getItem('chatbot_sessionId');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('chatbot_sessionId', sessionId);
    }

    const savedHistory = localStorage.getItem('chatbot_history');
    if (savedHistory) {
      try {
        conversationHistory = JSON.parse(savedHistory);
        conversationHistory.forEach(msg => {
          if (msg.role !== 'system') addMessage(msg.role, msg.content);
        });
      } catch (e) {
        conversationHistory = [];
      }
    }
    
    if (conversationHistory.length === 0) {
      addMessage('assistant', welcomeMessage());
      renderSuggestedQuestions();
    }

    document.getElementById('chat-send').addEventListener('click', () => handleSendClick());
    document.getElementById('chat-clear').addEventListener('click', clearConversation);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendClick();
      }
    });

    const chatInputEl = document.getElementById('chat-input');
    chatInputEl.addEventListener('input', () => autoResizeTextarea(chatInputEl));

    const minimizeBtn = document.getElementById('chat-minimize');
    const chatContainer = document.querySelector('.chat-container');
    const chatHeader = document.querySelector('.chat-header');
    
    if (minimizeBtn && chatContainer && chatHeader) {
      const storedMinimized = localStorage.getItem('chatbot_minimized');
      // First visit: start minimized so content stays visible — the proactive
      // teaser (8s) is what invites people in, not an open panel over the page
      let isMinimized = storedMinimized === null
        ? true
        : storedMinimized === 'true';
      if (isMinimized) {
        chatContainer.classList.add('minimized');
        minimizeBtn.textContent = '□';
        minimizeBtn.setAttribute('aria-label', 'Maximize chat');
        minimizeBtn.title = 'Maximize';
      }
      
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMinimize();
      });
      
      chatHeader.addEventListener('click', (e) => {
        if (chatContainer.classList.contains('minimized') && e.target.closest('.chat-header')) {
          toggleMinimize();
        }
      });
      
      function toggleMinimize() {
        const isCurrentlyMinimized = chatContainer.classList.toggle('minimized');
        minimizeBtn.textContent = isCurrentlyMinimized ? '□' : '−';
        minimizeBtn.setAttribute('aria-label', isCurrentlyMinimized ? 'Maximize chat' : 'Minimize chat');
        minimizeBtn.title = isCurrentlyMinimized ? 'Maximize' : 'Minimize';
        localStorage.setItem('chatbot_minimized', isCurrentlyMinimized);
        // Re-arm the teaser whenever the chat gets minimized
        if (isCurrentlyMinimized) scheduleTeaser(8000);
      }

      const getTeasers = () => siteLang() === 'it' ? [
        '👋 Chiedimi del mio intervento alla Camera dei Deputati',
        '👋 Chiedimi della tassonomia da 115.000 concetti scientifici',
        '👋 Chiedimi della Nazionale di atletica'
      ] : [
        '👋 Ask me about my talk at the Italian Parliament',
        '👋 Ask me about the 115,000-concept scientific taxonomy',
        '👋 Ask me about racing for the Italian national team'
      ];

      // Proactive teaser above the minimized chat.
      // Fires on EVERY page load (and on every minimize) after 8s, as long as
      // the chat is still minimized. Only an explicit dismiss (×) silences it
      // for the rest of the tab session.
      function scheduleTeaser(delayMs) {
        if (sessionStorage.getItem('chatbot_teaser_dismissed')) return;

        setTimeout(() => {
          if (!chatContainer.classList.contains('minimized')) return;
          if (sessionStorage.getItem('chatbot_teaser_dismissed')) return;
          if (document.querySelector('.chat-teaser')) return; // one at a time

          const teasers = getTeasers();

          const teaser = document.createElement('div');
          teaser.className = 'chat-teaser';
          teaser.setAttribute('role', 'status');

          const text = document.createElement('span');
          text.textContent = teasers[Math.floor(Math.random() * teasers.length)];

          const close = document.createElement('button');
          close.className = 'chat-teaser-close';
          close.type = 'button';
          close.setAttribute('aria-label', 'Dismiss');
          close.textContent = '×';

          teaser.appendChild(text);
          teaser.appendChild(close);
          document.body.appendChild(teaser);

          const removeTeaser = () => teaser.remove();
          close.addEventListener('click', e => {
            e.stopPropagation();
            sessionStorage.setItem('chatbot_teaser_dismissed', '1');
            removeTeaser();
          });
          teaser.addEventListener('click', () => {
            removeTeaser();
            if (chatContainer.classList.contains('minimized')) toggleMinimize();
          });
          setTimeout(removeTeaser, 20000);
        }, delayMs);
      }

      scheduleTeaser(8000);
    }
  }

  // Score-based detection: count stopwords of each language, majority wins
  const IT_WORDS = new Set(['il', 'la', 'lo', 'le', 'gli', 'di', 'che', 'un', 'una', 'per', 'con', 'sono', 'del', 'della', 'nel', 'nella', 'mio', 'mia', 'miei', 'più', 'anche', 'come', 'cosa', 'quale', 'quali', 'dove', 'quando', 'perché', 'chi', 'sei', 'hai', 'ho', 'puoi', 'raccontami', 'dimmi', 'parlami', 'spiegami', 'grazie', 'ciao', 'molto', 'lavoro', 'progetti', 'carriera', 'questo', 'questa', 'tra', 'ed', 'è', 'poi', 'meglio', 'ancora', 'continua', 'altro']);
  const EN_WORDS = new Set(['the', 'of', 'and', 'to', 'in', 'is', 'was', 'my', 'your', 'what', 'tell', 'me', 'about', 'have', 'has', 'with', 'for', 'at', 'on', 'i', 'you', 'it', 'are', 'do', 'did', 'how', 'where', 'when', 'why', 'who', 'work', 'projects', 'career', 'this', 'that', 'more', 'please', 'thanks', 'show', 'give', 'explain', 'can', 'could', 'would']);

  function detectLanguage(text) {
    const words = (text || '').toLowerCase().split(/[^a-zàèéìòù']+/);
    let it = 0;
    let en = 0;
    words.forEach(w => {
      if (IT_WORDS.has(w)) it++;
      if (EN_WORDS.has(w)) en++;
    });
    return it > en ? 'it' : 'en';
  }

  function renderSuggestedQuestions() {
    const chatMessages = document.getElementById('chat-messages');
    const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop();
    const lang = lastUserMessage ? detectLanguage(lastUserMessage.content) : siteLang();
    
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggested-questions';
    suggestionsDiv.id = 'suggestions';
    
    const title = document.createElement('div');
    title.className = 'suggestions-title';
    title.textContent = lang === 'it' ? '💡 Domande suggerite:' : '💡 Suggested questions:';
    suggestionsDiv.appendChild(title);
    
    SUGGESTED_QUESTIONS[lang].forEach(question => {
      const btn = document.createElement('button');
      btn.className = 'suggestion-btn';
      btn.textContent = question;
      
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isProcessing) return;
        
        const suggestionsEl = document.getElementById('suggestions');
        if (suggestionsEl) suggestionsEl.remove();
        
        const chatInput = document.getElementById('chat-input');
        chatInput.value = question;
        autoResizeTextarea(chatInput);
        
        handleSendClick();
      });
      
      suggestionsDiv.appendChild(btn);
    });
    
    chatMessages.appendChild(suggestionsDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleSendClick() {
    if (isProcessing) return;

    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();

    if (!message) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendMessage(message, 0);
  }

  // Two fresh quick-reply chips under the latest answer
  function renderFollowups(lang) {
    document.getElementById('followups')?.remove();
    const pool = FOLLOWUP_QUESTIONS[lang].filter(q => !usedFollowups.has(q));
    if (!pool.length) return;

    const picks = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    const wrap = document.createElement('div');
    wrap.className = 'followup-chips';
    wrap.id = 'followups';

    picks.forEach(question => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = question;
      btn.addEventListener('click', () => {
        if (isProcessing) return;
        usedFollowups.add(question);
        wrap.remove();
        const chatInput = document.getElementById('chat-input');
        chatInput.value = question;
        handleSendClick();
      });
      wrap.appendChild(btn);
    });

    const chatMessages = document.getElementById('chat-messages');
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Discreet contact card, once per session after the 2nd real answer
  function showContactCTA(lang) {
    const chatMessages = document.getElementById('chat-messages');
    const card = document.createElement('div');
    card.className = 'chat-cta-card';

    const title = document.createElement('div');
    title.className = 'chat-cta-title';
    title.textContent = lang === 'it' ? 'Ti va di parlarne di persona?' : 'Want to take this offline?';

    const sub = document.createElement('p');
    sub.textContent = lang === 'it'
      ? 'Daniele si confronta volentieri su AI, data science e speaking.'
      : 'Daniele is always happy to chat about AI, data science and speaking.';

    const link = document.createElement('a');
    link.href = 'https://www.linkedin.com/in/danieleraimondi92';
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'chat-cta-btn';
    link.textContent = lang === 'it' ? 'Connettiti su LinkedIn →' : 'Connect on LinkedIn →';

    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(link);
    chatMessages.appendChild(card);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage(message, retryCount = 0) {
    const MAX_RETRIES = 3;
    const sendButton = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');
    let willRetry = false;

    if (isProcessing && retryCount === 0) return;

    if (retryCount === 0) {
      isProcessing = true;
      document.getElementById('suggestions')?.remove();
      document.getElementById('followups')?.remove();
      sendButton.disabled = true;
      chatInput.disabled = true;

      addMessage('user', message);
      conversationHistory.push({ role: 'user', content: message });
    }

    // Offline check
    if (!navigator.onLine) {
      const lang = detectLanguage(message);
      addMessage('assistant', lang === 'it'
        ? '⚠️ Nessuna connessione internet. Controlla la rete e riprova.'
        : '⚠️ No internet connection. Check your network and try again.');
      // Keep the user's message: the bubble stays visible, so history
      // and DOM must agree (the error notice itself is not persisted)
      trimAndSaveHistory();
      return; // finally handles cleanup
    }

    const loadingId = addTypingIndicator();

    try {
      currentAbortController = new AbortController();

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Recent context only: keeps backend token usage bounded
          messages: conversationHistory.slice(-12),
          sessionId: sessionId
        }),
        signal: currentAbortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        removeMessage(loadingId);

        if (response.status === 403 && errorData.message) {
          addMessage('assistant', errorData.message);
          conversationHistory.push({ role: 'assistant', content: errorData.message });
          trimAndSaveHistory();
          return;
        }

        if (response.status === 429) {
          const lang = detectLanguage(message);
          const msg = lang === 'it'
            ? `⚠️ Troppi tentativi. ${errorData.message || 'Attendi un momento.'}`
            : `⚠️ Too many requests. ${errorData.message || 'Please wait a moment.'}`;
          addMessage('assistant', msg);
          // Keep the user's message: the bubble stays visible, so history
          // and DOM must agree (the error notice itself is not persisted)
          trimAndSaveHistory();
          return;
        }

        if (response.status === 503) {
          const lang = detectLanguage(message);
          const msg = errorData.message || (lang === 'it'
            ? '⚠️ Servizio AI temporaneamente non disponibile. Riprova tra qualche minuto.'
            : '⚠️ AI service temporarily unavailable. Please try again in a few minutes.');
          addMessage('assistant', msg);
          // Keep the user's message: the bubble stays visible, so history
          // and DOM must agree (the error notice itself is not persisted)
          trimAndSaveHistory();
          return;
        }

        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      removeMessage(loadingId);
      const messageId = addMessage('assistant', '', false);
      let fullResponse = '';

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      const STALL_MS = 30000;

      while (true) {
        // Watchdog: a stream that stops sending chunks must not hang the UI
        let stallTimer = null;
        const readPromise = reader.read();
        readPromise.catch(() => {}); // swallow late rejection after abort
        const result = await Promise.race([
          readPromise,
          new Promise(resolve => { stallTimer = setTimeout(() => resolve({ stalledRead: true }), STALL_MS); })
        ]);
        clearTimeout(stallTimer);

        if (result.stalledRead) {
          currentAbortController.abort();
          if (fullResponse) break; // keep the partial answer we already have
          removeMessage(messageId);
          throw new Error('stream stalled');
        }

        const { done, value } = result;
        if (done) {
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.content || '';
                  fullResponse += content;
                  updateMessageContent(messageId, fullResponse);
                } catch (e) {
                  console.error('JSON parse error:', e);
                }
              }
            }
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || '';
              fullResponse += content;
              updateMessageContent(messageId, fullResponse);
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }

      conversationHistory.push({ role: 'assistant', content: fullResponse });
      trimAndSaveHistory();

      // Follow-ups and CTA must match the language of the user's last message
      const lang = detectLanguage(message);
      renderFollowups(lang);
      // LinkedIn CTA: once per page load, as soon as the conversation
      // (including restored history) reaches 2 assistant replies
      const assistantCount = conversationHistory.filter(m => m.role === 'assistant').length;
      if (assistantCount >= 2 && !ctaShownThisLoad) {
        ctaShownThisLoad = true;
        showContactCTA(lang);
      }

    } catch (error) {
      // User cleared chat during request — discard silently
      if (error.name === 'AbortError') return;

      console.error('Fetch error:', error);

      removeMessage(loadingId);

      if (retryCount < MAX_RETRIES) {
        willRetry = true;
        const waitTime = Math.pow(2, retryCount) * 1000;
        const lang = detectLanguage(message);
        const retryMsg = lang === 'it'
          ? `⚠️ Riprovo tra ${waitTime / 1000}s...`
          : `⚠️ Retrying in ${waitTime / 1000}s...`;
        addMessage('assistant', retryMsg);

        retryTimeout = setTimeout(() => {
          retryTimeout = null;
          const chatMsgs = document.getElementById('chat-messages');
          for (let i = chatMsgs.children.length - 1; i >= 0; i--) {
            const el = chatMsgs.children[i];
            if (el.textContent.includes('Riprovo') || el.textContent.includes('Retrying')) {
              el.remove();
              break;
            }
          }
          sendMessage(message, retryCount + 1);
        }, waitTime);
        return;
      }

      // Never surface internal error details to visitors
      const lang = detectLanguage(message);
      const errorMsg = lang === 'it'
        ? '❌ Qualcosa è andato storto. Riprova tra poco.'
        : '❌ Something went wrong. Please try again shortly.';

      addMessage('assistant', errorMsg);
      // Keep the user's message: the bubble stays visible, so history
      // and DOM must agree (the error notice itself is not persisted)
      trimAndSaveHistory();

    } finally {
      // Only reset UI when truly done (not when a retry is scheduled)
      if (!willRetry) {
        isProcessing = false;
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.focus();
      }
    }
  }

  function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    const messageId = 'typing-' + Date.now();
    
    messageDiv.id = messageId;
    messageDiv.className = 'chat-message assistant-message typing-indicator-container';
    
    messageDiv.innerHTML = `
      <img src="${AVATARS.assistant}" alt="Daniele" class="message-avatar">
      <div class="typing-bubble">
        <span class="typing-text">${siteLang() === 'it' ? 'Daniele sta scrivendo' : 'Daniele is typing'}</span>
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageId;
  }

  function addMessage(role, content, scrollToBottom = true) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    const messageId = 'msg-' + Date.now() + '-' + Math.random();

    messageDiv.id = messageId;
    messageDiv.className = `chat-message ${role}-message`;

    const avatar = role === 'user' ? AVATARS.user : AVATARS.assistant;
    const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
      <img src="${avatar}" alt="${role}" class="message-avatar">
      <div class="message-content">
        <div class="message-bubble"></div>
        <div class="message-time">${time}</div>
      </div>
    `;

    const bubble = messageDiv.querySelector('.message-bubble');
    if (bubble && content) bubble.appendChild(renderMarkdown(content));

    chatMessages.appendChild(messageDiv);
    if (scrollToBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageId;
  }

  function updateMessageContent(messageId, content) {
    const messageDiv = document.getElementById(messageId);
    if (messageDiv) {
      const bubble = messageDiv.querySelector('.message-bubble');
      if (bubble) {
        bubble.innerHTML = '';
        bubble.appendChild(renderMarkdown(content));
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }
    }
  }

  function removeMessage(messageId) {
    const msg = document.getElementById(messageId);
    if (msg) msg.remove();
  }

  // Keep conversation history under localStorage limits (~50 messages max)
  function trimAndSaveHistory() {
    const MAX_MESSAGES = 50;
    if (conversationHistory.length > MAX_MESSAGES) {
      conversationHistory = conversationHistory.slice(-MAX_MESSAGES);
    }
    try {
      localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));
    } catch (e) {
      // localStorage full — trim more aggressively
      conversationHistory = conversationHistory.slice(-20);
      try {
        localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));
      } catch (_) {
        localStorage.removeItem('chatbot_history');
      }
    }
  }

  function clearConversation() {
    // Abort any in-flight request
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    // Cancel any scheduled retry
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }

    isProcessing = false;
    const sendButton = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');
    if (sendButton) sendButton.disabled = false;
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.style.height = 'auto';
      chatInput.focus();
    }

    conversationHistory = [];
    usedFollowups.clear();
    // A fresh conversation re-arms the teaser and the LinkedIn CTA
    ctaShownThisLoad = false;
    sessionStorage.removeItem('chatbot_teaser_dismissed');
    localStorage.removeItem('chatbot_history');
    document.getElementById('chat-messages').innerHTML = '';
    addMessage('assistant', welcomeMessage());
    renderSuggestedQuestions();
  }

  // When the site language toggles and the visitor hasn't chatted yet,
  // re-render the welcome message and suggested questions in the new language
  window.addEventListener('sitelang-changed', () => {
    if (conversationHistory.some(m => m.role === 'user')) return;
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    chatMessages.innerHTML = '';
    addMessage('assistant', welcomeMessage());
    renderSuggestedQuestions();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();