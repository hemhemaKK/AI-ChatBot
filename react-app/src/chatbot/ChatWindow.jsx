import { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Maximize2, Minimize2, Send, Sparkle, X } from 'lucide-react';
import ChatMessage from './ChatMessage';

const genAI = new GoogleGenAI({
  apiKey: "AIzaSyBuA61W6j-2PR0VqeE_HslqFJCpKRDZr3c",
});

const ChatWindow = ({ isOpen, onClose }) => {
  const [userName, setUserName] = useState("Guest");
  const [userInitial, setUserInitial] = useState("G");
  const [message, setMessage] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const chatWindowRef = useRef(null);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = () => {
      let userDetails = { name: "Guest" };
      try {
        const stored = localStorage.getItem("name");
        if (stored) {
          userDetails = JSON.parse(stored);
        }
      } catch (err) {
        console.warn("Invalid JSON in localStorage:", err);
      }

      setUserName(userDetails?.name || "Guest");
      setUserInitial((userDetails?.name || "G").charAt(0).toUpperCase());
      setMessage([
        {
          text: `Hi ${userDetails?.name || 'Guest'}! I'm your chatbot.`,
          isBot: true,
        },
      ]);
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessage((prev) => [...prev, { text: userMessage, isBot: false }]);
    setIsLoading(true);

    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userMessage,
      });

      const reply = result.text || "Sorry, I didn't understand that.";
      setMessage((prev) => [...prev, { text: reply, isBot: true }]);
    } catch (error) {
      console.error("AI error:", error);
      setMessage((prev) => [
        ...prev,
        { text: "I'm sorry, something went wrong.", isBot: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={chatWindowRef}
      className={`fixed bottom-20 left-4 w-80 bg-gray-900 rounded-2xl shadow-2xl border-gray-200 overflow-hidden transition-all duration-300 ease-in-out backdrop-blur-lg border ${
        isMinimized ? "h-14" : "h-[500px]"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Sparkle size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium text-sm">AI Assistant</h3>
            <p>
              Welcome,{" "}
              {userName.length > 15 ? `${userName.slice(0, 15)}...` : userName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            {isMinimized ? <Maximize2 /> : <Minimize2 />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat body */}
      {!isMinimized && (
        <div className="h-[calc(100%-8rem)] overflow-y-auto p-3 space-y-3 bg-gray-900">
          {message.map((msg, index) => (
            <div key={index} className="flex items-start gap-2 text-white">
              {msg.isBot ? (
                <ChatMessage message={msg.text} isBot={true} />
              ) : (
                <div className="flex items-start gap-2 justify-end w-full text-white">
                  <div className="flex-1">
                    <ChatMessage message={msg.text} isBot={false} />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                    {userInitial}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-white p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">AI is thinking...</span>
            </div>
          )}

          <div ref={messageEndRef}></div>

          <form onSubmit={handleSubmit} className="relative mt-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ maxHeight: "100px" }}
              placeholder="Type your query"
              className="w-full pr-10 py-2 pl-3 rounded-xl border border-gray-200 bg-gray-800 text-white resize-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
