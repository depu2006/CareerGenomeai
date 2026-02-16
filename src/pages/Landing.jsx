import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Dna, Target, Zap } from 'lucide-react';
import DNAHelix from '../components/genome/DNAHelix';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="p-6 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl hover:bg-card hover:border-primary/20 transition-all group"
    >
        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon className="text-primary h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </motion.div>
);

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0 mix-blend-overlay"></div>
            <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-[hsl(var(--blob-1))]/50 dark:from-primary/5 via-transparent to-transparent pointer-events-none z-0 mix-blend-multiply dark:mix-blend-normal"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--blob-2))]/50 dark:bg-accent/5 blur-[100px] rounded-full pointer-events-none translate-y-1/3 mix-blend-multiply dark:mix-blend-normal z-0"></div>

            {/* Navbar Placeholder */}
            <nav className="relative z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Dna className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                        Career Genome AI
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">Features</a>
                        <a href="#" className="hover:text-primary transition-colors">Stats</a>
                        <a href="#" className="hover:text-primary transition-colors">Pricing</a>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-5 py-2 rounded-full bg-cyan-400 text-black font-semibold text-sm hover:bg-cyan-300 transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                    >
                        Launch Dashboard
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-6">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-xs font-medium text-muted-foreground">AI-Powered Career Intelligence</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                        Predict Careers. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">Build Skills.</span> <br />
                        Unlock Opportunities.
                    </h1>

                    <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                        Your AI career co-pilot that maps your skill DNA, predicts career success, and connects you with opportunities you didn't know existed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-lg hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all flex items-center gap-2 group"
                        >
                            Launch Dashboard
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-8 py-4 rounded-xl bg-secondary/50 border border-border text-foreground font-semibold text-lg hover:bg-secondary transition-colors">
                            Watch Demo
                        </button>
                    </div>

                    <div className="mt-12 flex items-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Mock Partner Logos */}
                        <div className="font-bold text-xl">Microsoft</div>
                        <div className="font-bold text-xl">Google</div>
                        <div className="font-bold text-xl">Spotify</div>
                        <div className="font-bold text-xl">Netflix</div>
                    </div>
                </motion.div>

                {/* Hero Visual */}
                <div className="relative h-[400px] md:h-[600px] w-full block">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 rounded-full blur-[80px] md:blur-[100px]" />

                    {/* Floating Cards Mockup */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="absolute top-0 left-0 md:top-10 md:left-10 z-20 scale-75 md:scale-100"
                    >
                        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xl flex items-center gap-3 w-56 md:w-64 backdrop-blur-xl">
                            <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                <Target size={20} />
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold">92%</div>
                                <div className="text-xs text-muted-foreground">Career Match</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="absolute bottom-10 left-0 md:bottom-40 z-30 scale-75 md:scale-100"
                    >
                        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xl flex items-center gap-3 w-48 md:w-56 backdrop-blur-xl">
                            <div className="h-10 w-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <div className="text-xl md:text-2xl font-bold">340+</div>
                                <div className="text-xs text-muted-foreground">Opportunities</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 scale-75 md:scale-100"
                    >
                        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xl flex items-center gap-3 w-40 md:w-48 backdrop-blur-xl bg-opacity-80">
                            <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="text-lg font-bold">1.2k</div>
                                <div className="text-xs text-muted-foreground">Peers Analyzed</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* DNA Centered */}
                    <div className="absolute inset-0 flex items-center justify-center z-0 scale-50 md:scale-75 opacity-80">
                        <DNAHelix score="" />
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24 bg-secondary/20 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Powered by Intelligence</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Six AI-driven modules that transform how you plan, build, and navigate your career.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Dna}
                            title="AI Skill Genome"
                            description="Map your skill DNA with AI-powered analysis and career probability insights."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={Map}
                            title="Career Path AI"
                            description="Generate personalized career roadmaps with step-by-step milestones."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={Target}
                            title="Readiness Index"
                            description="Real-time career readiness scoring across skills, resume, and projects."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon={Users}
                            title="Peer Benchmarking"
                            description="See how you compare with peers in your branch, year, and target role."
                            delay={0.4}
                        />
                        <FeatureCard
                            icon={Briefcase}
                            title="Opportunity Hub"
                            description="Discover jobs, internships, hackathons, and fellowships matched to you."
                            delay={0.5}
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Failure Prevention"
                            description="AI-powered early warning system for career risks and skill stagnation."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

// Missing imports handled here for simplified example, but should be at top
import { Map, Briefcase, Users } from 'lucide-react';

export default Landing;
