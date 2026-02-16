import React from 'react';
import Timeline from '../components/career/Timeline';

const mockMilestones = [
    {
        title: 'Learn TypeScript',
        description: 'Master static typing, interfaces, and generics.',
        date: 'Jan 2024',
        year: '2024',
        status: 'completed',
        category: 'Skill',
        type: 'learning'
    },
    {
        title: 'Build 3 React Projects',
        description: 'Create a portfolio with real-world applications.',
        date: 'Mar 2024',
        year: '2024',
        status: 'completed',
        category: 'Project',
        type: 'project'
    },
    {
        title: 'AWS Cloud Certification',
        description: 'Get certified as a Cloud Practitioner.',
        date: 'Jun 2025',
        year: '2025',
        status: 'in-progress',
        category: 'Certification',
        type: 'certification'
    },
    {
        title: 'System Design Fundamentals',
        description: 'Learn scalable architecture and database design.',
        date: 'Aug 2025',
        year: '2025',
        status: 'upcoming',
        category: 'Skill',
        type: 'learning'
    },
    {
        title: 'Open Source Contribution',
        description: 'Contribute to a major library like Next.js or UI components.',
        date: 'Dec 2025',
        year: '2025',
        status: 'upcoming',
        category: 'Project',
        type: 'project'
    },
    {
        title: 'Full-Stack Internship',
        description: 'Apply for roles at top tech startups.',
        date: 'Feb 2026',
        year: '2026',
        status: 'upcoming',
        category: 'Internship',
        type: 'job'
    },
    {
        title: 'Senior Developer Role',
        description: 'Achieve target career goal.',
        date: '2027',
        year: '2027',
        status: 'upcoming',
        category: 'Career Goal',
        type: 'goal'
    }
];

const CareerPath = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Career Path AI
                </h1>
                <p className="text-muted-foreground mt-1">Your personalized roadmap to career success.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Timeline Column */}
                <div className="lg:col-span-8 bg-card/30 border border-border/50 rounded-3xl p-8 backdrop-blur-md">
                    <Timeline items={mockMilestones} />
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl">
                        <h3 className="text-lg font-semibold text-white mb-2">Next Milestone</h3>
                        <p className="text-sm text-muted-foreground mb-4">You are currently working on <strong>AWS Cloud Certification</strong>. Estimated completion: 3 weeks.</p>
                        <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                            View Resources
                        </button>
                    </div>

                    <div className="p-6 bg-card border border-border/50 rounded-2xl">
                        <h3 className="text-lg font-semibold mb-4">Path Analysis</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400" />
                                High demand for Full Stack roles
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                Aligned with market trends
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                Consider adding 'Docker' skill
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerPath;
