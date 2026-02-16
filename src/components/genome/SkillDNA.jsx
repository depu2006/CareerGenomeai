import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Html, OrbitControls, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';

const SkillNode = ({ position, color, label, size = 0.3, isGap = false }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        // Float animation
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002;
    });

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isGap ? 0.8 : 0.4}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>

            {/* Glowing Ring for Gaps */}
            {isGap && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[size * 1.4, size * 1.6, 32]} />
                    <meshBasicMaterial color={color} opacity={0.5} transparent side={THREE.DoubleSide} />
                </mesh>
            )}

            <Html distanceFactor={12}>
                <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border ${isGap ? 'border-red-500/30 bg-red-950/40 text-red-200' : 'border-green-500/30 bg-green-950/40 text-green-200'} text-xs font-semibold whitespace-nowrap shadow-xl transform hover:scale-110 transition-transform cursor-default select-none`}>
                    {label}
                </div>
            </Html>
        </group>
    );
};

const SolarSystem = ({ skills, hasGaps }) => {
    const groupRef = useRef();

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001; // Slow overall rotation
        }
    });

    const nodes = useMemo(() => {
        const computed = [];

        // Sort skills: Highest score (confidence) closest to center
        // Filter out gaps entirely as per strict request
        const activeSkills = skills.filter(s => !s.isGap && s.status !== 'gap');

        activeSkills.forEach((skill, i) => {
            // Orbit Logic:
            // Score 3+ (Strong) -> Inner Orbit (Radius 3-4)
            // Score 2 (Developing) -> Middle Orbit (Radius 4.5-6)
            // Score 1 (Weak) -> Outer Orbit (Radius 6.5-8)

            let baseRadius = 7;
            if (skill.score >= 3) baseRadius = 3.5;
            else if (skill.score >= 2) baseRadius = 5;

            // Add random variation to prevent perfect rings
            const radius = baseRadius + Math.random() * 1.5;

            // Distribute angles evenly but with random offsets per layer
            const angle = (i / activeSkills.length) * Math.PI * 2 * (i % 2 === 0 ? 1 : -1) + (Math.random());

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Color Logic Matches Confidence Status
            let color = '#fca5a5'; // Red-ish (Weak)
            if (skill.status === 'strong') color = '#4ade80'; // Green
            else if (skill.status === 'developing') color = '#facc15'; // Yellow

            computed.push({
                ...skill,
                pos: [x, (Math.random() - 0.5) * 2, z],
                color: color,
                size: (skill.size || 1) * 0.15 + 0.1, // Scale size: 0.25 to 0.7
                isGap: false
            });
        });

        return computed;
    }, [skills]);

    return (
        <group ref={groupRef}>
            {/* Central Core (The User) */}
            <mesh>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={0.8} />
            </mesh>
            <pointLight position={[0, 0, 0]} intensity={2} color="#60a5fa" distance={15} />

            {/* Orbit Rings (Visual Guide) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[3.4, 3.5, 64]} />
                <meshBasicMaterial color="#4ade80" opacity={0.1} transparent side={THREE.DoubleSide} />
            </mesh>

            {hasGaps && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[6.4, 6.5, 64]} />
                    <meshBasicMaterial color="#ef4444" opacity={0.1} transparent side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* Nodes */}
            {nodes.map((node, i) => (
                <group key={i}>
                    <SkillNode
                        position={node.pos}
                        color={node.color}
                        label={node.name}
                        size={node.size}
                        isGap={node.isGap}
                    />
                    {/* Connection Line to Center (Only for strong skills) */}
                    {!node.isGap && (
                        <line geometry={new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(...node.pos)])}>
                            <lineBasicMaterial color={node.color} opacity={0.15} transparent />
                        </line>
                    )}
                </group>
            ))}
        </group>
    );
};

const SkillDNA = ({ skills = [] }) => {
    const hasGaps = useMemo(() => skills.some(s => s.status === 'gap'), [skills]);

    return (
        <div className="w-full h-[500px] bg-[#09090b] rounded-xl overflow-hidden relative border border-white/10 shadow-2xl">
            <div className="absolute top-4 left-4 z-10 glass-panel p-3 rounded-lg border border-white/10 bg-black/40 backdrop-blur-md">
                <h3 className="text-white font-bold text-sm mb-2">Skill Galaxy</h3>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        <span className="text-white/80">You (Core)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                        <span className="text-white/80">Strong Evidence</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
                        <span className="text-white/80">Developing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,165,165,0.5)]"></div>
                        <span className="text-white/80">Weak Evidence</span>
                    </div>
                </div>
            </div>

            <Canvas camera={{ position: [0, 8, 12], fov: 50 }}>
                {/* Space Atmosphere */}
                <color attach="background" args={['#050508']} />
                <fog attach="fog" args={['#050508', 10, 30]} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={0.5} color="#4ade80" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ef4444" />

                <SolarSystem skills={skills} hasGaps={hasGaps} />

                <OrbitControls
                    enableZoom={true}
                    autoRotate
                    autoRotateSpeed={0.8}
                    minDistance={5}
                    maxDistance={20}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>
        </div>
    );
};

export default SkillDNA;
