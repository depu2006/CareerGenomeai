import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Dna,
    Map,
    Target,
    Users,
    Briefcase,
    Bell,
    Bot,
    Settings,
    LogOut,
    AlertTriangle,
    Lightbulb,
    Compass,
    Video
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        { icon: Dna, label: 'Skill Genome', path: '/dashboard/genome' },
        { icon: Target, label: 'Readiness', path: '/dashboard/readiness' },
        { icon: Briefcase, label: 'Opportunities', path: '/dashboard/opportunities' },
        { icon: AlertTriangle, label: 'Failure Intelligence', path: '/dashboard/failures' },
        { icon: Lightbulb, label: 'Project Generator', path: '/dashboard/project-generator' },
        { icon: Compass, label: 'Skill Gap', path: '/dashboard/skill-gap' }, // Original Skill Gap
        { icon: Video, label: 'Interview Prep', path: '/dashboard/interview-prep' }, // Added Interview Prep
        { icon: Users, label: 'Your Details', path: '/dashboard/details' },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar/50 backdrop-blur-xl transition-transform md:translate-x-0 -translate-x-full">
            <div className="flex h-16 items-center px-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Dna className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        CGAI
                    </span>
                </div>
            </div>

            <div className="flex flex-col h-[calc(100vh-4rem)] justify-between py-6 px-3">
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {/* Hover effect glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </NavLink>
                    ))}
                </nav>

                <div className="space-y-1 pt-6 border-t border-border/50">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
