import React, { useState, useEffect, useCallback } from 'react';
import './CareerShockAlerts.css';

const CareerShockAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // View state: 'home' for dashboard, 'feed' for specific category
    const [activeTab, setActiveTab] = useState(null);
    const [view, setView] = useState('home');

    const fetchAlerts = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            // Updated to point to Python backend
            const response = await fetch('http://127.0.0.1:5000/api/shocks');
            if (!response.ok) throw new Error('Failed to fetch alerts');
            const data = await response.json();
            setAlerts(data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
        const intervalId = setInterval(() => fetchAlerts(), 300000);
        return () => clearInterval(intervalId);
    }, [fetchAlerts]);

    const handleManualRefresh = () => fetchAlerts(true);
    const handleCategoryClick = (category) => {
        setActiveTab(category);
        setView('feed');
    };
    const handleBackToDashboard = () => {
        setView('home');
        setActiveTab(null);
    };

    const categories = [
        { id: 'Layoff Data', label: 'Layoff Data', icon: '🚨', desc: 'Latest redundancy news', style: 'card-layoff' },
        { id: 'Emerging Skill', label: 'Emerging Skill', icon: '🚀', desc: 'Rising tech demands', style: 'card-skill' },
        { id: 'Hiring Surge', label: 'Hiring Surge', icon: '📢', desc: 'Companies mass hiring', style: 'card-surge' },
        { id: 'Hiring Trend', label: 'Hiring Trend', icon: '📈', desc: 'Market analysis', style: 'card-trend' }
    ];

    const getFilteredAlerts = () => {
        if (!alerts || !activeTab) return [];
        return alerts.filter(alert => {
            if (activeTab === 'Layoff Data') return alert.type === 'Layoff Shock';
            return alert.type === activeTab;
        });
    };

    const filteredAlerts = getFilteredAlerts();

    if (loading && alerts.length === 0) return <div className="csa-loading">Loading Career Shock Alerts...</div>;
    // if (error && alerts.length === 0) return <div className="csa-error">Error: {error}</div>;

    return (
        <div className="csa-container">
            <header className="csa-header">
                <h2 className="csa-title">
                    ⚡ Career Shock Alerts
                </h2>
                <div className="csa-controls">
                    {lastUpdated && (
                        <span className="csa-last-updated">
                            Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button onClick={handleManualRefresh} className="csa-refresh-btn" disabled={refreshing}>
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </header>

            {error && <div className="csa-error">Note: {error} - Is Backend Running?</div>}

            {/* DASHBOARD VIEW */}
            {view === 'home' && (
                <div className="csa-dashboard-grid">
                    {categories.map((cat) => (
                        <div key={cat.id} className={`csa-dashboard-card ${cat.style}`} onClick={() => handleCategoryClick(cat.id)}>
                            <div className="csa-card-icon">{cat.icon}</div>
                            <h3 className="csa-card-title">{cat.label}</h3>
                            <p className="csa-card-desc">{cat.desc}</p>
                            <span className="csa-card-action">View Insights &rarr;</span>
                        </div>
                    ))}
                </div>
            )}

            {/* FEED VIEW */}
            {view === 'feed' && (
                <div className="csa-feed-view">
                    <div className="csa-nav-header">
                        <button onClick={handleBackToDashboard} className="csa-back-btn" title="Back to Dashboard">
                            &larr;
                        </button>
                        <h3 className="csa-view-title">{activeTab.toUpperCase()}</h3>
                    </div>

                    <div className="csa-feed">
                        {filteredAlerts.length > 0 ? (
                            filteredAlerts.map((alert, index) => (
                                <div key={index} className={`csa-news-item ${alert.type.toLowerCase().replace(/\s/g, '-')}`}>
                                    <div className="csa-item-header">
                                        <span className="csa-badge">{alert.type}</span>
                                        {alert.date && <span className="csa-date">{new Date(alert.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                                    </div>
                                    <div className="csa-content">
                                        {alert.url ? (
                                            <a href={alert.url} target="_blank" rel="noopener noreferrer" className="csa-link">
                                                {alert.message.replace(/^[🚨📢🚀📈]\s/, '')}
                                            </a>
                                        ) : (
                                            <span>{alert.message.replace(/^[🚨📢🚀📈]\s/, '')}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="csa-empty">No updates available for {activeTab}.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareerShockAlerts;
