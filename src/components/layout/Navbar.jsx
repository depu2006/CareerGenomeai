import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Dna,
    Target,
    Briefcase,
    AlertTriangle,
    Lightbulb,
    Compass,
    Users,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    BrainCircuit,
    Map,
    Video
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Navbar = () => {
    // Force Re-render
    const { theme, setTheme } = useTheme();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        { icon: Dna, label: 'Genome', path: '/dashboard/genome' },
        { icon: Target, label: 'Readiness', path: '/dashboard/readiness' },
        { icon: Briefcase, label: 'Jobs', path: '/dashboard/opportunities' },
        { icon: AlertTriangle, label: 'Failures', path: '/dashboard/failures' },
        { icon: Lightbulb, label: 'Projects', path: '/dashboard/project-generator' },
        { icon: Compass, label: 'Skill Gap', path: '/dashboard/skill-gap' },
        { icon: Video, label: 'Interview Prep', path: '/dashboard/interview-prep' },
        { icon: BrainCircuit, label: 'Integrity', path: '/dashboard/assessment' },
        { icon: Map, label: 'Roadmap', path: '/dashboard/roadmap' },
        { icon: Users, label: 'Profile', path: '/dashboard/details' },
    ];

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-50">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Dna className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent block md:hidden lg:block">
                        CGAI
                    </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[50%] lg:max-w-none">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    <button className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Bell className="h-5 w-5" />
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    <div className="hidden md:flex items-center gap-2 border-l border-border pl-2">
                        <button className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Settings className="h-5 w-5" />
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-md text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-16 left-0 right-0 border-b border-border bg-background/95 backdrop-blur-xl p-4 flex flex-col gap-1 shadow-2xl z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
                    >
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Navigation</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "text-foreground hover:bg-muted"
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                        <div className="h-px bg-border my-3" />
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Account</div>
                        <button className="flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium text-foreground hover:bg-muted w-full text-left">
                            <Settings className="h-5 w-5" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={() => {
                                logout();
                                setIsMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium text-red-500 hover:bg-red-500/10 w-full text-left"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
