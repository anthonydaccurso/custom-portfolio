import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AskAntChatProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  messages: { role: 'user' | 'assistant'; content: string }[];
  onSend: (message: string) => void;
  error?: boolean;
  loading: boolean;
}

const AskAntChat: React.FC<AskAntChatProps> = ({
  isOpen,
  onOpen,
  onClose,
  messages,
  onSend,
  error,
  loading,
}) => {
  const [input, setInput] = useState('');
  const [animatedReply, setAnimatedReply] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const isInitialGreeting = lastMsg?.content === 'How can I help you?';

    if (lastMsg?.role === 'assistant' && !isInitialGreeting) {
      let index = 0;
      const fullText = lastMsg.content;
      setAnimatedReply('');
      const interval = setInterval(() => {
        index++;
        setAnimatedReply(fullText.slice(0, index));
        if (index >= fullText.length) clearInterval(interval);
      }, 15);
      return () => clearInterval(interval);
    } else if (isInitialGreeting) {
      setAnimatedReply(lastMsg.content);
    }
  }, [messages]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-6 right-6 bg-[#1c336f] hover:bg-blue-500/20 text-white w-[50px] h-[50px] rounded-full shadow-lg z-50 flex items-center justify-center transition-transform hover:scale-105"
          aria-label="Open AnthonyAI chatbot"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 w-[320px] sm:w-[360px] bg-[#0d2242] text-white shadow-2xl z-50 flex flex-col"
            style={{
              height: '100dvh',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
                Personal AI Assistant
              </h2>
              <button onClick={onClose} className="hover:text-blue-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
              {messages.map((line, i) => {
                const isLastAssistant = line.role === 'assistant' && i === messages.length - 1;
                const isInitialGreeting = line.content === 'How can I help you?';

                if (isLastAssistant && !isInitialGreeting) {
                  return (
                    <div key={i} className="text-gray-100">
                      AnthonyAI: {animatedReply}
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className={line.role === 'user' ? 'text-blue-200' : 'text-gray-100'}
                  >
                    {line.role === 'user' ? 'You: ' : 'AnthonyAI: '}
                    {line.content}
                  </div>
                );
              })}

              {loading && (
                <div className="text-gray-400 italic flex gap-1 items-center">
                  AnthonyAI is typing
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-150">.</span>
                  <span className="animate-bounce delay-300">.</span>
                </div>
              )}

              {error && (
                <div className="text-red-400">
                  AnthonyAI: Oops! Something went wrong. Try again later.
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AnthonyAI anything..."
                className="flex-1 px-3 py-2 rounded-md bg-[#1a2f5c] text-white placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className={`bg-[#1c336f] hover:bg-blue-500/20 px-3 py-2 rounded-md text-sm font-semibold text-white transition-colors duration-300 flex items-center justify-center gap-2 ${
                  loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AskAntChat;