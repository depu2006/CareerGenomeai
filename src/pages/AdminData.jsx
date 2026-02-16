import React, { useState, useEffect } from 'react';
import { Database, Table, RefreshCw, ChevronRight } from 'lucide-react';

const AdminData = () => {
    const [collections, setCollections] = useState([]);
    const [selectedCol, setSelectedCol] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/collections')
            .then(res => res.json())
            .then(cols => setCollections(cols))
            .catch(err => console.error("Failed to fetch collections", err));
    }, []);

    const fetchData = (colName) => {
        setLoading(true);
        setSelectedCol(colName);
        fetch(`http://127.0.0.1:5000/api/collection/${colName}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    return (
        <div className="space-y-6 pb-20 pt-10 px-6">
            <div className="flex items-center gap-3 mb-8">
                <Database className="text-primary" size={32} />
                <h1 className="text-3xl font-bold tracking-tight">Data Explorer</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar: Collections */}
                <div className="bg-card border border-border rounded-xl p-4 h-fit">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Collections</h2>
                    <div className="space-y-2">
                        {collections.map(col => (
                            <button
                                key={col}
                                onClick={() => fetchData(col)}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${selectedCol === col ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                                    }`}
                            >
                                {col}
                                {selectedCol === col && <ChevronRight size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main: Data Table */}
                <div className="md:col-span-3 bg-card border border-border rounded-xl p-6 min-h-[500px] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Table className="text-muted-foreground" size={20} />
                            <h2 className="text-xl font-semibold">
                                {selectedCol ? selectedCol : 'Select a collection'}
                            </h2>
                        </div>
                        {selectedCol && (
                            <button
                                onClick={() => fetchData(selectedCol)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">LOADING...</div>
                        ) : !selectedCol ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                Select a collection from the left to view data.
                            </div>
                        ) : data.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                Collection is empty.
                            </div>
                        ) : (
                            <div className="relative overflow-x-auto">
                                <pre className="text-xs bg-black/20 p-4 rounded-lg overflow-auto max-h-[600px] text-green-400 font-mono">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminData;
