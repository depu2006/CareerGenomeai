import InterviewAvatar from '../components/interview/InterviewAvatar';
import SkillAssessment from './SkillAssessment';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, BrainCircuit } from 'lucide-react';
import { cn } from '../utils/cn';
import { useState } from 'react';

const InterviewPrep = () => {
    const [activeTab, setActiveTab] = useState('mock'); // 'mock' or 'skill'

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Interview Prep Center
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Comprehensive preparation with AI-powered mock interviews and technical assessments.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('mock')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                            activeTab === 'mock'
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Video size={16} />
                        Mock Interview
                    </button>
                    <button
                        onClick={() => setActiveTab('skill')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                            activeTab === 'skill'
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BrainCircuit size={16} />
                        Technical Skill Check
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'mock' ? (
                    <motion.div
                        key="mock"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-1 shadow-xl"
                    >
                        <InterviewAvatar />
                    </motion.div>
                ) : (
                    <motion.div
                        key="skill"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-0 shadow-xl overflow-hidden"
                    >
                        <SkillAssessment />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InterviewPrep;
