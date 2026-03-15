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
      "Tell me about your athletic career as a national athlete",
      "What projects have you built with Machine Learning?"
    ],
    it: [
      "Qual è la tua esperienza in AI e Data Science?",
      "Raccontami della tua carriera da atleta nazionale",
      "Quali progetti hai sviluppato con Machine Learning?"
    ]
  };

  const AVATARS = {
    assistant: 'assets/profile2.jpeg',
    user: 'assets/user-avatar.svg'
  };

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
      addMessage('assistant', "Hi! I'm Daniele's AI twin. Ask me about my work in AI, data science, athletic career, or anything else! (Puoi scrivermi anche in italiano!)");
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
      let isMinimized = localStorage.getItem('chatbot_minimized') === 'true';
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
      }
    }
  }

  function detectLanguage(text) {
    const italianWords = ['cosa', 'come', 'quando', 'dove', 'perché', 'chi', 'sei', 'hai', 'puoi', 'raccontami', 'dimmi'];
    const lowerText = text.toLowerCase();
    return italianWords.some(word => lowerText.includes(word)) ? 'it' : 'en';
  }

  function renderSuggestedQuestions() {
    const chatMessages = document.getElementById('chat-messages');
    const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop();
    const lang = lastUserMessage ? detectLanguage(lastUserMessage.content) : 'en';
    
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

  async function sendMessage(message, retryCount = 0) {
    const MAX_RETRIES = 3;
    const sendButton = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');
    let willRetry = false;

    if (isProcessing && retryCount === 0) return;

    if (retryCount === 0) {
      isProcessing = true;
      document.getElementById('suggestions')?.remove();
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
      conversationHistory.pop();
      return; // finally handles cleanup
    }

    const loadingId = addTypingIndicator();

    try {
      currentAbortController = new AbortController();

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
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
          conversationHistory.pop();
          return;
        }

        if (response.status === 503) {
          const lang = detectLanguage(message);
          const msg = errorData.message || (lang === 'it'
            ? '⚠️ Servizio AI temporaneamente non disponibile. Riprova tra qualche minuto.'
            : '⚠️ AI service temporarily unavailable. Please try again in a few minutes.');
          addMessage('assistant', msg);
          conversationHistory.pop();
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

      while (true) {
        const { done, value } = await reader.read();
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

      const lang = detectLanguage(message);
      const errorMsg = lang === 'it'
        ? `❌ Errore: ${error.message}. Riprova.`
        : `❌ Error: ${error.message}. Try again.`;

      addMessage('assistant', errorMsg);
      conversationHistory.pop();

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
        <span class="typing-text">Daniele is typing</span>
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
    localStorage.removeItem('chatbot_history');
    document.getElementById('chat-messages').innerHTML = '';
    addMessage('assistant', "Hi! I'm Daniele's AI twin. Ask me about my work in AI, Data Science, athletic career, or anything else! (Puoi scrivermi anche in italiano!)");
    renderSuggestedQuestions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();