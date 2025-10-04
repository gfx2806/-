import React, { useState, useEffect, useRef } from 'react';
import { Chat } from "@google/genai";
import type { AnalysisResult } from '../types';
import { createChat } from '../services/geminiService';
import { PaperAirplaneIcon } from './icons';

interface ChatProps {
  analysisResult: AnalysisResult;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatComponent: React.FC<ChatProps> = ({ analysisResult }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const chatSession = createChat(analysisResult);
        setChat(chatSession);

        // This initial message kicks off the conversation based on the system prompt.
        const initialResponse = await chatSession.sendMessage({ message: "Introduce yourself and offer help based on the context." });
        setMessages([{ role: 'model', text: initialResponse.text }]);
      } catch (err) {
        console.error("Chat initialization failed:", err);
        setError("Failed to start a chat session.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [analysisResult]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chat || isLoading) return;

    const userMessage: Message = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chat.sendMessage({ message: userInput });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Sorry, I couldn't get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[450px] bg-white p-4 rounded-md">
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              dir="auto"
              className={`max-w-xs md:max-w-md p-3 rounded-2xl text-base whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
             <div className="bg-slate-200 text-slate-800 rounded-2xl rounded-bl-none p-3">
                <div className="flex items-center space-x-1" dir="ltr">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                </div>
            </div>
          </div>
        )}
        {error && (
            <div className="text-center text-red-500 text-sm p-2">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="اسأل عن أفكار للتصميم..."
          dir="rtl"
          className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
          disabled={isLoading || !chat}
        />
        <button
          type="submit"
          disabled={isLoading || !chat || !userInput.trim()}
          className="p-2 w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};
