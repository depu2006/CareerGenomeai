import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, CheckCircle, XCircle, Play, RotateCcw, Award } from 'lucide-react';
import { cn } from '../utils/cn';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

const SkillAssessment = () => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('Frontend Developer');
    const [summary, setSummary] = useState({});
    const [seenQuestions, setSeenQuestions] = useState([]);

    // Roles for selection
    const ROLES = [
        "Frontend Developer",
        "Backend Developer",
        "Fullstack Developer",
        "Data Scientist",
        "AI/ML Engineer",
        "DevOps Engineer",
        "Mobile App Developer",
        "Blockchain Engineer",
        "Product Manager",
        "QA Engineer"
    ];

    const fetchQuestions = async () => {
        setLoading(true);
        setAnswered(false);
        setCurrentIndex(0);
        setQuestions([]);
        try {
            const res = await fetch('http://127.0.0.1:5000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: role,
                    exclude: seenQuestions,
                    amount: 10 // Request full batch for "Mock Experience"
                })
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setQuestions(data);
                setSeenQuestions(prev => [...new Set([...prev, ...data.map(q => q.question)])]);
            } else if (data.question) {
                // Handle single question fallback
                setQuestions([data]);
            }
        } catch (err) {
            console.error("Backend Error:", err);
            // Fallback for demo if backend fails
            setQuestions([
                {
                    question: "What is the complexity of Binary Search?",
                    answer: "O(log n)",
                    options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"]
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (choice) => {
        if (answered || !questions[currentIndex]) return;
        setAnswered(true);

        const currentQuiz = questions[currentIndex];
        const isCorrect = choice === currentQuiz.answer;

        const text = (currentQuiz.question + " " + currentQuiz.answer).toLowerCase();
        let detectedTopic = role;
        if (text.includes("python")) detectedTopic = "Python";
        else if (text.includes("java") && !text.includes("javascript")) detectedTopic = "Java";
        else if (text.includes("javascript") || text.includes("js")) detectedTopic = "JavaScript";
        else if (text.includes("linux") || text.includes("unix") || text.includes("bash")) detectedTopic = "Linux/OS";
        else if (text.includes("html") || text.includes("css") || text.includes("web") || text.includes("dom")) detectedTopic = "Web Tech";
        else if (text.includes("sql") || text.includes("database")) detectedTopic = "Database";

        setSummary(prev => {
            const current = prev[detectedTopic] || { total: 0, correct: 0 };
            return {
                ...prev,
                [detectedTopic]: {
                    total: current.total + 1,
                    correct: isCorrect ? current.correct + 1 : current.correct
                }
            };
        });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setAnswered(false);
        } else {
            setIsFinished(true);
        }
    };

    const saveResults = async () => {
        if (Object.keys(summary).length === 0) return;
        try {
            await fetch('http://127.0.0.1:5000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user?.email,
                    summary: summary
                })
            });
        } catch (e) {
            console.error("Failed to save results", e);
        }
    };

    const generatePDF = () => {
        saveResults(); // Save when generating PDF/Finish
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Career Genome - Integrity Check Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);

        const tableData = Object.keys(summary).map(topic => {
            const item = summary[topic];
            const percent = ((item.correct / item.total) * 100).toFixed(0);
            return [topic, item.total, item.correct, `${percent}%`];
        });

        doc.autoTable({
            startY: 40,
            head: [['Topic', 'Questions', 'Correct', 'Accuracy']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] }
        });

        doc.save('Skill_Integrity_Report.pdf');
    };

    if (isFinished) {
        return (
            <div className="space-y-8 p-6 max-w-4xl mx-auto">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
                        Final Honesty Report
                    </h1>
                    <p className="text-muted-foreground">
                        Your verified skill integrity profile. Download this report to attach to your profile.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-6 shadow-2xl"
                >
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="p-4 text-muted-foreground font-medium">Topic</th>
                                <th className="p-4 text-muted-foreground font-medium">Answered</th>
                                <th className="p-4 text-muted-foreground font-medium">Correct</th>
                                <th className="p-4 text-muted-foreground font-medium">Accuracy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(summary).length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No questions answered.</td></tr>
                            ) : (
                                Object.keys(summary).filter(t => t.trim() !== "").map(topic => {
                                    const item = summary[topic];
                                    const percent = ((item.correct / item.total) * 100).toFixed(0);
                                    return (
                                        <tr key={topic} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                            <td className="p-4 font-semibold text-foreground">{topic}</td>
                                            <td className="p-4 text-foreground">{item.total}</td>
                                            <td className="p-4 text-foreground">{item.correct}</td>
                                            <td className={cn("p-4 font-bold", percent >= 70 ? "text-green-500" : "text-red-500")}>
                                                {percent}%
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    <div className="mt-8 flex gap-4 justify-end">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                        >
                            <RotateCcw size={18} />
                            Restart Session
                        </button>
                        <button
                            onClick={generatePDF}
                            disabled={Object.keys(summary).length === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                        >
                            <Award size={18} />
                            Download Report
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-6">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
                    <BrainCircuit className="text-primary" size={40} />
                    Skill Integrity Check
                </h1>
                <p className="text-muted-foreground text-lg">
                    Real-time technical trivia to validate your knowledge depth.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden min-h-[400px] flex flex-col justify-center shadow-lg"
            >
                {questions.length === 0 ? (
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BrainCircuit size={40} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Technical Mock Interview</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Assess your skills with a real-time 10-question evaluation.
                            Select your role to generate a comprehensive technical session.
                        </p>

                        <div className="max-w-xs mx-auto space-y-2 text-left">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                Target Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                                {ROLES.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={fetchQuestions}
                            disabled={loading}
                            className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-primary/25 flex items-center gap-2 mx-auto"
                        >
                            {loading ? "Preparing Batch..." : "Begin Mock Interview"}
                            {!loading && <Play size={20} fill="currentColor" />}
                        </button>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto w-full">
                        <div className="mb-8 flex justify-between items-end">
                            <div className="space-y-1">
                                <span className="text-xs font-bold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                                    Question {currentIndex + 1} of {questions.length}
                                </span>
                                <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden mt-4">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-medium text-muted-foreground">{role}</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-foreground mt-4 leading-relaxed">
                                {htmlDecode(questions[currentIndex].question)}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {questions[currentIndex].options.map((opt, i) => {
                                const isAnswer = opt === questions[currentIndex].answer;
                                let btnClass = "p-4 rounded-xl border border-border text-left font-medium transition-all hover:bg-muted text-foreground";

                                if (answered) {
                                    if (isAnswer) btnClass = "p-4 rounded-xl border border-green-500 bg-green-500/10 text-green-500 font-bold";
                                    else btnClass = "p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-muted-foreground opacity-50";
                                }

                                return (
                                    <button
                                        key={`opt-${currentIndex}-${i}`}
                                        onClick={() => handleAnswer(opt)}
                                        disabled={answered}
                                        className={btnClass}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
                                                answered && isAnswer ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/30"
                                            )}>
                                                {answered && isAnswer ? <CheckCircle size={14} /> : <span className="text-xs">{String.fromCharCode(65 + i)}</span>}
                                            </div>
                                            {htmlDecode(opt)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {answered && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 flex justify-end gap-4 border-t border-border pt-6"
                            >
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    {currentIndex < questions.length - 1 ? "Next Question" : "See Final Summary"}
                                    <Play size={16} fill="currentColor" />
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// Helper to decode HTML entities
function htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

export default SkillAssessment;
