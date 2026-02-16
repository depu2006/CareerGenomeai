import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, FileText, Github, Save, CheckCircle, RefreshCw, Upload, School, MapPin, Mail, Award, Target } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { fetchGitHubData } from '../services/genomeService';

const YourDetails = () => {
    const { userProfile, updateProfile, extractSkillsFromResume } = useUser();

    // Local state for form handling to prevent context thrashing on every keystroke
    const [formData, setFormData] = useState(userProfile);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('identity'); // identity, career, resume, digital
    const [parseStatus, setParseStatus] = useState('');

    // Sync local state with context on mount
    useEffect(() => {
        setFormData(userProfile);
    }, [userProfile]);

    const handleChange = (section, field, value) => {
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate network delay for feel
        await new Promise(r => setTimeout(r, 600));
        updateProfile(formData);
        setIsSaving(false);
    };

    const handleResumeParse = async () => {
        setParseStatus('Analyzing text...');
        await new Promise(r => setTimeout(r, 1000));
        const result = extractSkillsFromResume(formData.resumeText);
        setParseStatus(`Extracted ${result.skills.length} skills & ${result.experience} years exp.`);
        setTimeout(() => setParseStatus(''), 3000);
    };

    const handleGithubFetch = async () => {
        if (!formData.githubUsername) return;
        setParseStatus('Fetching GitHub...');
        const data = await fetchGitHubData(formData.githubUsername);
        if (data) {
            updateProfile({
                githubStats: {
                    repos: data.repos,
                    stars: data.stars,
                    languages: data.languages,
                    bio: data.userData.bio
                }
            });
            setParseStatus('GitHub synced successfully!');
        } else {
            setParseStatus('User not found.');
        }
        setTimeout(() => setParseStatus(''), 3000);
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all w-full text-left
                ${activeTab === id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'}`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Your Details</h1>
                    <p className="text-muted-foreground">
                        Manage your persistent profile. This data powers your AI Genome scores.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Tabs */}
                <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2 h-fit">
                    <TabButton id="identity" label="Identity & Education" icon={User} />
                    <TabButton id="career" label="Career Targets" icon={TargetIcon} />
                    <TabButton id="resume" label="Resume Intelligence" icon={FileText} />
                    <TabButton id="digital" label="Digital Footprint" icon={Github} />
                </div>

                {/* Main Content Form */}
                <div className="lg:col-span-3">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border/50 rounded-xl p-6 md:p-8 space-y-6"
                    >
                        {/* --- IDENTITY SECTION --- */}
                        {activeTab === 'identity' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                    <School className="text-primary" /> Personal & Education
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Full Name"
                                        value={formData.name}
                                        onChange={(e) => handleChange(null, 'name', e.target.value)}
                                        icon={User}
                                    />
                                    <Input
                                        label="Email Address"
                                        value={formData.email}
                                        onChange={(e) => handleChange(null, 'email', e.target.value)}
                                        icon={Mail}
                                    />
                                    <Input
                                        label="College / University"
                                        value={formData.education?.college}
                                        onChange={(e) => handleChange('education', 'college', e.target.value)}
                                        icon={School}
                                    />
                                    <Input
                                        label="Year of Graduation"
                                        value={formData.education?.year}
                                        onChange={(e) => handleChange('education', 'year', e.target.value)}
                                        type="number"
                                        icon={Award}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- CAREER SECTION --- */}
                        {activeTab === 'career' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                    <Briefcase className="text-primary" /> Career Preferences
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Target Role</label>
                                        <select
                                            className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            value={formData.domain}
                                            onChange={(e) => handleChange(null, 'domain', e.target.value)}
                                        >
                                            <option value="">Select a primary role...</option>
                                            <option value="Software Engineer">Software Engineer</option>
                                            <option value="Data Scientist">Data Scientist</option>
                                            <option value="Product Manager">Product Manager</option>
                                            <option value="Designer">UI/UX Designer</option>
                                            <option value="Marketing">Digital Marketing</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Preferred Locations (comma separated)"
                                        value={formData.preferences?.locations?.join(', ')}
                                        onChange={(e) => handleChange('preferences', 'locations', e.target.value.split(', '))}
                                        icon={MapPin}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- RESUME SECTION --- */}
                        {activeTab === 'resume' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                        <FileText className="text-primary" /> Resume Intelligence
                                    </h2>
                                    {parseStatus && <span className="text-green-400 text-sm font-medium animate-pulse">{parseStatus}</span>}
                                </div>

                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary/80">
                                    <p>Paste your full resume text here. Our local AI will extract skills, experience years, and project depth automatically.</p>
                                </div>

                                <textarea
                                    className="w-full h-64 bg-background/50 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                                    placeholder="Paste resume content here..."
                                    value={formData.resumeText}
                                    onChange={(e) => handleChange(null, 'resumeText', e.target.value)}
                                />

                                <button
                                    onClick={handleResumeParse}
                                    className="w-full py-3 bg-muted/50 hover:bg-white/10 border border-border hover:border-primary/50 text-foreground rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={16} /> Run Analysis
                                </button>
                            </div>
                        )}

                        {/* --- DIGITAL FOOTPRINT --- */}
                        {activeTab === 'digital' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                    <Github className="text-primary" /> Digital Footprint
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Input
                                            label="GitHub Username"
                                            value={formData.githubUsername}
                                            onChange={(e) => handleChange(null, 'githubUsername', e.target.value)}
                                            icon={Github}
                                        />
                                        <button
                                            onClick={handleGithubFetch}
                                            className="w-full py-2 bg-muted/50 hover:bg-white/10 border border-border text-foreground rounded-lg font-medium transition-all text-sm"
                                        >
                                            Fetch GitHub Stats
                                        </button>
                                    </div>
                                    <Input
                                        label="LinkedIn URL"
                                        value={formData.linkedinUrl}
                                        onChange={(e) => handleChange(null, 'linkedinUrl', e.target.value)}
                                        icon={LinkIcon}
                                    />
                                </div>

                                {/* Stats Preview */}
                                {userProfile.githubStats && (
                                    <div className="mt-4 p-5 bg-background/50 rounded-xl border border-border space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                                                {formData.githubUsername?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-foreground">{formData.githubUsername}</h3>
                                                {userProfile.githubStats.bio && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{userProfile.githubStats.bio}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-center py-2 border-y border-border/50">
                                            <div>
                                                <div className="text-2xl font-bold text-foreground">{userProfile.githubStats.repos}</div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Repos</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-foreground">{userProfile.githubStats.stars}</div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Stars</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-foreground">{userProfile.githubStats.languages?.length || 0}</div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Languages</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Top Languages</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {userProfile.githubStats.languages?.slice(0, 5).map(lang => (
                                                    <span key={lang} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                                        {lang}
                                                    </span>
                                                ))}
                                                {(userProfile.githubStats.languages?.length > 5) && (
                                                    <span className="px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs font-medium border border-border">
                                                        +{userProfile.githubStats.languages.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const Input = ({ label, value, onChange, icon: Icon, type = "text" }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="relative group">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                placeholder={`Enter ${label}...`}
            />
        </div>
    </div>
);

const TargetIcon = ({ size }) => <Target size={size} />;
const LinkIcon = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;

export default YourDetails;
