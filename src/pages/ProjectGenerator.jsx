import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, ArrowRight, Loader } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';

const PROJECT_TEMPLATES = [
    { tags: ["frontend", "react"], title: "E-Commerce Dashboard", problemStatement: "Small businesses struggle to track inventory.", techStack: "React, Chart.js, Tailwind, Firebase", difficulty: "Intermediate", expectedOutcome: "A responsive dashboard showing sales trends.", instructions: ["Setup React with Vite", "Install Chart.js and Tailwind", "Create dummy inventory data", "Build dashboard components"] },
    { tags: ["backend", "node"], title: "RESTful API for Task Management", problemStatement: "Developers need a reliable backend for task apps.", techStack: "Node.js, Express, MongoDB, JWT", difficulty: "Beginner", expectedOutcome: "A secured API supporting CRUD and user auth.", instructions: ["Initialize Node project", "Setup Express server", "Connect to MongoDB", "Implement JWT auth"] },
    { tags: ["fullstack", "mern"], title: "Real-time Chat Application", problemStatement: "Remote teams need instant communication tools.", techStack: "MongoDB, Express, React, Node.js, Socket.io", difficulty: "Advanced", expectedOutcome: "A chat app with live messaging and rooms.", instructions: ["Setup Socket.io for backend", "Implement chat rooms logic", "Build React frontend", "Deploy using Docker"] },
    { tags: ["ai", "python"], title: "Sentiment Analysis Tool", problemStatement: "Companies need to understand customer feedback.", techStack: "Python, Flask, NLTK, React", difficulty: "Intermediate", expectedOutcome: "A web app that visualizes sentiment.", instructions: ["Setup Flask environment", "Integrate NLTK for analysis", "Create API endpoints", "Build React visualization"] },
    { tags: ["mobile", "flutter"], title: "Fitness Tracker App", problemStatement: "Users want to track workouts and diet simply.", techStack: "Flutter, Firebase, Provider", difficulty: "Intermediate", expectedOutcome: "A mobile app with logs and progress charts.", instructions: ["Setup Flutter environment", "Configure Firebase", "Build workout logging UI", "Implement progress charts"] },
    { tags: ["data", "python"], title: "House Price Prediction", problemStatement: "Agents need accurate price estimates.", techStack: "Python, Scikit-learn, Pandas", difficulty: "Beginner", expectedOutcome: "A trained model and prediction script.", instructions: ["Load dataset with Pandas", "Clean and preprocess data", "Train Scikit-learn model", "Evaluate and test predictions"] }
];

const ProjectGenerator = () => {
    const { user } = useAuth();
    const [role, setRole] = useState('');
    const [currentSkills, setCurrentSkills] = useState('');
    const [missingSkills, setMissingSkills] = useState('');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setProjects([]);

        // Local Synthesis Logic (provided by user)
        const generateLocalProjects = () => {
            const normalizedRole = role.toLowerCase();
            const skillsToLearn = (missingSkills || "").toLowerCase();

            return PROJECT_TEMPLATES.map(project => {
                let score = 0;
                // High priority: Matching the role
                if (project.tags.some(tag => normalizedRole.includes(tag))) score += 10;
                // High priority: Matching skills the user wants to learn
                if (skillsToLearn && project.techStack.toLowerCase().includes(skillsToLearn)) score += 15;

                return { ...project, score: score + Math.random() };
            }).sort((a, b) => b.score - a.score).slice(0, 3);
        };

        try {
            // Attempt backend generation first (Node.js Backend on Port 8000)
            const response = await axios.post('http://localhost:8000/api/projects/generate', {
                role,
                currentSkills,
                missingSkills,
                email: user?.email
            });

            if (response.data.projects && response.data.projects.length > 0) {
                setProjects(response.data.projects);
            } else {
                // If backend returns empty, use local fallback
                setProjects(generateLocalProjects());
            }
        } catch (err) {
            console.error("Node.js Backend failed, using local templates:", err);
            // Fallback to local templates if backend is down
            setProjects(generateLocalProjects());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Project Generator</h1>
                <p className="text-muted-foreground">
                    Get personalized project ideas based on your role and skills to boost your portfolio.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Form */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Configure Generator
                        </h2>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Target Role
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Frontend Developer"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Current Skills
                                </label>
                                <textarea
                                    placeholder="e.g. HTML, CSS, JavaScript"
                                    value={currentSkills}
                                    onChange={(e) => setCurrentSkills(e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Skills to Improve/Learn
                                </label>
                                <textarea
                                    placeholder="e.g. React, TypeScript, Tailwind"
                                    value={missingSkills}
                                    onChange={(e) => setMissingSkills(e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-4"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        Generate Projects
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Area */}
                <div className="lg:col-span-2">
                    {error && (
                        <div className="p-4 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                            {error}
                        </div>
                    )}

                    {!loading && projects.length === 0 && !error && (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-accent/5">
                            <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Ready to generate ideas</p>
                            <p className="text-sm">Fill out the form to get started</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map((project, index) => (
                            <ProjectCard key={index} project={project} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectGenerator;
