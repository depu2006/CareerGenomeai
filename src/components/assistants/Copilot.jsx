import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Mic, Sparkles } from 'lucide-react';

const Copilot = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hello! I'm your Career Copilot. How can I help you today?",
            suggestions: []
        },
        {
            id: 2,
            type: 'user',
            text: "What skills should I focus on next?",
        },
        {
            id: 3,
            type: 'bot',
            text: "Based on your Skill Genome, I'd recommend focusing on System Design and Cloud Computing. These align perfectly with your Full-Stack career path and will boost your readiness score by ~12 points.",
            suggestions: ['What skills should I learn?', 'Review my resume', 'Interview tips', 'Find opportunities']
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsTyping(true);

        try {
            const res = await fetch('http://127.0.0.1:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentInput })
            });
            const data = await res.json();

            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: data.reply || "I'm having trouble connecting to my brain. Please check if Ollama is running.",
                suggestions: []
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: "My AI server seems to be offline. Please ensure the Python backend and Ollama are running.",
                suggestions: []
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-[60] flex flex-col h-[500px]"
                >
                    {/* Header */}
                    <div className="p-4 bg-primary/10 border-b border-border flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                <Bot size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Career Copilot</h3>
                                <span className="flex items-center gap-1 text-[10px] text-green-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Online
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.type === 'user'
                                        ? 'bg-cyan-400 text-black font-medium rounded-br-none'
                                        : 'bg-card border border-border/50 text-gray-100 rounded-bl-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>

                                {/* Suggestions Chips */}
                                {msg.suggestions && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {(msg.suggestions || []).filter(s => s && s.trim() !== "").map((sugg, i) => (
                                            <button
                                                key={`sugg-${msg.id}-${i}`}
                                                onClick={() => { setInput(sugg); handleSend(); }}
                                                className="text-xs px-2 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent hover:bg-accent/20 transition-colors"
                                            >
                                                {sugg}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-center gap-1 text-muted-foreground ml-2">
                                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-border bg-card/50 backdrop-blur-sm">
                        <div className="relative flex items-center gap-2">
                            <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                                <Mic size={18} />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask your career copilot..."
                                className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Copilot;
