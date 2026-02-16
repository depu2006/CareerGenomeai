import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Briefcase, Award, ExternalLink } from 'lucide-react';

import { useUser } from '../../context/UserContext';
import { calculateFitScore } from '../../services/genomeService';

const FitScoreModal = ({ isOpen, onClose, job }) => {
    const { userProfile } = useUser();

    if (!isOpen || !job) return null;

    // Use Context for Dynamic Score
    const { score, missing, match, tip } = calculateFitScore(userProfile, job);

    // Provide fallback if user hasn't generated genome yet
    const hasProfile = userProfile?.skills?.length > 0;

    const matchedSkills = match;
    const missingSkills = missing;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-card w-full max-w-2xl rounded-2xl border border-border overflow-hidden shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border/50 flex justify-between items-start bg-secondary/20">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Award className="text-primary" />
                                Opportunity Fit Analysis
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Analysis for <span className="text-foreground font-semibold">{job.title}</span> at {job.company}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Score Circle */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full rotate-[-90deg]">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="none" className="text-secondary" />
                                    <circle
                                        cx="80" cy="80" r="70"
                                        stroke={score > 80 ? '#4ade80' : score > 60 ? '#facc15' : '#f87171'}
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray="440"
                                        strokeDashoffset={440 - (440 * score) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold text-white">{score}%</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Match</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${score > 80 ? 'bg-green-500/20 text-green-400' :
                                    score > 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {score > 80 ? 'Excellent Match' : score > 60 ? 'Good Match' : 'Low Match'}
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-green-500" />
                                    Matched Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(matchedSkills || []).filter(s => s && s.trim() !== "").map((skill, i) => (
                                        <span key={`match-${i}`} className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-orange-500" />
                                    Missing Skills (Gap)
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(missingSkills || []).filter(s => s && s.trim() !== "").map((skill, i) => (
                                        <span key={`miss-${i}`} className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-xs text-orange-400">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-blue-400 mb-1">AI Tip</h4>
                                <p className="text-xs text-blue-200/80 leading-relaxed">
                                    {!hasProfile ? "Complete your Skill Genome to improve accuracy!" : tip}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border/50 bg-secondary/10 flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
                            Close
                        </button>
                        <button
                            onClick={() => window.open(job.applyLink || '#', '_blank')}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            Apply Now
                            <ExternalLink size={16} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FitScoreModal;
