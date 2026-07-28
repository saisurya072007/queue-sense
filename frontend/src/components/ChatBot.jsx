import React, { useState, useRef, useEffect } from 'react';
import { chatbotAPI } from '../services/api';
import { Send, X, Globe, Printer, Download, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_REPLIES = [
  { en: '🆔 Aadhaar Form Download', te: '🆔 Aadhaar Form Download' },
  { en: '📄 Income Cert Form & Guide', te: '📄 Income Form ఎలా fill చేయాలి?' },
  { en: '🚗 RTO Form 29/30 Download', te: '🚗 RTO Form 29/30 Download' },
  { en: '🏛️ Office & Bank Timings', te: '🏛️ Office & Bank Timings' },
  { en: '📄 Caste Cert Form Download', te: '📄 Caste Certificate Form' },
  { en: '🏦 Bank Account Form & KYC', te: '🏦 Bank Account Form & KYC' },
  { en: '📋 Spandana Grievance Form', te: '📋 Spandana Form Download' },
];

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! I\'m your SmartGov AI Assistant 🏛️\n\nI can help you with:\n1. **Office & Bank Timings** across Kakinada\n2. **Document Requirements** & fees\n3. **Step-by-Step Form Filling Guides**\n4. **Download Printable Forms (A4)** to fill & print at home!\n\n🎙️ *Tip: Click the microphone 🎤 icon to use Voice Search!*' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('english');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await chatbotAPI.send({ message: msg, language: lang });
      setMessages(prev => [...prev, {
        from: 'bot',
        text: res.data.response,
        formUrl: res.data.formUrl,
        formTitle: res.data.formTitle
      }]);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported on this browser. Please try Google Chrome or MS Edge!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'telugu' ? 'te-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success(lang === 'telugu' ? '🎙️ వింటున్నాను... మాట్లాడండి' : '🎙️ Voice search active... Speak now!');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        sendMessage(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        toast.error('Could not hear voice input. Please try speaking again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      toast.error('Voice recognition error.');
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button className="chatbot-fab" onClick={() => setOpen(prev => !prev)} aria-label="Open AI Assistant">
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>SmartGov AI Assistant</div>
                <div className="flex items-center gap-1" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)' }}>
                  <span className="live-dot" style={{ background: '#6ee7b7' }} />
                  Online • Voice Search Enabled
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(l => l === 'english' ? 'telugu' : 'english')}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '0.3rem 0.6rem', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
              >
                <Globe size={12} style={{ display: 'inline', marginRight: 4 }} />
                {lang === 'english' ? 'తెలుగు' : 'English'}
              </button>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={18} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.from === 'user' ? 'justify-end' : ''}`}>
                {msg.from === 'bot' && <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🤖</span>}
                <div className={`chat-bubble ${msg.from}`} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {msg.text}
                  {msg.formUrl && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.625rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <a
                        href={msg.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'var(--gradient-gold)',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          padding: '0.5rem 0.875rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <Printer size={15} /> {msg.formTitle || 'Download Printable Form (A4 PDF/HTML)'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message">
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <div className="chat-bubble bot" style={{ display: 'flex', gap: 4 }}>
                  <span className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                  <span className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                  <span className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.375rem', overflowX: 'auto' }}>
            {QUICK_REPLIES.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(lang === 'english' ? q.en : q.te)}
                style={{
                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.72rem',
                  color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'var(--transition)'
                }}
              >
                {lang === 'english' ? q.en : q.te}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chatbot-input-area" style={{ gap: '0.375rem' }}>
            <input
              className="form-input"
              style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem 0.875rem' }}
              placeholder={isListening ? '🎙️ Listening... speak now' : (lang === 'english' ? 'Ask or speak your question...' : 'మాట్లాడండి లేదా టైప్ చేయండి...')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button
              className={`btn ${isListening ? 'btn-danger' : 'btn-outline'}`}
              style={{ padding: '0.625rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={handleVoiceSearch}
              title={isListening ? 'Stop Listening' : 'Voice Search'}
              type="button"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.625rem 0.875rem' }} onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
