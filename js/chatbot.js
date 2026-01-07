// js/chatbot.js
(function() {
  const API_URL = 'https://ai-twin-backend.vercel.app/api/chat';
  let conversationHistory = [];
  let sessionId = null;
  let lastRequestTime = Date.now();

  const SUGGESTED_QUESTIONS = {
    en: [
      "What's your experience in AI and data science?",
      "Tell me about your athletic career as a national athlete",
      "What projects have you built with machine learning?"
    ],
    it: [
      "Qual è la tua esperienza in AI e data science?",
      "Raccontami della tua carriera da atleta nazionale",
      "Quali progetti hai sviluppato con machine learning?"
    ]
  };

  function initChatbot() {
    sessionId = localStorage.getItem('chatbot_sessionId');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

    document.getElementById('chat-send').addEventListener('click', sendMessage);
    document.getElementById('chat-clear').addEventListener('click', clearConversation);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // MINIMIZE/MAXIMIZE
    const minimizeBtn = document.getElementById('chat-minimize');
    const chatContainer = document.querySelector('.chat-container');
    const chatHeader = document.querySelector('.chat-header');
    
    if (minimizeBtn && chatContainer && chatHeader) {
      let isMinimized = localStorage.getItem('chatbot_minimized') === 'true';
      if (isMinimized) {
        chatContainer.classList.add('minimized');
        minimizeBtn.textContent = '□';
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
    title.textContent = lang === 'it' ? 'Domande suggerite:' : 'Suggested questions:';
    suggestionsDiv.appendChild(title);
    
    SUGGESTED_QUESTIONS[lang].forEach(question => {
      const btn = document.createElement('button');
      btn.className = 'suggestion-btn';
      btn.textContent = question;
      btn.onclick = () => {
        document.getElementById('chat-input').value = question;
        document.getElementById('suggestions')?.remove();
        sendMessage();
      };
      suggestionsDiv.appendChild(btn);
    });
    
    chatMessages.appendChild(suggestionsDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage(retryCount = 0) {
    const MAX_RETRIES = 3;
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send');
    const message = chatInput.value.trim();
    
    if (!message) return;

    // ⭐ RATE LIMITING FRONTEND COMPLETAMENTE DISABILITATO
    const now = Date.now();
    lastRequestTime = now;

    document.getElementById('suggestions')?.remove();
    sendButton.disabled = true;
    chatInput.disabled = true;

    addMessage('user', message);
    chatInput.value = '';
    conversationHistory.push({ role: 'user', content: message });

    const loadingId = addTypingIndicator();

    try {
      console.log('🚀 Sending request to:', API_URL);
      console.log('📦 Payload:', { messages: conversationHistory, sessionId });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: conversationHistory,
          sessionId: sessionId
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        
        removeMessage(loadingId);
        
        // Gestione guardrails (403)
        if (response.status === 403 && errorData.message) {
          addMessage('assistant', errorData.message);
          conversationHistory.push({ role: 'assistant', content: errorData.message });
          localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));
          return;
        }
        
        // Gestione rate limit (429) - NON dovrebbe mai succedere ora
        if (response.status === 429) {
          const lang = detectLanguage(message);
          const msg = lang === 'it' 
            ? `⚠️ Errore server. ${errorData.message || 'Riprova più tardi.'}`
            : `⚠️ Server error. ${errorData.message || 'Try again later.'}`;
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
                  
                  const msgElement = document.getElementById(messageId);
                  if (msgElement) {
                    msgElement.textContent = fullResponse;
                    document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
                  }
                } catch (e) {
                  console.error('JSON parse error:', e, 'Data:', data);
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
              
              const msgElement = document.getElementById(messageId);
              if (msgElement) {
                msgElement.textContent = fullResponse;
                document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
              }
            } catch (e) {
              console.error('JSON parse error:', e, 'Data:', data);
            }
          }
        }
      }
      
      console.log('✅ Full response received');
      
      conversationHistory.push({ role: 'assistant', content: fullResponse });
      localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));

    } catch (error) {
      console.error('❌ Fetch error:', error);
      
      removeMessage(loadingId);
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        const lang = detectLanguage(message);
        const retryMsg = lang === 'it'
          ? `⚠️ Riprovo tra ${waitTime/1000}s...`
          : `⚠️ Retrying in ${waitTime/1000}s...`;
        addMessage('assistant', retryMsg);
        
        setTimeout(() => {
          conversationHistory.pop();
          sendMessage(retryCount + 1);
        }, waitTime);
        return;
      }
      
      // Errore finale
      const lang = detectLanguage(message);
      const errorMsg = lang === 'it' 
        ? `❌ Errore: ${error.message}. Riprova.`
        : `❌ Error: ${error.message}. Try again.`;
      
      addMessage('assistant', errorMsg);
      conversationHistory.pop();
      
    } finally {
      sendButton.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    const messageId = 'typing-' + Date.now();
    
    messageDiv.id = messageId;
    messageDiv.className = 'chat-message assistant-message typing-indicator-container';
    messageDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    
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
    messageDiv.textContent = content;
    
    chatMessages.appendChild(messageDiv);
    if (scrollToBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageId;
  }

  function removeMessage(messageId) {
    const msg = document.getElementById(messageId);
    if (msg) msg.remove();
  }

  function clearConversation() {
    if (confirm('Clear conversation? / Cancellare conversazione?')) {
      conversationHistory = [];
      localStorage.removeItem('chatbot_history');
      document.getElementById('chat-messages').innerHTML = '';
      addMessage('assistant', "Hi! I'm Daniele's AI twin. (Puoi scrivermi anche in italiano!)");
      renderSuggestedQuestions();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();