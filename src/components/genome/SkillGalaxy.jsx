import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// -------------------------------------------------------------
// 1. STAR VISUALIZATION (Skills)
// -------------------------------------------------------------
const SkillStar = ({ position, color, label, size, level }) => {
    const meshRef = useRef();

    // Random slight rotation for organic feel
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.001;
        }
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef}>
                    <sphereGeometry args={[size, 16, 16]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={2}
                        toneMapped={false}
                    />
                </mesh>

                {/* Glow Effect */}
                <pointLight color={color} distance={4} intensity={2} decay={2} />

                {/* Label */}
                <Html distanceFactor={15} zIndexRange={[100, 0]}>
                    <div className={`
                px-3 py-1.5 rounded-full backdrop-blur-md border 
                ${level === 'Strong' ? 'border-green-500/50 bg-green-900/30 text-green-100' :
                            level === 'Developing' ? 'border-yellow-500/50 bg-yellow-900/30 text-yellow-100' :
                                'border-red-500/50 bg-red-900/30 text-red-100'} 
                text-xs font-bold whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.5)]
                transform transition-all duration-300 pointer-events-none select-none
            `}>
                        {label}
                    </div>
                </Html>
            </Float>
        </group>
    );
};

// -------------------------------------------------------------
// 2. GALAXY PARTICLES (Background Spiral)
// -------------------------------------------------------------
const GalaxyParticles = ({ count = 2000 }) => {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorInside = new THREE.Color('#ff6030');
        const colorOutside = new THREE.Color('#1b3984');

        for (let i = 0; i < count; i++) {
            // Spiral Logic
            const radius = Math.random() * 20;
            const spinAngle = radius * 0.8; // Spin factor
            const branchAngle = (i % 3) * ((Math.PI * 2) / 3); // 3 Arms

            const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
            const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
            const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;

            const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
            const y = randomY * 2; // Flattened galaxy
            const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            p[i * 3] = x;
            p[i * 3 + 1] = y;
            p[i * 3 + 2] = z;

            // Color mixing
            const mixedColor = colorInside.clone().lerp(colorOutside, radius / 20);
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }
        return { p, colors };
    }, [count]);

    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.05; // Slow rotation
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.p.length / 3}
                    array={points.p}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={points.colors.length / 3}
                    array={points.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.08}
                vertexColors
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={true}
            />
        </points>
    );
};

// -------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------
const SkillGalaxy = ({ skills = [] }) => {

    // Process skills into star positions
    const starData = useMemo(() => {
        return skills.map((skill, i) => {
            // Determine Orbit/Radius based on score
            // High score -> Inner Core (0-4)
            // Med score -> Mid (4-8)
            // Low score -> Outer (8-12)

            let radiusBase = 10;
            let level = 'Weak';
            let color = '#ef4444'; // Red

            if (skill.score >= 80 || skill.status === 'strong') {
                radiusBase = 3 + Math.random() * 2;
                level = 'Strong';
                color = '#4ade80'; // Green
            } else if (skill.score >= 50 || skill.status === 'developing') {
                radiusBase = 6 + Math.random() * 3;
                level = 'Developing';
                color = '#facc15'; // Yellow
            } else {
                radiusBase = 10 + Math.random() * 4;
            }

            // Random Angle
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * radiusBase;
            const z = Math.sin(angle) * radiusBase;
            const y = (Math.random() - 0.5) * 2; // Slight vertical spread

            return {
                id: i,
                name: skill.name,
                pos: [x, y, z],
                color,
                size: 0.15 + (skill.score / 100) * 0.2,
                level
            };
        });
    }, [skills]);

    return (
        <div className="w-full h-[500px] bg-[#050508] rounded-xl overflow-hidden relative border border-white/10 shadow-2xl">
            {/* Overlay Info */}
            <div className="absolute top-4 left-4 z-10 glass-panel p-3 rounded-lg border border-white/10 bg-black/40 backdrop-blur-md">
                <h3 className="text-white font-bold text-sm mb-2">Skill Galaxy 🌌</h3>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                        <span className="text-white/80">Strong (Core)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                        <span className="text-white/80">Developing (Mid)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,165,165,0.8)]"></div>
                        <span className="text-white/80">Emerging (Outer)</span>
                    </div>
                </div>
            </div>

            <Canvas camera={{ position: [0, 10, 18], fov: 45 }}>
                <color attach="background" args={['#020205']} />
                <fog attach="fog" args={['#020205', 10, 40]} />

                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
                <ambientLight intensity={0.1} />

                {/* The Spiral Galaxy Background */}
                <GalaxyParticles count={3000} />

                {/* User Skills as Stars */}
                {starData.map((star) => (
                    <SkillStar
                        key={star.id}
                        position={star.pos}
                        color={star.color}
                        label={star.name}
                        size={star.size}
                        level={star.level}
                    />
                ))}

                <OrbitControls
                    enableZoom={true}
                    autoRotate
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 1.5}
                    minDistance={5}
                    maxDistance={25}
                />
            </Canvas>
        </div>
    );
};

export default SkillGalaxy;
