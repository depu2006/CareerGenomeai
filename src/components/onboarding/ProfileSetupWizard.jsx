import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Github, Linkedin, Briefcase, CheckCircle2, ArrowRight } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { fetchGitHubData } from '../../services/genomeService';

const steps = [
    { id: 'resume', title: 'Upload Resume', icon: Upload },
    { id: 'socials', title: 'Connect Accounts', icon: Github },
    { id: 'domain', title: 'Select Domain', icon: Briefcase },
    { id: 'review', title: 'Review & Confirm', icon: CheckCircle2 }
];

const DOMAINS = [
    'Software Engineer',
    'Data Scientist',
    'Product Manager',
    'AI Engineer',
    'Marketing Manager',
    'UI/UX Designer',
    'Analyst'
];

const ProfileSetupWizard = ({ onComplete }) => {
    const { updateProfile } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        resumeText: '',
        githubUsername: '',
        linkedinUrl: '',
        domain: '',
        skills: []
    });
    const [loading, setLoading] = useState(false);

    const handleNext = async () => {
        if (currentStep === 1 && formData.githubUsername) {
            setLoading(true);
            try {
                // Validate GitHub
                const ghData = await fetchGitHubData(formData.githubUsername);
                if (ghData) {
                    // Auto-extract skills from GH if possible
                    updateProfile({ githubStats: ghData });
                }
            } catch (e) {
                console.error("GH Fetch failed", e);
            }
            setLoading(false);
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(curr => curr + 1);
        } else {
            // Finish
            updateProfile(formData);
            onComplete();
        }
    };

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1 bg-secondary w-full">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Build Your Career Profile</h2>
                    <p className="text-muted-foreground">Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="min-h-[200px]"
                    >
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-white">Paste Resume Text (for parsing)</label>
                                <textarea
                                    className="w-full h-40 bg-background/50 border border-border rounded-lg p-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Paste your full resume content here..."
                                    value={formData.resumeText}
                                    onChange={e => setFormData({ ...formData, resumeText: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    * We use this to extract skills and experience for the Fit Score.
                                </p>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                                        <Github size={16} /> GitHub Username
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-background/50 border border-border rounded-lg p-3 text-white"
                                        placeholder="e.g. octocat"
                                        value={formData.githubUsername}
                                        onChange={e => setFormData({ ...formData, githubUsername: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                                        <Linkedin size={16} /> LinkedIn URL
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-background/50 border border-border rounded-lg p-3 text-white"
                                        placeholder="https://linkedin.com/in/..."
                                        value={formData.linkedinUrl}
                                        onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="grid grid-cols-2 gap-3">
                                {DOMAINS.map(domain => (
                                    <button
                                        key={domain}
                                        onClick={() => setFormData({ ...formData, domain })}
                                        className={`p-4 rounded-xl border text-left transition-all ${formData.domain === domain
                                                ? 'bg-primary/20 border-primary text-white'
                                                : 'bg-background/50 border-border/50 text-muted-foreground hover:bg-white/5'
                                            }`}
                                    >
                                        {domain}
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 text-center">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={40} className="text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Ready to Explore!</h3>
                                <p className="text-muted-foreground">
                                    We have analyzed your profile. Click below to see live opportunities matched to your genome.
                                </p>
                                <div className="bg-secondary/10 p-4 rounded-lg text-left text-sm space-y-2">
                                    <p><span className="text-muted-foreground">Domain:</span> <span className="text-white">{formData.domain}</span></p>
                                    <p><span className="text-muted-foreground">GitHub:</span> <span className="text-white">{formData.githubUsername || 'Not connected'}</span></p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <div className="mt-8 flex justify-between">
                    <button
                        onClick={() => setCurrentStep(c => Math.max(0, c - 1))}
                        disabled={currentStep === 0}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-white disabled:opacity-0"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading || (currentStep === 0 && !formData.resumeText) || (currentStep === 2 && !formData.domain)}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Validating...' : currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                        {!loading && currentStep < steps.length - 1 && <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetupWizard;
