'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  cityContext?: {
    city: string;
    avgPricePerSqm: number;
    dealCount: number;
  };
}

export function Chatbot({ cityContext }: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'שלום! אני עוזר ה-AI שלך לנדל"ן ישראלי. אוכל לעזור לך להבין תשואות, משכנתאות, מס רכישה ועוד. שאל אותי כל שאלה! 🏠',
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setStreaming(true);

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          cityContext,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { text, error } = JSON.parse(data);
            if (error) throw new Error(error);
            if (text) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + text },
                ];
              });
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: 'מצטער, אירעה שגיאה. בדוק שה-ANTHROPIC_API_KEY מוגדר.',
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center text-2xl"
        aria-label="פתח צ'אט"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh' }}
        >
          {/* Header */}
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">עוזר נדל"ן AI</p>
              <p className="text-xs text-brand-200">מופעל על ידי Claude</p>
            </div>
            <span className="text-xs bg-brand-500 px-2 py-0.5 rounded-full">בטא</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm" dir="rtl">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                  {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                    <span className="inline-block w-1.5 h-4 bg-gray-400 mr-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Disclaimer */}
          <p className="px-4 py-1.5 text-xs text-gray-400 border-t border-gray-100 text-center" dir="rtl">
            לצרכי למידה בלבד — אינו ייעוץ פיננסי
          </p>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2" dir="rtl">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="שאל שאלה..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={streaming}
            />
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              className="bg-brand-600 text-white rounded-xl px-3 py-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {streaming ? '...' : 'שלח'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
