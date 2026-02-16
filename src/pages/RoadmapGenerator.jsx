import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Compass,
    Search,
    BookOpen,
    Youtube,
    ChevronRight,
    Map,
    Sparkles,
    Briefcase,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Layers
} from "lucide-react";

const Node = ({ node, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(level < 1);

    return (
        <div className={`mt-2 ${level > 0 ? "ml-6 border-l border-primary/20 pl-4" : ""}`}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${level === 0
                        ? "bg-primary/10 border border-primary/20 font-bold text-primary"
                        : "hover:bg-muted/50 text-foreground/80"
                    }`}
            >
                {node.children && node.children.length > 0 && (
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={14} />
                    </motion.div>
                )}
                <Layers size={14} className="text-primary/60" />
                <span className="text-sm">{node.title}</span>
            </div>

            <AnimatePresence>
                {isOpen && node.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {node.children.map((child, index) => (
                            <Node key={index} node={child} level={level + 1} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const RoadmapGenerator = () => {
    const [topic, setTopic] = useState("");
    const [roadmap, setRoadmap] = useState(null);
    const [topicLinks, setTopicLinks] = useState(null);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [roleResources, setRoleResources] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("topic");

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/roles")
            .then(res => res.json())
            .then(data => setRoles(data))
            .catch(err => console.error("Error fetching roles:", err));
    }, []);

    const fetchTopic = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch("http://127.0.0.1:5000/api/topic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic })
            });

            const result = await response.json();
            if (response.ok) {
                setRoadmap(result.structure);
                setTopicLinks({
                    documentation: result.documentation,
                    video: result.video
                });
            } else {
                setError(result.error || "Failed to generate roadmap");
            }
        } catch (err) {
            setError("Server connection failed");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRole = async () => {
        if (!selectedRole) return;
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch("http://127.0.0.1:5000/api/role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: selectedRole })
            });

            const result = await response.json();
            if (response.ok) {
                setRoleResources(result.resources);
            } else {
                setError(result.error || "Failed to fetch role info");
            }
        } catch (err) {
            setError("Server connection failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-3xl shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5">
                        <Map className="text-primary h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roadmap Generator</h1>
                        <p className="text-muted-foreground mt-2">AI-powered career paths and learning guides</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 bg-muted/30 p-1.5 rounded-2xl w-fit border border-border">
                <button
                    onClick={() => setActiveTab("topic")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "topic"
                            ? "bg-card text-primary shadow-sm border border-border/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                >
                    <Search size={16} />
                    Topic Based
                </button>
                <button
                    onClick={() => setActiveTab("role")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "role"
                            ? "bg-card text-primary shadow-sm border border-border/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                >
                    <Briefcase size={16} />
                    Role Based
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Controls */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card border border-border p-8 rounded-3xl shadow-lg sticky top-8"
                    >
                        {activeTab === "topic" ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-primary mb-2">
                                    <Sparkles size={20} />
                                    <h2 className="font-bold text-lg">Explore a Topic</h2>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Enter any technology or subject to generate a structured learning path sourced from Wikipedia and curated for developers.
                                </p>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="e.g. React, Python, Blockchain"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && fetchTopic()}
                                        className="w-full bg-muted/50 border border-border rounded-2xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground/50"
                                    />
                                    <button
                                        onClick={fetchTopic}
                                        disabled={isLoading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-primary mb-2">
                                    <Briefcase size={20} />
                                    <h2 className="font-bold text-lg">Target a Role</h2>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Select a professional role to see the top technical skills required based on O*NET industry standards.
                                </p>
                                <div className="space-y-4">
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground appearance-none cursor-pointer"
                                    >
                                        <option value="">Select a Professional Role</option>
                                        {roles.map((role, index) => (
                                            <option key={index} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={fetchRole}
                                        disabled={isLoading || !selectedRole}
                                        className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        Generate Roadmap <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm"
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Results Display */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border border-dashed"
                            >
                                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-muted-foreground animate-pulse">Mapping out your path...</p>
                            </motion.div>
                        ) : activeTab === "topic" ? (
                            roadmap ? (
                                <motion.div
                                    key="topic-results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-card border border-border p-8 rounded-3xl shadow-xl">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                            <h2 className="text-2xl font-bold">{roadmap.title} Roadmap</h2>
                                            <div className="flex gap-3">
                                                {topicLinks && (
                                                    <>
                                                        <a href={topicLinks.documentation} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-xl text-sm transition-colors font-medium border border-border">
                                                            <BookOpen size={16} /> Docs
                                                        </a>
                                                        <a href={topicLinks.video} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-red-500/10 hover:text-red-500 rounded-xl text-sm transition-colors font-medium border border-border">
                                                            <Youtube size={16} /> Videos
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                                            <Node node={roadmap} />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <EmptyState icon={Compass} title="Ready to learn something new?" description="Enter a topic to generate a structured curriculum instantly." />
                            )
                        ) : (
                            roleResources.length > 0 ? (
                                <motion.div
                                    key="role-results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {roleResources.map((res, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-card border border-border p-6 rounded-3xl hover:border-primary/50 transition-all group shadow-sm hover:shadow-xl"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground">Skill #{index + 1}</span>
                                            </div>
                                            <h3 className="font-bold text-lg mb-4">{res.skill}</h3>
                                            <div className="flex gap-2">
                                                <a href={res.documentation} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted rounded-xl text-xs hover:bg-primary/10 transition-all font-medium border border-border">
                                                    <BookOpen size={14} /> Documentation
                                                </a>
                                                <a href={res.video} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted rounded-xl text-xs hover:bg-red-500/10 transition-all font-medium border border-border">
                                                    <Youtube size={14} /> Course
                                                </a>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState icon={Briefcase} title="Define your future role" description="Select a career path to discover the industry-standard technology stack you need to master." />
                            )
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ icon: Icon, title, description }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 px-8 text-center bg-card rounded-3xl border border-border border-dashed shadow-sm"
    >
        <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mb-6">
            <Icon size={40} />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-xs">{description}</p>
    </motion.div>
);

export default RoadmapGenerator;
