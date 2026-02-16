import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, ExternalLink, Zap } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const OpportunityCard = ({ job, index, onApply }) => {
    const { userProfile } = useUser();

    // Enhanced Match Calculation Logic
    const { matchScore, matchedSkills } = useMemo(() => {
        const userSkills = (userProfile?.skills || []).map(s => s.toLowerCase());
        const jobTags = (job.tags || []).map(t => t.toLowerCase());
        const jobDesc = (job.description || "").toLowerCase();
        const jobTitle = (job.title || "").toLowerCase();

        // 1. Tag Matches (High Weight)
        const matchedFromTags = jobTags.filter(tag =>
            userSkills.some(skill => skill.includes(tag) || tag.includes(skill))
        );

        // 2. Description Matches (Medium Weight)
        const matchedFromDesc = userSkills.filter(skill =>
            !matchedFromTags.some(t => t.includes(skill)) && jobDesc.includes(skill)
        );

        // 3. Domain/Title Match (Base Bonus)
        const userDomain = (userProfile?.domain || "").toLowerCase();
        let score = 45; // Start with a fair baseline

        if (userDomain) {
            const domainKeywords = userDomain.split(' ');
            if (domainKeywords.some(word => word.length > 3 && jobTitle.includes(word.toLowerCase()))) {
                score += 15;
            }
        }

        score += matchedFromTags.length * 10;
        score += matchedFromDesc.length * 4;

        // Jitter for dynamic feel
        score += (index % 7);

        const allMatched = [...new Set([...matchedFromTags, ...matchedFromDesc])];

        return {
            matchScore: Math.min(99, Math.round(score)),
            matchedSkills: allMatched.map(s => s.charAt(0).toUpperCase() + s.slice(1))
        };
    }, [userProfile?.skills, userProfile?.domain, job.tags, job.description, job.title, index]);

    // Color based on score
    const getScoreStyles = (score) => {
        if (score >= 80) return 'text-green-400 border-green-400/30 bg-gradient-to-br from-green-500/20 to-emerald-500/5 shadow-[0_0_15px_rgba(74,222,128,0.15)]';
        if (score >= 55) return 'text-yellow-400 border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-orange-500/5 shadow-[0_0_15px_rgba(250,204,21,0.15)]';
        return 'text-red-400 border-red-400/30 bg-gradient-to-br from-red-500/20 to-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col h-full"
        >
            {/* Match Percentage Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl border-l border-b text-[10px] font-bold flex items-center gap-1.5 z-10 transition-all ${getScoreStyles(matchScore)}`}>
                <Zap size={10} fill="currentColor" className={matchScore >= 80 ? 'animate-pulse' : ''} />
                {matchScore}% MATCH
            </div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-xl font-bold text-white group-hover:bg-primary/10 transition-colors border border-white/5">
                        {job.company?.[0] || 'C'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1 pr-16">
                            {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary text-[10px] font-semibold border border-border whitespace-nowrap hidden sm:inline-block">
                    {job.type}
                </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-primary/60" />
                    {job.location}
                </div>
                {job.salary && (
                    <div className="flex items-center gap-1 text-green-500/80 font-medium font-mono">
                        <DollarSign size={12} />
                        {job.salary}
                    </div>
                )}
            </div>

            {/* Matching Insights */}
            {matchedSkills.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Matches:</span>
                    {matchedSkills.filter(s => s && s.trim() !== "").slice(0, 3).map((skill, i) => (
                        <span key={`${job.id}-match-${i}`} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                            {skill}
                        </span>
                    ))}
                    {matchedSkills.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{matchedSkills.length - 3}</span>
                    )}
                </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                {(job.tags || []).filter(t => t && t.trim() !== "").slice(0, 3).map((tag, i) => (
                    <span key={`${job.id}-tag-${i}`} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-muted-foreground font-medium group-hover:border-primary/20 transition-colors">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                <span className="text-[10px] text-muted-foreground font-medium">{job.posted}</span>
                <div className="flex gap-2 w-full ml-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(job.applyLink, '_blank');
                        }}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex-1 flex items-center justify-center gap-2"
                    >
                        Apply Now
                        <ExternalLink size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ArrowRightIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);

export default OpportunityCard;
