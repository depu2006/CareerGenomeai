import React from 'react';
import InterviewAvatar from '../components/interview/InterviewAvatar';
import { motion } from 'framer-motion';

const InterviewPrep = () => {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    AI Mock Interview
                </h1>
                <p className="text-muted-foreground mt-2">
                    Practice with our AI interviewer. Get real-time feedback on your answers and body language.
                </p>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-1 shadow-xl"
            >
                <InterviewAvatar />
            </motion.div>
        </div>
    );
};

export default InterviewPrep;
