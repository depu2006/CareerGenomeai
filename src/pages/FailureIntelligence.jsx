import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Send, Sparkles, CheckCircle, BrainCircuit, RefreshCw } from 'lucide-react';
import FailureDashboard from '../components/failures/FailureDashboard';
import { analyzeFailureStory } from '../services/failures/failureService';
import { useAuth } from '../context/AuthContext';

const FailureIntelligence = () => {
    const { user } = useAuth();
    const [userStory, setUserStory] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!userStory.trim()) return;
        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await analyzeFailureStory(userStory, user?.email);
            if (result) {
                setAnalysisResult(result);
            } else {
                setError("Could not analyze story. Please try again.");
            }
        } catch (err) {
            setError("Analysis failed. Ensure server is running.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground  flex items-center gap-3">
                    <BrainCircuit className="text-red-500" size={32} />
                    Failure Intelligence Engine
                </h1>
                <p className="text-muted-foreground mt-2 text-lg max-w-3xl">
                    Analyze your own setbacks and browse real-world failure patterns to immune-boost your career strategy.
                </p>
            </div>

            {/* SECTION 1: Analyze My Experience */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-card border border-border rounded-2xl shadow-xl reltive overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles size={120} className="text-primary" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Sparkles className="text-yellow-400" size={20} />
                            Analyze My Experience
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Paste a rejection email, interview feedback, or describe a recent failure. Our AI will diagnose the root cause and generate a success plan.
                        </p>

                        <textarea
                            className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                            placeholder="e.g. I applied to 50 jobs and got 0 callbacks..."
                            value={userStory}
                            onChange={(e) => setUserStory(e.target.value)}
                        />

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || userStory.length < 10}
                                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                                {isAnalyzing ? 'Analyzing...' : 'Generate Success Plan'}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-2 text-right">{error}</p>}
                    </div>
                </motion.div>

                {/* Result Card */}
                <div className="relative">
                    {analysisResult ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full p-8 bg-gradient-to-br from-green-500/10 to-blue-500/5 border border-green-500/20 rounded-2xl flex flex-col justify-center"
                        >
                            <div className="mb-6">
                                <div className="text-sm text-green-400 font-bold uppercase tracking-wider mb-1">Diagnosis</div>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {analysisResult.diagnosis}
                                </h3>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${analysisResult.sentiment === 'Negative' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {analysisResult.type} Pattern Detected
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Recommended Action Plan</div>
                                {analysisResult.actionPlan.map((step, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                                        <CheckCircle className="text-green-400 mt-0.5 shrink-0" size={18} />
                                        <span className="text-foreground/90 text-sm">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-2xl text-center text-muted-foreground bg-white/5">
                            <BookOpen size={48} className="mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground mb-2">Waiting for Input</h3>
                            <p className="max-w-xs text-sm">Describe your experience on the left to confirm your next success strategy.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default FailureIntelligence;
