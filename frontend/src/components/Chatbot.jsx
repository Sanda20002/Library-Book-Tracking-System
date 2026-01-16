import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text:
        'Hi! I am your library assistant for staff. You can ask about opening times, contact details, or a member\'s borrowing status. Enter a member\'s ID (e.g., MEM20261234) to ask about that member.',
    },
  ]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const newMessages = [...messages, { from: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const payload = { message: text };
      if (memberId.trim()) {
        payload.memberId = memberId.trim();
      }
      const res = await api.post('/chat', payload);
      setMessages([...newMessages, { from: 'bot', text: res.data.reply || '...' }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          from: 'bot',
          text: 'Sorry, I could not reach the chatbot service just now.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isOpen]);

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Library Assistant</span>
            <button className="chatbot-close" onClick={toggleOpen}>
              ×
            </button>
          </div>
          <div className="chatbot-member-id">
            <label>
              Member ID for lookup (optional):
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="MEM2026XXXX or leave blank"
              />
            </label>
          </div>
          <div className="chatbot-messages">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.from === 'bot' ? 'chatbot-message chatbot-message-bot' : 'chatbot-message chatbot-message-user'
                }
              >
                {m.text.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="chatbot-input-row" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              disabled={sending}
            />
            <button type="submit" disabled={sending}>
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button className="chatbot-toggle" onClick={toggleOpen}>
        {isOpen ? 'Close Assistant' : 'Ask Library Assistant'}
      </button>
    </div>
  );
};

export default Chatbot;
