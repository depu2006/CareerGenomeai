import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Star, Calendar, Clock } from 'lucide-react';

const TimelineItem = ({ milestone, index, isLast }) => {
    const isCompleted = milestone.status === 'completed';
    const isCurrent = milestone.status === 'in-progress';

    return (
        <div className="relative flex gap-6 pb-12 last:pb-0 group">
            {/* Connecting Line */}
            {!isLast && (
                <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-border group-hover:bg-primary/30 transition-colors">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        className="w-full bg-primary"
                    />
                </div>
            )}

            {/* Icon Node */}
            <div className="relative z-10 flex-shrink-0">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 
             ${isCompleted ? 'bg-primary/20 border-primary text-primary' :
                            isCurrent ? 'bg-accent/20 border-accent text-accent animate-pulse-slow' :
                                'bg-card border-border text-muted-foreground'}`}
                >
                    {isCompleted ? <CheckCircle2 size={20} /> :
                        isCurrent ? <Clock size={20} /> :
                            milestone.type === 'goal' ? <Star size={20} /> :
                                <Circle size={20} />}
                </motion.div>
            </div>

            {/* Content Card */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`flex-grow p-4 rounded-xl border transition-all
          ${isCurrent ? 'bg-accent/5 border-accent/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]' :
                        'bg-card/50 border-border/50 hover:bg-card hover:border-border'}`}
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${isCurrent ? 'text-white' : 'text-foreground'}`}>
                        {milestone.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full border
            ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            isCurrent ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                milestone.type === 'goal' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 mr-12' : // mr-12 to avoid overlap with date if needed, but mostly flex handles it
                                    'bg-secondary text-muted-foreground border-transparent'}`}>
                        {milestone.status === 'completed' ? 'Completed' :
                            milestone.status === 'in-progress' ? 'In-Progress' :
                                milestone.type === 'goal' ? 'Goal' : 'Upcoming'}
                    </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {milestone.date}
                    </div>
                    {milestone.type !== 'goal' && (
                        <div className="px-2 py-0.5 rounded bg-secondary/50 border border-border/50">
                            {milestone.category}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Date Marker (Right side for desktop usually, but keeping inline for simplicity in this card layout) */}
            <div className="absolute right-4 top-5 text-xs text-muted-foreground font-mono hidden md:block">
                {milestone.year}
            </div>
        </div>
    );
};

const Timeline = ({ items }) => {
    return (
        <div className="max-w-3xl mx-auto py-8">
            {items.map((item, index) => (
                <TimelineItem
                    key={index}
                    milestone={item}
                    index={index}
                    isLast={index === items.length - 1}
                />
            ))}
        </div>
    );
};

export default Timeline;
