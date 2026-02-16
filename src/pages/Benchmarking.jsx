import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend
} from 'recharts';
import { Users, Info } from 'lucide-react';

const radarData = [
    { subject: 'Coding', A: 120, B: 110, fullMark: 150 },
    { subject: 'System Design', A: 98, B: 130, fullMark: 150 },
    { subject: 'Soft Skills', A: 86, B: 130, fullMark: 150 },
    { subject: 'Projects', A: 99, B: 100, fullMark: 150 },
    { subject: 'Academics', A: 85, B: 90, fullMark: 150 },
    { subject: 'Internships', A: 65, B: 85, fullMark: 150 },
];

const barData = [
    { name: 'Jan', you: 45, avg: 40 },
    { name: 'Feb', you: 52, avg: 42 },
    { name: 'Mar', you: 58, avg: 48 },
    { name: 'Apr', you: 65, avg: 50 },
    { name: 'May', you: 78, avg: 55 },
    { name: 'Jun', you: 85, avg: 60 },
];

const InfoCard = ({ title, value, subtext }) => (
    <div className="p-6 bg-card border border-border/50 rounded-2xl">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className="text-3xl font-bold mt-2 text-foreground">{value}</div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Users size={20} />
            </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <Info size={12} />
            {subtext}
        </div>
    </div>
);

const Benchmarking = () => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Peer Benchmarking
                </h1>
                <p className="text-muted-foreground mt-1">Compare your progress with peers in real-time.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoCard
                    title="Global Percentile"
                    value="Top 18%"
                    subtext="Based on skills and project quality"
                />
                <InfoCard
                    title="Class Rank"
                    value="#12"
                    subtext="Out of 120 students in CSE"
                />
                <InfoCard
                    title="Skill Velocity"
                    value="2.5x"
                    subtext="Faster than peer average"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Radar Chart - Skill Comparison */}
                <div className="bg-card border border-border/50 rounded-3xl p-6 min-h-[400px]">
                    <h3 className="text-lg font-semibold mb-6">Skill Dimension Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar
                                name="You"
                                dataKey="A"
                                stroke="#22d3ee"
                                fill="#22d3ee"
                                fillOpacity={0.4}
                            />
                            <Radar
                                name="Average Peer"
                                dataKey="B"
                                stroke="#94a3b8"
                                fill="#94a3b8"
                                fillOpacity={0.1}
                            />
                            <Legend />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart - Growth Trend */}
                <div className="bg-card border border-border/50 rounded-3xl p-6 min-h-[400px]">
                    <h3 className="text-lg font-semibold mb-6">Growth Trajectory vs Peers</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={barData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="you" name="Your Growth" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="avg" name="Peer Average" fill="#334155" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Benchmarking;
