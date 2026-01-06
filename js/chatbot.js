// js/chatbot.js
(function() {
  const API_URL = 'https://ai-twin-backend.vercel.app/api/chat';
  let conversationHistory = [];
  let sessionId = null;
  let requestCount = 0;
  let lastRequestTime = Date.now();
  const MAX_REQUESTS_PER_MINUTE = 5;
  const MIN_REQUEST_INTERVAL_MS = 3000;

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

    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      const waitSeconds = Math.ceil((MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest) / 1000);
      addMessage('assistant', `⏱️ Please wait ${waitSeconds} seconds / Attendi ${waitSeconds} secondi`);
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime > 60000) requestCount = 0;
    
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
      addMessage('assistant', '⚠️ Too many messages / Troppi messaggi. Wait a minute / Attendi un minuto.');
      return;
    }

    requestCount++;
    lastRequestTime = now;

    document.getElementById('suggestions')?.remove();
    sendButton.disabled = true;
    chatInput.disabled = true;

    addMessage('user', message);
    chatInput.value = '';
    conversationHistory.push({ role: 'user', content: message });

    const loadingId = addTypingIndicator();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: conversationHistory,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) throw new Error('rate_limit');
        throw new Error(errorData.error || 'API error');
      }

      removeMessage(loadingId);
      const messageId = addMessage('assistant', '', false);
      let fullResponse = '';
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
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
            } catch (e) {}
          }
        }
      }
      
      conversationHistory.push({ role: 'assistant', content: fullResponse });
      localStorage.setItem('chatbot_history', JSON.stringify(conversationHistory));

    } catch (error) {
      console.error('Error:', error);
      removeMessage(loadingId);
      
      if (error.message !== 'rate_limit' && retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        addMessage('assistant', `⚠️ Retrying in ${waitTime/1000}s / Riprovo tra ${waitTime/1000}s...`);
        setTimeout(() => {
          conversationHistory.pop();
          sendMessage(retryCount + 1);
        }, waitTime);
        return;
      }
      
      if (error.message === 'rate_limit') {
        addMessage('assistant', '⚠️ Daily limit reached / Limite giornaliero raggiunto.');
      } else {
        addMessage('assistant', '❌ Error / Errore. Try again / Riprova.');
      }
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