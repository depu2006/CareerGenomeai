import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Mic, MicOff, Camera, Video, Play, StopCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export default function InterviewAvatar() {
    const videoRef = useRef(null);
    const recognitionRef = useRef(null);

    const [question, setQuestion] = useState("");
    const [role, setRole] = useState("developer");
    const [index, setIndex] = useState(0);
    const [emotion, setEmotion] = useState("Detecting...");
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [processing, setProcessing] = useState(false);
    const [started, setStarted] = useState(false);

    /* ================= CAMERA ================= */

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera/Mic permission error:", err);
            }
        };
        startCamera();

        return () => {
            // Cleanup stream on unmount
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    /* ================= LOAD FACE MODELS ================= */

    useEffect(() => {
        const loadModels = async () => {
            // Use CDN for models or local public path
            const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);

                setModelsLoaded(true);
            } catch (e) {
                console.error("Failed to load face models", e);
            }
        };

        loadModels();
    }, []);

    /* ================= EMOTION DETECTION ================= */

    useEffect(() => {
        if (!modelsLoaded || !videoRef.current) return;

        const interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                    const detection = await faceapi
                        .detectSingleFace(
                            videoRef.current,
                            new faceapi.TinyFaceDetectorOptions()
                        )
                        .withFaceExpressions();

                    if (detection?.expressions) {
                        const exp = detection.expressions;
                        const topEmotion = Object.keys(exp).reduce((a, b) =>
                            exp[a] > exp[b] ? a : b
                        );
                        setEmotion(topEmotion);
                    }
                } catch (e) {
                    // Ignore detection errors (e.g. no face)
                }
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [modelsLoaded]);

    /* ================= SPEAK FUNCTION ================= */

    const speakQuestion = (text) => {
        // Cancel previous speech
        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = 1.0;
        utter.pitch = 1.0;
        window.speechSynthesis.speak(utter);
    };

    /* ================= START INTERVIEW ================= */

    const startInterview = async () => {
        try {
            setProcessing(true);
            const res = await fetch("http://127.0.0.1:5000/api/interview/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: role })
            });

            const data = await res.json();

            setQuestion(data.question || "");
            setIndex(0);
            setFinalScore(0);
            setFinished(false);
            setTranscript("");
            setStarted(true);

            if (data.question) setTimeout(() => speakQuestion(data.question), 500);

        } catch (err) {
            console.error("Start interview error:", err);
            alert("Failed to connect to interview server.");
        } finally {
            setProcessing(false);
        }
    };

    /* ================= ANSWER QUESTION ================= */

    const answerQuestion = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition not supported. Please use Chrome.");
            return;
        }

        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
            setListening(true);
            setTranscript("");
        };

        recognitionRef.current.onresult = async (event) => {
            const userAnswer = event.results[0][0].transcript;
            setTranscript(userAnswer);
            setListening(false);
            submitAnswer(userAnswer);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech error", event.error);
            setListening(false);
        };

        recognitionRef.current.onend = () => {
            setListening(false);
        };

        recognitionRef.current.start();
    };

    const submitAnswer = async (userAnswer) => {
        try {
            setProcessing(true);
            const res = await fetch(
                "http://127.0.0.1:5000/api/interview/answer",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answer: userAnswer })
                }
            );

            const data = await res.json();

            const scoreToAdd = Number(data.score || 0);
            setFinalScore(prev => prev + scoreToAdd);

            if (data.finished) {
                setFinished(true);
            } else if (data.nextQuestion) {
                setQuestion(data.nextQuestion);
                setIndex(prev => prev + 1);
                setTranscript("");
                setTimeout(() => speakQuestion(data.nextQuestion), 500);
            }

        } catch (err) {
            console.error("Answer error:", err);
        } finally {
            setProcessing(false);
        }
    }

    const safeRating =
        finalScore && !isNaN(finalScore)
            ? Math.round((finalScore / ((index + 1) * 10)) * 10) // normalized to 10 based on max possible score per question (10)
            : 0;

    return (
        <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
            {/* Left Panel: Camera & Emotion */}
            <div className="md:w-1/2 space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video border-2 border-primary/20">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        width="100%"
                        height="100%"
                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    />

                    {/* Overlay UI */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2">
                        {modelsLoaded ? (
                            <span className="text-green-400">● AI Active</span>
                        ) : (
                            <span className="text-yellow-400">● Loading Models...</span>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/10">
                        <p className="text-xs text-white/60 uppercase tracking-widest mb-1">Detected Emotion</p>
                        <p className="text-xl font-bold text-primary capitalize">{emotion}</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-primary" />
                        Interview Settings
                    </h3>

                    {!started && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Topic</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                >
                                    <option value="developer">General Developer</option>
                                    <option value="frontend">Frontend (React/JS)</option>
                                    <option value="backend">Backend (Node/API)</option>
                                    <option value="python">Python</option>
                                    <option value="sql">SQL & Databases</option>
                                    <option value="hr">HR & Behavioral</option>
                                </select>
                            </div>
                            <button
                                onClick={startInterview}
                                disabled={!modelsLoaded || processing}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? <RefreshCw className="animate-spin" /> : <Play size={18} />}
                                Start Interview Simulation
                            </button>
                        </div>
                    )}

                    {started && !finished && (
                        <button
                            onClick={() => {
                                setStarted(false);
                                setFinished(false);
                                setIndex(0);
                                setQuestion("");
                                window.speechSynthesis.cancel();
                            }}
                            className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                        >
                            <StopCircle size={18} />
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* Right Panel: Interaction */}
            <div className="md:w-1/2 flex flex-col h-full">
                <div className="flex-grow bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col justify-center text-center relative overflow-hidden">
                    {!started ? (
                        <div className="text-muted-foreground space-y-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Video size={32} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Ready to Practice?</h2>
                            <p className="max-w-md mx-auto">
                                Our AI avatar uses facial expression analysis and speech recognition to simulate a real interview environment.
                            </p>
                        </div>
                    ) : finished ? (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-green-500/20">
                                <span className="text-3xl font-bold text-green-600">{safeRating}/10</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Interview Completed</h2>
                                <p className="text-muted-foreground">Total Raw Score: {finalScore}</p>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-xl text-left text-sm space-y-2">
                                <p><strong>Feedback:</strong></p>
                                <p>{safeRating >= 8 ? "Excellent work! You showed strong knowledge." : safeRating >= 5 ? "Good effort, but review some concepts." : "Keep practicing fundamental concepts."}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setStarted(false);
                                    setFinished(false);
                                }}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90"
                            >
                                Try Another Topic
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 flex flex-col h-full">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-4">
                                <span>Question {index + 1}</span>
                                <span>{role} Track</span>
                            </div>

                            <div className="flex-grow flex items-center justify-center">
                                <h2 className="text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                                    "{question}"
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence>
                                    {transcript && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-muted/50 p-4 rounded-xl text-left border border-border/50"
                                        >
                                            <p className="text-xs font-bold text-primary mb-1 uppercase">Your Answer:</p>
                                            <p className="text-sm italic">"{transcript}"</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={answerQuestion}
                                    disabled={processing}
                                    className={`w-full py-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${listening
                                            ? "bg-red-500 text-white animate-pulse shadow-red-500/20"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                                        }`}
                                >
                                    {listening ? (
                                        <>
                                            <MicOff size={24} /> Stop & Submit
                                        </>
                                    ) : (
                                        <>
                                            <Mic size={24} /> {transcript ? "Resubmit Answer" : "Tap to Speak"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
