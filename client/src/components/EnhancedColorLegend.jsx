import React, { useState, useMemo } from 'react';
import '../App.css';

const EnhancedColorLegend = ({ nodes, onNodeSearch, isFloating = false, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(!isFloating);
    const [searchTerm, setSearchTerm] = useState('');

    const colorMap = {
        // Data & Storage
        'datasets': { color: '#4CAF50', category: 'Data & Storage', description: 'Primary datasets' },
        'datastore': { color: '#2E7D32', category: 'Data & Storage', description: 'Data storage systems' },
        'datasource': { color: '#66BB6A', category: 'Data & Storage', description: 'Data sources' },
        'vectorDatabases': { color: '#81C784', category: 'Data & Storage', description: 'Vector databases' },
        
        // Projects & Models  
        'projects': { color: '#2196F3', category: 'Projects & Models', description: 'ML projects' },
        'models': { color: '#1976D2', category: 'Projects & Models', description: 'ML models' },
        'customModelVersion': { color: '#42A5F5', category: 'Projects & Models', description: 'Custom model versions' },
        'registeredModels': { color: '#64B5F6', category: 'Projects & Models', description: 'Registered models' },
        
        // AI & LLM
        'llm': { color: '#9C27B0', category: 'AI & LLM', description: 'Large Language Models' },
        'llmBlueprint': { color: '#BA68C8', category: 'AI & LLM', description: 'LLM blueprints' },
        'playgrounds': { color: '#CE93D8', category: 'AI & LLM', description: 'AI playgrounds' },
        
        // Applications
        'applications': { color: '#FF9800', category: 'Applications', description: 'Applications' },
        'customApplications': { color: '#FB8C00', category: 'Applications', description: 'Custom applications' },
        'customApplicationSources': { color: '#FFB74D', category: 'Applications', description: 'Application sources' },
        
        // Processing & Deployment
        'deployments': { color: '#F44336', category: 'Processing & Deployment', description: 'Model deployments' },
        'recipes': { color: '#795548', category: 'Processing & Deployment', description: 'Data recipes' },
        'dataEngineQueries': { color: '#607D8B', category: 'Processing & Deployment', description: 'Data engine queries' },
    };

    // Calculate node counts by type
    const nodeCounts = useMemo(() => {
        const counts = {};
        nodes.forEach(node => {
            counts[node.label] = (counts[node.label] || 0) + 1;
        });
        return counts;
    }, [nodes]);

    // Get total node count
    const totalNodes = nodes.length;

    const categories = [...new Set(Object.values(colorMap).map(item => item.category))];

    const toggleExpanded = () => {
        if (isFloating && onToggle) {
            onToggle();
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim() && onNodeSearch) {
            onNodeSearch(searchTerm.trim());
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        if (onNodeSearch) {
            onNodeSearch(''); // Clear search
        }
    };

    if (isFloating) {
        return (
            <button 
                className={`floating-legend-toggle ${isExpanded ? 'active' : ''}`}
                onClick={toggleExpanded}
                title="Toggle Color Legend"
            >
                🎨
            </button>
        );
    }

    return (
        <div className="color-legend">
            <div className="legend-header" onClick={toggleExpanded}>
                <h4>
                    {isExpanded ? '▼' : '▶'} Node Colors ({totalNodes} total)
                </h4>
            </div>
            
            {isExpanded && (
                <div className="legend-content">
                    {/* Search Controls */}
                    <div className="graph-controls">
                        <div className="graph-search">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="Search nodes (ID, name, type)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button type="submit">🔍</button>
                                {searchTerm && (
                                    <button type="button" onClick={clearSearch}>✕</button>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Legend Categories */}
                    {categories.map(category => {
                        const categoryNodes = Object.entries(colorMap)
                            .filter(([_, info]) => info.category === category)
                            .filter(([nodeType, _]) => nodeCounts[nodeType] > 0); // Only show categories with nodes
                        
                        if (categoryNodes.length === 0) return null;

                        return (
                            <div key={category} className="legend-category">
                                <h5>{category}</h5>
                                {categoryNodes.map(([nodeType, info]) => (
                                    <div key={nodeType} className="legend-item">
                                        <div 
                                            className="legend-color-dot" 
                                            style={{ backgroundColor: info.color }}
                                        ></div>
                                        <span className="legend-text">
                                            <strong>{nodeType}:</strong> {info.description} 
                                            <span className="node-count">({nodeCounts[nodeType] || 0})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}

                    {/* Graph Stats */}
                    <div className="graph-stats">
                        <small>💡 Click nodes to select • Double-click to open in DataRobot</small>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedColorLegend; 