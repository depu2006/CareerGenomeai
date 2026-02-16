import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Github, Zap, Activity, Award, ArrowRight, RefreshCw, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import SkillGalaxy from '../components/genome/SkillDNA';
import { fetchGitHubData, parseResumeMock, calculateScores } from '../services/genomeService';
import { useUser } from '../context/UserContext';

const SkillGenome = () => {
    const { userProfile, updateProfile, extractSkillsFromResume } = useUser();
    // State for analysis flow
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [genomeData, setGenomeData] = useState(null);
    const [analysisStep, setAnalysisStep] = useState('');

    // Auto-analyze on mount
    useEffect(() => {
        handleAnalysis();
    }, [userProfile]);

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        setAnalysisStep('Analyzing Profile DNA...');

        // Simulate "Thinking" time for UX
        await new Promise(r => setTimeout(r, 800));

        try {
            setAnalysisStep('Calculating Scores...');

            // 1. Use GLOBAL Context Data (No local inputs)
            const scores = calculateScores(userProfile);

            // 2. Prepare Visualization Data
            let dnaSkills = scores.analysis.confidenceSkills || [];

            // FALLBACK: If no skills found (New User), show a default Galaxy
            if (dnaSkills.length === 0) {
                dnaSkills = [
                    { name: 'JavaScript', score: 3, status: 'strong', size: 3.5 },
                    { name: 'React', score: 3, status: 'strong', size: 3.5 },
                    { name: 'Node.js', score: 2, status: 'developing', size: 2.5 },
                    { name: 'Python', score: 2, status: 'developing', size: 2.5 },
                    { name: 'SQL', score: 1, status: 'weak', size: 1.5 },
                    { name: 'Git', score: 3, status: 'strong', size: 3.5 },
                    { name: 'HTML/CSS', score: 3, status: 'strong', size: 3.5 },
                    { name: 'TypeScript', score: 2, status: 'developing', size: 2.5 },
                    { name: 'Docker', score: 1, status: 'weak', size: 1.5 },
                    { name: 'AWS', score: 1, status: 'weak', size: 1.5 },
                    { name: 'MongoDB', score: 2, status: 'developing', size: 2.5 },
                    { name: 'GraphQL', score: 1, status: 'weak', size: 1.5 }
                ];
            }

            setGenomeData({
                skills: dnaSkills,
                scores: scores,
                details: {
                    github: userProfile.githubStats,
                    resume: userProfile.resumeData
                }
            });

        } catch (error) {
            console.error("Genome Error:", error);
        } finally {
            setIsAnalyzing(false);
            setAnalysisStep('');
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">AI Skill Genome</h1>
                <p className="text-muted-foreground">
                    Decode your professional DNA. We analyze your code, resume, and project history to visualize your true career potential.
                </p>
            </div>

            {/* Data Source Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section - READ ONLY SUMMARY */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 space-y-6"
                >
                    {/* Data Source Summary */}
                    <div className="p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm">
                        <h3 className="text-foreground font-semibold flex items-center gap-2 mb-4">
                            <Activity size={18} className="text-primary" />
                            Analysis Sources
                        </h3>

                        <div className="space-y-4">
                            {/* GitHub Status */}
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Github size={16} className={userProfile.githubUsername ? "text-green-400" : "text-muted-foreground"} />
                                    <span className="text-sm font-medium text-foreground">GitHub Data</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {userProfile.githubUsername ? 'Linked' : 'Not Linked'}
                                </span>
                            </div>

                            {/* Resume Status */}
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Upload size={16} className={userProfile.resumeText?.length > 50 ? "text-green-400" : "text-muted-foreground"} />
                                    <span className="text-sm font-medium text-foreground">Resume Data</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {userProfile.resumeData?.skills?.length || 0} Skills Found
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-4">
                                Data is pulled from your persistent profile. To update skills or repos, edit your details.
                            </p>
                            <a
                                href="/dashboard/details"
                                className="block w-full py-3 text-center bg-white/5 hover:bg-white/10 border border-border rounded-lg text-sm font-medium text-foreground transition-all"
                            >
                                Edit Profile Data
                            </a>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleAnalysis}
                        disabled={isAnalyzing}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-foreground shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {analysisStep}
                            </>
                        ) : (
                            <>
                                <RefreshCw size={20} />
                                Re-Calculate Genome
                            </>
                        )}
                    </button>

                </motion.div>

                {/* Visualization Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* DNA Viewer or Empty State */}
                    <div className="relative">
                        {genomeData?.skills?.length > 0 ? (
                            <SkillGalaxy skills={genomeData.skills} />
                        ) : (
                            <div className="w-full h-[400px] bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <Upload size={32} className="text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">No DNA Sequence Found</h3>
                                <p className="text-muted-foreground max-w-md mb-6">
                                    We need data to generate your Skill Galaxy. Add skills manually or link your GitHub to start.
                                </p>
                                <a
                                    href="/dashboard/details"
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-foreground rounded-lg font-medium transition-colors"
                                >
                                    Add Skills Now
                                </a>
                            </div>
                        )}

                        {!genomeData && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-xl z-20">
                                <p className="text-foreground/50 font-mono text-sm">Waiting for input data...</p>
                            </div>
                        )}
                    </div>

                    {/* Scores Grid */}
                    {genomeData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                            <ScoreCard
                                label="Skill Strength"
                                value={`${genomeData.scores.skillStrength}%`}
                                icon={Zap}
                                color="yellow"
                            />
                            <ScoreCard
                                label="Industry Readiness"
                                value={`${genomeData.scores.industryReadiness}%`}
                                icon={Activity}
                                color="green"
                            />
                            <ScoreCard
                                label="Career Probability"
                                value={`${genomeData.scores.careerProbability}%`}
                                icon={Award}
                                color="purple"
                            />
                        </motion.div>
                    )}

                    {/* Insights Section */}
                    {genomeData?.scores?.analysis && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
                        >
                            {/* Strengths & Gaps */}
                            <div className="space-y-6">
                                <div className="bg-card border border-green-500/20 rounded-xl p-5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-green-500/5" />
                                    <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2 relative z-10">
                                        <CheckCircle size={18} /> Major Strengths
                                    </h3>
                                    <ul className="space-y-2 relative z-10">
                                        {genomeData.scores.analysis.strengths.length > 0 ? (
                                            genomeData.scores.analysis.strengths.map((s, i) => (
                                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                                                    {s}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground">Keep building to see strengths here.</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="bg-card border border-red-500/20 rounded-xl p-5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-red-500/5" />
                                    <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2 relative z-10">
                                        <AlertTriangle size={18} /> Areas for Improvement
                                    </h3>
                                    <ul className="space-y-2 relative z-10">
                                        {genomeData.scores.analysis.gaps.length > 0 ? (
                                            genomeData.scores.analysis.gaps.map((g, i) => (
                                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                                                    {g}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-muted-foreground">No major gaps detected!</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {/* AI Tips */}
                            <div className="bg-card border border-blue-500/20 rounded-xl p-6 relative overflow-hidden h-full">
                                <div className="absolute inset-0 bg-blue-500/5" />
                                <div className="relative z-10">
                                    <h3 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
                                        <Lightbulb size={20} /> AI Recommendations
                                    </h3>
                                    <div className="space-y-4">
                                        {genomeData.scores.analysis.tips.map((tip, i) => (
                                            <div key={i} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/10 flex gap-3">
                                                <div className="shrink-0 mt-0.5">
                                                    <ArrowRight size={16} className="text-blue-400" />
                                                </div>
                                                <p className="text-sm text-gray-200 leading-relaxed">
                                                    {tip}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-blue-500/20">
                                        <p className="text-xs text-blue-300/70 italic">
                                            * Tips are generated based on market trends matching your profile.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Component for Score Cards
const ScoreCard = ({ label, value, icon: Icon, color }) => (
    <div className={`p-5 rounded-xl bg-card border border-border/50 relative overflow-hidden group`}>
        <div className={`absolute inset-0 bg-${color}-500/5 group-hover:bg-${color}-500/10 transition-colors`} />

        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-2">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</span>
                <Icon size={16} className={`text-${color}-400`} />
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight">
                {value}
            </div>
        </div>
    </div>
);

export default SkillGenome;
