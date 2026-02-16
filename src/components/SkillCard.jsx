import React from 'react';

function SkillCard({ skillData }) {
    if (!skillData || !skillData.roadmap) return null;

    const { skill, roadmap } = skillData;

    return (
        <div className="skill-card hover:border-primary/50 transition-all duration-300">
            <h2 className="skill-title text-xl font-bold text-primary mb-4">{skill}</h2>

            <div className="space-y-4">
                <div className="section">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">📘 Topics to Learn</h4>
                    <ul className="list-disc list-inside text-sm text-foreground/90 space-y-1 ml-1">
                        {roadmap.topics?.map((topic, index) => (
                            <li key={index}>{topic}</li>
                        ))}
                    </ul>
                </div>

                <div className="section">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">🧠 Practice Tasks</h4>
                    <ul className="list-disc list-inside text-sm text-foreground/90 space-y-1 ml-1">
                        {roadmap.practice?.map((task, index) => (
                            <li key={index}>{task}</li>
                        ))}
                    </ul>
                </div>

                <div className="section">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">🚀 Mini Project</h4>
                    <p className="text-sm text-foreground/90">{roadmap.miniProject}</p>
                </div>

                <div className="section">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">🎓 Certification</h4>
                    <p className="text-sm text-foreground/90">{roadmap.certification}</p>
                </div>

                <div className="section pt-2 border-t border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">⏳ Estimated Duration</h4>
                    <p className="text-sm font-medium text-foreground">{roadmap.duration}</p>
                </div>
            </div>
        </div>
    );
}

export default SkillCard;
