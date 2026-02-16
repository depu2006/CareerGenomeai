import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Activity,
    Dna,
    Target,
    Briefcase,
    Zap,
    AlertTriangle,
    Lightbulb,
    Compass,
    Users,
    ArrowRight,
    Map,
    Bell
} from 'lucide-react';
import CareerShockAlerts from '../components/CareerShockAlerts';

const DashboardCard = ({ title, description, icon: Icon, color, path, delay }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            onClick={() => navigate(path)}
            className="group relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 cursor-pointer overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5"
        >
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                <Icon size={120} className={`text-${color}-500`} />
            </div>

            <div className="relative z-10">
                <div className={`h-14 w-14 rounded-2xl bg-${color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`text-${color}-500 h-7 w-7`} />
                </div>

                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                    {description}
                </p>

                <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Explore Module <ArrowRight className="ml-2 h-4 w-4" />
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [showAlerts, setShowAlerts] = useState(false);

    return (
        <div className="space-y-12 pb-20 relative">
            {/* Career Shock Alerts - Top Left Bell */}
            <div className="absolute top-0 left-0 z-40">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAlerts(!showAlerts)}
                    className="p-3 bg-white/80 backdrop-blur-md border border-border/50 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/5 transition-all relative group"
                >
                    <Bell className="h-6 w-6 text-amber-500" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>

                    {/* Tooltip */}
                    <span className="absolute left-14 top-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Career Shocks
                    </span>
                </motion.button>

                <AnimatePresence>
                    {showAlerts && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10, x: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute top-14 left-0 w-[500px] max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-4 z-50 no-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Market Insights</h3>
                                <button onClick={() => setShowAlerts(false)} className="text-muted-foreground hover:text-foreground">✕</button>
                            </div>
                            <CareerShockAlerts />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Hero Header */}
            <div className="text-center max-w-3xl mx-auto pt-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">{user?.name || 'Explorer'}</span>
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Your AI-powered career command center is ready. <br />
                        Select a module to accelerate your journey.
                    </p>
                </motion.div>
            </div>



            {/* Launchpad Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                    title="Skill Genome"
                    description="Visualize your unique skill DNA and discover your career potency."
                    icon={Dna}
                    color="blue"
                    path="/dashboard/genome"
                    delay={0.1}
                />
                <DashboardCard
                    title="Readiness Index"
                    description="Real-time analysis of your job readiness scoring."
                    icon={Target}
                    color="green"
                    path="/dashboard/readiness"
                    delay={0.2}
                />
                <DashboardCard
                    title="Opportunity Hub"
                    description="AI-curated jobs, internships & hackathons taking place."
                    icon={Briefcase}
                    color="cyan"
                    path="/dashboard/opportunities"
                    delay={0.3}
                />
                <DashboardCard
                    title="Failure Intelligence"
                    description="Analyze setbacks and build resilience with AI insights."
                    icon={AlertTriangle}
                    color="red"
                    path="/dashboard/failures"
                    delay={0.4}
                />
                <DashboardCard
                    title="Project Generator"
                    description="Generate portfolio-worthy projects tailored to your skills."
                    icon={Lightbulb}
                    color="yellow"
                    path="/dashboard/project-generator"
                    delay={0.5}
                />
                <DashboardCard
                    title="Skill Gap Closure"
                    description="Personalized roadmaps to bridge your skill gaps."
                    icon={Compass}
                    color="purple"
                    path="/dashboard/skill-gap"
                    delay={0.6}
                />
                <DashboardCard
                    title="Roadmap Generator"
                    description="AI-powered role-based skills and topic-based learning paths."
                    icon={Map}
                    color="orange"
                    path="/dashboard/roadmap"
                    delay={0.7}
                />
            </div>

            {/* Quick Stats / Footer Mockup */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 py-8 border-t border-border/50"
            >
                <div className="text-center">
                    <div className="text-3xl font-bold">92%</div>
                    <div className="text-sm text-muted-foreground">Profile Match</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold">12</div>
                    <div className="text-sm text-muted-foreground">Skills Verified</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold">340+</div>
                    <div className="text-sm text-muted-foreground">Opportunities</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold">Top 18%</div>
                    <div className="text-sm text-muted-foreground">Peer Ranking</div>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
