"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import Sidebar from '@/app/components/Sidebar/Sidebar';
import { Conversation } from '@/app/types/sidebar';
import { MODEL } from '@/constants/model';

const loadConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('conversations');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((conv: any) => ({
        ...conv,
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to parse saved conversations:', error);
    }
  }
  return [];
};

const saveConversations = (conversations: Conversation[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversations:', error);
  }
};

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  context?: any;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  // Load conversations on mount
  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        setMessages(conversation.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.senderId === 'user' ? 'user' : 'assistant'
        })));
      }
    } else {
      setMessages([]);
    }
  }, [currentConversationId, conversations]);

  // Save conversations when they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      participants: ['You', 'Assistant'],
      messages: [],
      updatedAt: new Date(),
      unreadCount: 0,
      isPinned: false
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([]);
  };

  const updateConversation = (message: Message) => {
    if (!currentConversationId) {
      createNewConversation();
    }
    
    setConversations(prev => prev.map(conv =>
      conv.id === currentConversationId ? {
        ...conv,
        messages: [...conv.messages, {
          id: message.id,
          content: message.content,
          type: 'text',
          timestamp: new Date(),
          status: 'sent',
          senderId: message.role === 'user' ? 'user' : 'assistant'
        }],
        updatedAt: new Date(),
        unreadCount: message.role === 'assistant' ? conv.unreadCount + 1 : conv.unreadCount
      } : conv
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      // Create initial assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        role: "assistant"
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metrics = {};

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Preserve incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const parsed = JSON.parse(line);
            if (parsed.done) {
              metrics = {
                total_duration: parsed.total_duration,
                load_duration: parsed.load_duration,
                prompt_eval_count: parsed.prompt_eval_count,
                prompt_eval_duration: parsed.prompt_eval_duration,
                eval_count: parsed.eval_count,
                eval_duration: parsed.eval_duration,
                context: parsed.context
              };
            } else if (parsed.response) {
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: msg.content + parsed.response }
                  : msg
              ));
            }
          } catch (e) {
            console.error('Error parsing JSON chunk:', e, 'Content:', line);
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.done) metrics = parsed;
        } catch (e) {
          console.error('Error parsing final buffer content:', e);
        }
      }

      // Update with final metrics
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, ...metrics }
          : msg
      ));
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-surface-dark">
    
    {/* 
      <Sidebar
        conversations={conversations}
        onSelect={(id) => setCurrentConversationId(id)}
       /> 
       */}
      <main className="flex-1 max-w-5xl mx-auto p-4 md:p-6 flex flex-col">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
              <span style={{color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                Quick R1
                <img
                  src="/globe.svg"
                  alt="Cool Icon"
                  className="h-6 w-6 inline-block"
                />
              </span>
            </h1>
            <div className="flex gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-surface-light dark:bg-accent-dark hover:bg-accent-light dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-soft hover:shadow-soft-lg transition-all duration-200"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setMessages([])}
                className="p-2.5 rounded-full bg-surface-light dark:bg-accent-dark hover:bg-accent-light dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-soft hover:shadow-soft-lg transition-all duration-200"
                aria-label="Start new chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-soft-lg p-4 flex-1 min-h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6 mb-4 scrollbar-hidden">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-soft ${
                      message.role === "user"
                        ? "dark:bg-gray-700 dark:text-white"
                        : "bg-accent-light dark:bg-accent-dark text-gray-800 dark:text-gray-200"
                    } transform transition-all duration-300 ease-out animate-fade-in hover:shadow-soft-lg`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.role === "assistant" && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs italic text-gray-500 dark:text-gray-400">
                          Generated in {message.total_duration ? ((message.total_duration / 1e6)/1000).toFixed(1) : '?'}s ·
                          Tokens: {message.prompt_eval_count || '?'} prompt / {message.eval_count || '?'} response
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-accent-light dark:bg-accent-dark rounded-2xl px-4 py-3 shadow-soft">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-3 bg-accent-light dark:bg-accent-dark p-2 rounded-xl">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:text-gray-200 placeholder-gray-400 shadow-soft transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`px-5 py-3 rounded-lg font-medium shadow-soft hover:shadow-soft-lg transition-all duration-200 ${
                  isLoading || !input.trim()
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white"
                }`}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </main>
      {/* Updated element to display the running model */}
      <div className="fixed bottom-2 right-2 text-xs text-gray-600 dark:text-gray-400">
        Model: {MODEL}
      </div>
    </div>
  );
}
