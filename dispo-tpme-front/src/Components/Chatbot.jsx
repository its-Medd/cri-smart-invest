// components/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../Styles/Chatbot.module.css';
import { chatService } from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCommentDots, faPaperPlane, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function Chatbot() {
  const { t, i18n } = useTranslation();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Reset welcome message when language changes
  useEffect(() => {
    setMessages([{ id: 0, role: 'bot', text: t('chat_welcome') }]);
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatService.send(text);
      const botMsg = { id: Date.now() + 1, role: 'bot', text: data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: t('chat_error'), error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Chat window */}
      {open && (
        <div className={styles.window}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.avatar}><FontAwesomeIcon icon={faRobot} /></span>
              <div>
                <p className={styles.botName}>{t('chat_bot_name')}</p>
                <p className={styles.botStatus}>
                  <span className={styles.statusDot} />
                  {t('chat_online')}
                </p>
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label={t('chat_close')}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot} ${msg.error ? styles.bubbleError : ''}`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                <span className={styles.typing}>
                  <span /><span /><span />
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={1}
              placeholder={t('chat_placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label={t('chat_close')}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t('chat_close') : t('chat_open')}
      >
        {open ? <FontAwesomeIcon icon={faXmark} /> : <FontAwesomeIcon icon={faCommentDots} />}
      </button>
    </div>
  );
}
