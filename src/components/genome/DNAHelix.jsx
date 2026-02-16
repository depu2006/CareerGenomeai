import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DNAHelix = ({ score = 92.4 }) => {
    const [points, setPoints] = useState([]);

    // Configuration for the helix
    const numPoints = 30; // Number of base pairs
    const amplitude = 40; // Width of the helix
    const frequency = 0.2; // Frequency of the sine wave
    const speed = 0.05; // speed of rotation

    useEffect(() => {
        let phase = 0;
        const interval = setInterval(() => {
            phase += speed;
            const newPoints = Array.from({ length: numPoints }, (_, i) => {
                const y = i * 14; // Vertical spacing
                // Calculate horizontal positions based on sine/cosine for 3D effect
                // Strand 1
                const x1 = Math.sin(i * frequency + phase) * amplitude;
                const z1 = Math.cos(i * frequency + phase); // Z-index proxy for scale/opacity

                // Strand 2 (offset by PI)
                const x2 = Math.sin(i * frequency + phase + Math.PI) * amplitude;
                const z2 = Math.cos(i * frequency + phase + Math.PI);

                return { id: i, y, x1, z1, x2, z2 };
            });
            setPoints(newPoints);
        }, 16); // ~60fps

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-[500px] w-full flex items-center justify-center overflow-hidden">
            <div className="relative w-64 h-full flex flex-col justify-center items-center">

                {/* 3D Helix Structure */}
                <div className="relative w-full h-[450px]">
                    {points.map((p) => (
                        <React.Fragment key={p.id}>
                            {/* Connector Line (only drawn when visible to avoid clutter, though always rendered here for simplicity) */}
                            <motion.div
                                className="absolute left-1/2 bg-gradient-to-r from-cyan-500/30 to-purple-500/30"
                                style={{
                                    top: p.y,
                                    left: `calc(50% + ${Math.min(p.x1, p.x2)}px)`,
                                    width: Math.abs(p.x1 - p.x2),
                                    height: '1px',
                                    opacity: 0.3,
                                    zIndex: 0
                                }}
                            />

                            {/* Strand 1 Particle */}
                            <motion.div
                                className="absolute rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                style={{
                                    top: p.y,
                                    left: `calc(50% + ${p.x1}px)`,
                                    width: p.z1 > 0 ? 8 : 6, // Perspective scaling
                                    height: p.z1 > 0 ? 8 : 6,
                                    backgroundColor: p.z1 > 0 ? '#22d3ee' : '#0e7490', // Cyan: Bright front, Dark back
                                    opacity: p.z1 > 0 ? 1 : 0.4, // Depth of field
                                    zIndex: p.z1 > 0 ? 10 : 1,
                                }}
                            />

                            {/* Strand 2 Particle */}
                            <motion.div
                                className="absolute rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                                style={{
                                    top: p.y,
                                    left: `calc(50% + ${p.x2}px)`,
                                    width: p.z2 > 0 ? 8 : 6,
                                    height: p.z2 > 0 ? 8 : 6,
                                    backgroundColor: p.z2 > 0 ? '#a855f7' : '#581c87', // Purple: Bright front, Dark back
                                    opacity: p.z2 > 0 ? 1 : 0.4,
                                    zIndex: p.z2 > 0 ? 10 : 1,
                                }}
                            />
                        </React.Fragment>
                    ))}
                </div>

                {/* Score Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                        >
                            {score}%
                        </motion.div>
                        <div className="text-xs font-semibold text-cyan-400 tracking-[0.2em] uppercase mt-2">
                            Genome Match
                        </div>
                    </div>
                </div>

            </div>

            {/* Background glow for atmosphere */}
            <div className="absolute inset-0 bg-cyan-500/5 blur-[80px] pointer-events-none rounded-full" />
        </div>
    );
};

export default DNAHelix;
