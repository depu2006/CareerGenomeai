import React, { useState, useEffect } from 'react';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import FitScoreModal from '../components/opportunities/FitScoreModal';
import { Search, Filter, Briefcase, GraduationCap, Code2, Globe } from 'lucide-react';
import { fetchOpportunities } from '../services/opportunityService';
import { useUser } from '../context/UserContext';
import ProfileSetupWizard from '../components/onboarding/ProfileSetupWizard';

const Opportunities = () => {
    const { userProfile } = useUser();
    const [activeTab, setActiveTab] = useState('all');
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);

    // Gatekeeper Check (Derived State)
    const isProfileIncomplete = !userProfile?.name && !userProfile?.domain && !userProfile?.resumeText;

    // Fetch data when tab changes and profile is ready
    useEffect(() => {
        if (isProfileIncomplete) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const domain = userProfile?.domain || 'Software Engineer';
                const data = await fetchOpportunities(activeTab, domain);
                setOpportunities(data);
            } catch (error) {
                console.error("Failed to fetch opportunities", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [activeTab, isProfileIncomplete, userProfile?.domain]);

    const tabs = [
        { id: 'all', label: 'All Opportunities', icon: Globe },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'internships', label: 'Internships', icon: GraduationCap },
        { id: 'hackathons', label: 'Hackathons', icon: Code2 }
    ];

    const filteredOpportunities = opportunities.filter(op =>
        op.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isProfileIncomplete) {
        return (
            <div className="pt-10">
                <ProfileSetupWizard onComplete={() => { }} />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-white/60 bg-clip-text text-transparent">
                        Opportunity Intelligence
                    </h1>
                    <p className="text-muted-foreground mt-1">AI-curated roles matched to your genome.</p>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search roles, skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${activeTab === tab.id
                                ? 'bg-primary/20 text-primary border-primary/50'
                                : 'bg-card border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-card border border-border/50 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOpportunities.map((op, index) => (
                        <OpportunityCard
                            key={op.id || `op-${index}`}
                            job={op}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Simple Icon component helper if needed, or stick to lucide
const AwardIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
);

export default Opportunities;
