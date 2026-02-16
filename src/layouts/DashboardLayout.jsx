import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Copilot from '../components/assistants/Copilot';
import { Bot } from 'lucide-react';

const DashboardLayout = () => {
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-50 mix-blend-overlay"></div>

            <Navbar />

            <main className="min-h-screen pt-20 pb-8 px-4 md:px-8 relative overflow-hidden">
                {/* Background Gradients - Warm Ombre in Light Mode, Subtle in Dark */}
                <div className="fixed top-0 left-0 w-full h-[600px] bg-[hsl(var(--blob-1))] dark:bg-primary/5 opacity-40 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4 mix-blend-multiply dark:mix-blend-normal"></div>
                <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-[hsl(var(--blob-2))] dark:bg-accent/5 opacity-45 blur-[100px] rounded-full pointer-events-none translate-y-1/3 mix-blend-multiply dark:mix-blend-normal"></div>
                <div className="fixed top-1/2 left-1/2 w-[800px] h-[800px] bg-[hsl(var(--blob-3))] dark:bg-transparent opacity-40 blur-[120px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 -z-10 mix-blend-multiply"></div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Floating Copilot Trigger */}
            <button
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 hover:bg-primary/90 transition-all cursor-pointer z-50 group"
            >
                <Bot className="h-6 w-6" />
                <span className="absolute right-full mr-4 px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                    {isCopilotOpen ? 'Close Copilot' : 'Ask Career Copilot'}
                </span>
            </button>

            {/* Copilot Chat Interface */}
            <Copilot isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
        </div>
    );
};

export default DashboardLayout;
