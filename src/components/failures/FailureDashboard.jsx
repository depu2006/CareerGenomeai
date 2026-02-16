import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, TrendingDown, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { fetchFailureStories } from '../../services/failures/failureService';
import { analyzeFailureRisks } from '../../services/failures/failureAnalysis';

const FailureDashboard = () => {
    const { userProfile } = useUser();
    const [stories, setStories] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [userProfile]); // Reload if profile changes to update risk score

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchFailureStories();
            setStories(data);

            const riskData = analyzeFailureRisks(data, userProfile);
            setAnalysis(riskData);
        } catch (err) {
            console.error("Failed to load intelligence:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center text-muted-foreground animate-pulse">
                <RefreshCw className="mr-2 animate-spin" /> Analyzing widespread career failures...
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="text-red-500" /> Failure Intelligence
                    </h2>
                    <p className="text-muted-foreground max-w-2xl">
                        AI-driven analysis of real-world career setbacks. We analyze verified failure stories to help you avoid the same mistakes.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-2xl font-bold text-white">{stories.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Stories Analyzed</div>
                </div>
            </div>

            {/* Risk Meter Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personalized Risk Score */}
                <RiskCard risk={analysis.riskAnalysis} />

                {/* Most Common Pitfalls - Dynamic from Data */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CategoryCard
                        title="Resume Rejections"
                        count={analysis.categories.Resume.count}
                        icon={BookOpen}
                        color="blue"
                        desc="ATS parsing failures & formatting issues."
                    />
                    <CategoryCard
                        title="Interview Failures"
                        count={analysis.categories.Interview.count}
                        icon={TrendingDown}
                        color="orange"
                        desc="Behavioral mismatches & technical gaps."
                    />
                </div>
            </div>

            {/* Personalized Recommendations */}
            {analysis.riskAnalysis.factors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-200 mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Recommended Prevention Tactics
                    </h3>
                    <div className="grid gap-4">
                        {analysis.riskAnalysis.factors.map((factor, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h4 className="text-white font-medium">{factor.message}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{factor.action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live Feed */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Recent Failure Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stories.slice(0, 6).map(story => (
                        <StoryCard key={story.id} story={story} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Sub-components
const RiskCard = ({ risk }) => {
    const isHigh = risk.score > 50;
    const colorClass = isHigh ? 'text-red-500' : 'text-green-500';
    const bgClass = isHigh ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20';

    return (
        <div className={`p-6 rounded-xl border ${bgClass} flex flex-col justify-between h-full`}>
            <div>
                <h3 className="text-muted-foreground font-medium text-sm uppercase tracking-wider">Your Failure Risk Score</h3>
                <div className={`text-4xl font-bold mt-2 ${colorClass}`}>
                    {risk.score}% <span className="text-lg font-normal text-muted-foreground">/ 100</span>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">Risk Level</span>
                    <span className={`font-bold ${colorClass}`}>{risk.overallRisk}</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${risk.score}%` }}
                        className={`h-full ${isHigh ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Based on your profile completeness and market trends.
                    {isHigh ? ' Action is recommended to reduce rejection probability.' : ' You are well-positioned.'}
                </p>
            </div>
        </div>
    );
};

const CategoryCard = ({ title, count, icon: Icon, color, desc }) => (
    <div className="p-6 bg-card border border-border/50 rounded-xl hover:border-primary/50 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                <Icon size={20} />
            </div>
            <span className="text-2xl font-bold text-white">{count}</span>
        </div>
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
);

const StoryCard = ({ story }) => (
    <div className="group p-5 bg-card border border-border/50 rounded-xl hover:bg-white/5 transition-all cursor-default">
        <div className="flex justify-between items-start mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                ${story.category === 'Resume' ? 'bg-blue-500/20 text-blue-400' :
                    story.category === 'Interview' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'}`}>
                {story.category}
            </span>
            <span className="text-[10px] text-muted-foreground">{story.source} • {story.date}</span>
        </div>
        <h4 className="text-sm font-semibold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
            {story.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
            {story.text}
        </p>
        <a
            href={story.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
        >
            Read Source <ExternalLink size={10} />
        </a>
    </div>
);

export default FailureDashboard;
