import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const FailureCard = ({ story, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-red-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-all"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle size={64} className="text-red-500" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider border border-red-500/30 px-2 py-1 rounded bg-red-500/10">
                        {story.category} Mistake
                    </span>
                    <span className="text-xs text-muted-foreground">{story.source}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-300 transition-colors">
                    {story.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                    "{story.context}"
                </p>

                <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <span className="text-sm font-medium text-red-200">
                        Outcome: {story.outcome}
                    </span>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                    {isExpanded ? 'Hide Prevention Strategy' : 'See Prevention Strategy'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-green-400 mb-2">
                                    <ShieldCheck size={16} />
                                    How to Avoid This
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {story.prevention}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default FailureCard;
