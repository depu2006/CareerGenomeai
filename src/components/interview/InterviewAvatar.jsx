import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Mic, MicOff, Camera, Video, Play, StopCircle, RefreshCw, AlertCircle, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export default function InterviewAvatar() {
    const videoRef = useRef(null);
    const recognitionRef = useRef(null);

    const [question, setQuestion] = useState("");
    const [evaluation, setEvaluation] = useState("");
    const [difficulty, setDifficulty] = useState("Easy");
    const [role, setRole] = useState("Frontend Developer");
    const [emotion, setEmotion] = useState("Detecting...");
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [recording, setRecording] = useState(false);
    const [listening, setListening] = useState(false);
    const [spokenText, setSpokenText] = useState("");
    const [processing, setProcessing] = useState(false);
    const [started, setStarted] = useState(false);

    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);

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

    const speak = (text) => {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        window.speechSynthesis.speak(utter);
    };

    /* ----------- RECORDING LOGIC ----------- */

    const startRecording = () => {
        if (!videoRef.current?.srcObject) return;
        const stream = videoRef.current.srcObject;
        recordedChunks.current = [];

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm"
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks.current, {
                type: "video/webm"
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "interview_recording.webm";
            a.click();
        };

        mediaRecorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    /* ================= START INTERVIEW ================= */

    const startInterview = async () => {
        try {
            setProcessing(true);
            setSpokenText("");
            setEvaluation("");

            const res = await fetch("http://127.0.0.1:5000/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ difficulty, role })
            });

            const data = await res.json();
            setQuestion(data.question || "");
            setStarted(true);

            if (data.question) setTimeout(() => speak(data.question), 500);

        } catch (err) {
            console.error("Start interview error:", err);
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

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        let finalTranscript = "";

        recognitionRef.current.onstart = () => {
            setListening(true);
            setSpokenText("");
        };

        recognitionRef.current.onresult = async (event) => {
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptItem = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcriptItem + " ";
                } else {
                    interimTranscript += transcriptItem;
                }
            }

            const combinedText = finalTranscript + interimTranscript;
            setSpokenText(combinedText);

            if (combinedText.toLowerCase().includes("over")) {
                recognitionRef.current.stop();
                setListening(false);

                const cleanAnswer = combinedText
                    .replace(/over/gi, "")
                    .trim();

                evaluateAnswer(cleanAnswer);
            }
        };

        recognitionRef.current.start();
    };

    const evaluateAnswer = async (userAnswer) => {
        try {
            setProcessing(true);
            const res = await fetch("http://127.0.0.1:5000/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question,
                    answer: userAnswer
                })
            });

            const data = await res.json();
            setEvaluation(data.evaluation);
            speak("Evaluation completed.");

        } catch (err) {
            console.error("Evaluation error:", err);
        } finally {
            setProcessing(false);
        }
    }

    const nextQuestion = async () => {
        try {
            setProcessing(true);
            const res = await fetch(`http://127.0.0.1:5000/next?role=${role}&difficulty=${difficulty}`);
            const data = await res.json();

            setQuestion(data.question);
            setEvaluation("");
            setSpokenText("");
            speak(data.question);
        } catch (err) {
            console.error("Next question error:", err);
        } finally {
            setProcessing(false);
        }
    };


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
                                    <option>Frontend Developer</option>
                                    <option>Backend Developer</option>
                                    <option>Fullstack Developer</option>
                                    <option>Cloud Engineer</option>
                                    <option>DevOps Engineer</option>
                                    <option>AI Engineer</option>
                                    <option>Data Scientist</option>
                                    <option>Cybersecurity Analyst</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                >
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
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

                    {started && (
                        <div className="space-y-4">
                            {!recording ? (
                                <button
                                    onClick={startRecording}
                                    className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-lg font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Video size={18} />
                                    Start Session Recording
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="w-full bg-red-500 text-white py-3 rounded-lg font-bold animate-pulse flex items-center justify-center gap-2"
                                >
                                    <StopCircle size={18} />
                                    Stop & Save Recording
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setStarted(false);
                                    setEvaluation("");
                                    setQuestion("");
                                    setSpokenText("");
                                    window.speechSynthesis.cancel();
                                }}
                                className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Reset Session
                            </button>
                        </div>
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
                    ) : (
                        <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-4 shrink-0">
                                <span>Question Analysis</span>
                                <span>{role} • {difficulty}</span>
                            </div>

                            <div className="flex-grow flex flex-col items-center justify-center space-y-4 min-h-[100px]">
                                <h2 className="text-xl md:text-2xl font-bold leading-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                                    "{question}"
                                </h2>
                            </div>

                            <div className="space-y-4 shrink-0">
                                <AnimatePresence>
                                    {spokenText && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-muted/50 p-4 rounded-xl text-left border border-border/50"
                                        >
                                            <p className="text-xs font-bold text-primary mb-1 uppercase">Live Transcript:</p>
                                            <p className="text-sm italic">"{spokenText}"</p>
                                            {listening && (
                                                <p className="text-[10px] text-muted-foreground mt-2 animate-pulse">
                                                    Say <strong>"over"</strong> to submit for AI evaluation...
                                                </p>
                                            )}
                                        </motion.div>
                                    )}

                                    {evaluation && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-primary/5 p-5 rounded-xl text-left border border-primary/20 space-y-4 shadow-inner"
                                        >
                                            <p className="text-xs font-bold text-primary uppercase flex items-center gap-2 border-b border-primary/10 pb-2">
                                                <BrainCircuit size={14} /> AI Evaluation Results
                                            </p>
                                            <div className="text-sm prose prose-sm dark:prose-invert max-h-48 overflow-y-auto">
                                                <pre className="whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed">
                                                    {evaluation}
                                                </pre>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={answerQuestion}
                                        disabled={processing || listening}
                                        className={`py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg ${listening
                                            ? "bg-red-500 text-white animate-pulse shadow-red-500/20 col-span-2"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                                            }`}
                                    >
                                        {listening ? (
                                            <>
                                                <MicOff size={20} /> Listening...
                                            </>
                                        ) : (
                                            <>
                                                <Mic size={20} /> {spokenText ? "Re-record" : "Start Answer"}
                                            </>
                                        )}
                                    </button>

                                    {!listening && (
                                        <button
                                            onClick={nextQuestion}
                                            disabled={processing}
                                            className="py-4 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Play size={20} /> Next Question
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
