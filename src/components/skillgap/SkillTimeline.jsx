import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code, Trophy, Clock, CheckCircle2, Circle } from 'lucide-react';

const SkillTimelineItem = ({ item, index, isLast, onToggle }) => {
    const { skill, roadmap } = item;

    // Normalize data if roadmap is missing or string
    const details = typeof roadmap === 'object' ? roadmap : {
        topics: [],
        miniProject: "No project available",
        duration: "Unknown",
        certification: "N/A"
    };

    return (
        <div className="relative flex gap-6 pb-12 last:pb-0 group">
            {/* Connecting Line */}
            {!isLast && (
                <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-border group-hover:bg-primary/30 transition-colors">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                        className="w-full bg-primary"
                    />
                </div>
            )}

            {/* Icon Node */}
            <div className="relative z-10 flex-shrink-0 flex flex-col items-center gap-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors ${item.completed
                            ? "bg-green-500 border-green-500 text-white shadow-green-500/20"
                            : "bg-card border-primary text-primary shadow-primary/20"
                        }`}
                >
                    {item.completed ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                </motion.div>

                <button
                    onClick={() => onToggle(index)}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${item.completed
                            ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                        }`}
                >
                    {item.completed ? "Done" : "Mark"}
                </button>
            </div>

            {/* Content Card */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`flex-grow p-5 rounded-xl border transition-all shadow-sm hover:shadow-md ${item.completed
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-card/50 border-border/50 hover:bg-card hover:border-primary/20"
                    }`}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {skill}
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            <Clock size={12} />
                            {details.duration || "Self-paced"}
                        </span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Topics Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Key Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {details.topics && details.topics.length > 0 ? (
                                details.topics.map((topic, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded bg-secondary/50 border border-border/50 text-foreground">
                                        {topic}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground">General mastery required</span>
                            )}
                        </div>
                    </div>

                    {/* Project & Cert Section */}
                    <div className="space-y-3 border-l border-border/50 pl-4 md:pl-0 md:border-l-0">
                        {details.miniProject && (
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Code size={14} /> Mini Project
                                </h4>
                                <p className="text-sm font-medium text-foreground">{details.miniProject}</p>
                            </div>
                        )}

                        {details.certification && details.certification !== "N/A" && (
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Trophy size={14} /> Recommended Cert
                                </h4>
                                <p className="text-sm text-foreground">{details.certification}</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const SkillTimeline = ({ items, onToggleComplete }) => {
    return (
        <div className="max-w-4xl mx-auto py-4">
            {items.map((item, index) => (
                <SkillTimelineItem
                    key={index}
                    item={item}
                    index={index}
                    isLast={index === items.length - 1}
                    onToggle={onToggleComplete}
                />
            ))}
        </div>
    );
};

export default SkillTimeline;
