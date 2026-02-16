import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ProjectCard({ project }) {
    const [showInstructions, setShowInstructions] = useState(false);

    // Safety check for instructions array
    const instructions = project.instructions || [];
    const hasInstructions = instructions.length > 0;

    const difficultyColors = {
        Beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
        Intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        Advanced: 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    return (
        <div className="group relative overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 flex flex-col">
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${difficultyColors[project.difficulty] || difficultyColors.Intermediate}`}>
                        {project.difficulty}
                    </span>
                    {project.score && (
                        <span className="text-xs text-muted-foreground font-mono">Match: {Math.round(project.score)}</span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {project.title}
                </h3>

                <div className="flex flex-wrap gap-2 mb-6">
                    {(Array.isArray(project.techStack) ? project.techStack : (project.techStack || '').split(',')).map((tech, i) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
                            {typeof tech === 'string' ? tech.trim() : tech}
                        </span>
                    ))}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Problem</label>
                        <p className="text-sm text-foreground/80 line-clamp-2">{project.problemStatement}</p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Outcome</label>
                        <p className="text-sm text-foreground/80 line-clamp-2">{project.expectedOutcome}</p>
                    </div>
                </div>
            </div>

            {hasInstructions && (
                <div className="border-t border-border/50 bg-secondary/5">
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="w-full flex items-center justify-between p-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary/10 transition-colors"
                    >
                        <span>{showInstructions ? 'Hide' : 'View'} Step-by-Step Instructions</span>
                        {showInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <AnimatePresence>
                        {showInstructions && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 space-y-3">
                                    {instructions.map((step, index) => (
                                        <div key={index} className="flex gap-3 text-sm text-foreground/80">
                                            <div className="min-w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                                                {index + 1}
                                            </div>
                                            <p className="leading-relaxed">{step}</p>
                                        </div>
                                    ))}

                                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                                        <button className="text-xs flex items-center gap-1 text-primary hover:underline">
                                            Open in Editor <ExternalLink className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default ProjectCard;
