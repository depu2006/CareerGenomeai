import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, ExternalLink } from 'lucide-react';

const OpportunityCard = ({ job, index, onApply }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-xl font-bold text-white">
                        {job.company?.[0] || 'C'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium border border-border whitespace-nowrap">
                    {job.type}
                </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {job.location}
                </div>
                {job.salary && (
                    <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        {job.salary}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {job.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-accent/10 border border-accent/20 rounded text-xs text-accent-foreground">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                <span className="text-xs text-muted-foreground">{job.posted}</span>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(job.applyLink, '_blank');
                        }}
                        className="p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-white/70 hover:text-white transition-colors"
                        title="Apply Directly"
                    >
                        <ExternalLink size={18} />
                    </button>
                    <button
                        onClick={() => onApply(job)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex-1"
                    >
                        Check Fit & Apply
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default OpportunityCard;
