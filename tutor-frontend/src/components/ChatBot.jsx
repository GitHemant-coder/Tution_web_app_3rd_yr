import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import './ChatBot.css';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I am your AI Tutor Assistant 👋. How can I help you today?", isBot: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const emojiMap = {
    "Happy": "😊",
    "Sad": "😔",
    "Stressed": "😓",
    "Confused": "🤔",
    "Neutral": "😐"
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const newMessages = [...messages, { text: inputText, isBot: false }];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chatbot/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: inputText })
      });
      const data = await response.json();

      // Simulate typing delay (1–2 seconds)
      setTimeout(() => {
        setMessages([...newMessages, { 
          text: data.response, 
          isBot: true,
          emotion: data.emotion,
          emotionEmoji: emojiMap[data.emotion] || "😐"
        }]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      setTimeout(() => {
        setMessages([...newMessages, { 
          text: "I am having trouble connecting right now. Please try again later.", 
          isBot: true,
          emotion: "Neutral",
          emotionEmoji: "😐"
        }]);
        setIsTyping(false);
      }, 1000);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={toggleChat}>
          <MessageSquare size={24} />
          <span className="tooltip">Need Help?</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window fade-in-up">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-title">
              <Bot size={22} color="#fbbf24" />
              <div>
                <h3>AI Emotion Tutor</h3>
                <span className="online-status">● Online</span>
              </div>
            </div>
            <button className="close-chat-btn" onClick={toggleChat}>
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.isBot ? 'bot' : 'user'}`}>
                {msg.isBot && <div className="avatar bot-avatar"><Bot size={14} /></div>}
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {msg.isBot && msg.emotion && (
                     <div className="emotion-badge">
                        {msg.emotionEmoji} {msg.emotion}
                     </div>
                  )}
                  <div className={`message ${msg.isBot ? 'message-bot' : 'message-user'}`}>
                    {msg.text}
                  </div>
                </div>

                {!msg.isBot && <div className="avatar user-avatar"><User size={14} /></div>}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="message-wrapper bot">
                <div className="avatar bot-avatar"><Bot size={14} /></div>
                <div className="message message-bot typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Ask me something..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chat-input"
            />
            <button 
              type="submit" 
              className={`send-btn ${inputText.trim() ? 'active' : ''}`}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
