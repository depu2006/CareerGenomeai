import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertCircle, FileText, Award, Briefcase, Upload, ArrowRight, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Gauge = ({ value }) => {
    const data = [
        { name: 'Score', value: value },
        { name: 'Remaining', value: 100 - value },
    ];
    const COLORS = ['#22d3ee', '#1e293b'];

    return (
        <div className="relative h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-bold text-foreground"
                >
                    {value}%
                </motion.div>
                <div className="text-muted-foreground text-sm uppercase tracking-wider mt-2">CRI Score</div>
            </div>
        </div>
    );
};

const Readiness = () => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !jobDescription) {
            setError("Please providing both a resume (PDF) and a job description.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("resume_file", file);
        formData.append("job_description", jobDescription);
        if (user?.email) {
            formData.append("email", user.email);
        }

        try {
            // Note: Calling the Python backend on port 5000
            const response = await axios.post("http://127.0.0.1:5000/career-readiness", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResult(response.data);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Analysis failed. Ensure the Python backend is running on port 5000.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-white/60 bg-clip-text text-transparent">
                    Career Readiness Index
                </h1>
                <p className="text-muted-foreground mt-1">Real-time analysis of your employability against specific job descriptions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border/50 rounded-3xl p-6 h-full flex flex-col">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Analyze Match
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
                            <div>
                                <label className="block text-sm font-medium mb-2">Upload Resume (PDF)</label>
                                <div className="border-2 border-dashed border-border rounded-xl p-4 transition-colors hover:border-primary/50 text-center cursor-pointer relative bg-secondary/5">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 py-4">
                                        <FileText className={`h-8 w-8 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-sm text-muted-foreground">
                                            {file ? file.name : "Drop PDF here or click to upload"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">Job Description</label>
                                <textarea
                                    className="w-full h-40 bg-secondary/20 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    placeholder="Paste the job description here..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="h-5 w-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Run Analysis
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2">
                    {result ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Main Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Gauge Card */}
                                <div className="bg-card border border-border/50 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-50" />
                                    <Gauge value={result.readiness_score} />
                                    <div className="mt-4 text-center">
                                        <p className="font-medium text-foreground">Readiness Score</p>
                                        <p className="text-sm text-muted-foreground">Based on skill matching</p>
                                    </div>
                                </div>

                                {/* Peer Percentile Card */}
                                <div className="bg-card border border-border/50 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50" />
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">Peer Benchmarking</h3>
                                        <div className="flex items-end gap-2 mb-4">
                                            <span className="text-5xl font-bold text-foreground">{result.peer_percentile}%</span>
                                            <span className="text-sm text-green-400 mb-2">Top Tier</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            You performed better than <span className="text-foreground font-medium">{result.peer_percentile}%</span> of candidates in our benchmark model for this role.
                                        </p>
                                        <div className="w-full bg-secondary h-2 rounded-full mt-6 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${result.peer_percentile}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="bg-purple-500 h-full rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-card border border-border/50 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-semibold">Matched Skills ({result.matched_skills_count})</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.matched_skills.length > 0 ? (
                                            result.matched_skills.map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No matches found yet.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-card border border-border/50 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-semibold">Missing from JD ({result.required_skills_count - result.matched_skills_count})</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.required_skills
                                            .filter(skill => !result.matched_skills.includes(skill))
                                            .slice(0, 10).map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">
                                                    {skill}
                                                </span>
                                            ))}
                                        {result.required_skills.length - result.matched_skills.length > 10 && (
                                            <span className="px-3 py-1 bg-secondary text-muted-foreground text-xs rounded-full">
                                                +{result.required_skills.length - result.matched_skills.length - 10} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Placeholder State
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/5">
                            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <Briefcase className="h-10 w-10 text-primary opacity-50" />
                            </div>
                            <h3 className="text-xl font-medium text-foreground mb-2">Ready to Analyze</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Upload your resume and paste a job description to see how well you match and where you stand against peers.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Readiness;
