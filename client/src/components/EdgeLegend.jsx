import React, { useState, useMemo } from 'react';
import '../App.css';

const EdgeLegend = ({ edges, isExpanded = false, onToggle }) => {
    const [showLegend, setShowLegend] = useState(isExpanded);

    // Extract unique edge types from the current graph
    const edgeTypes = useMemo(() => {
        const types = {};
        edges.forEach(edge => {
            if (edge.type && edge.type !== 'IS_PARENT_OF') {
                types[edge.type] = {
                    color: edge.color,
                    label: edge.label || edge.type,
                    count: (types[edge.type]?.count || 0) + 1,
                    width: edge.width || 2,
                    dashes: edge.dashes || false
                };
            }
        });
        
        // Add default type if present
        const defaultEdges = edges.filter(e => !e.type || e.type === 'IS_PARENT_OF');
        if (defaultEdges.length > 0) {
            types['IS_PARENT_OF'] = {
                color: '#6B7280',
                label: 'derives from',
                count: defaultEdges.length,
                width: 1,
                dashes: false
            };
        }
        
        return types;
    }, [edges]);

    const edgeCategories = {
        'Application Relationships': ['USES_DEPLOYMENT', 'USES_MODEL', 'BUILT_FROM_PROJECT', 'REFERENCES_DATASET', 'USES_VECTOR_DB', 'USES_REGISTERED_MODEL', 'BUILT_FROM_SOURCE'],
        'ML Pipeline': ['TRAINED_ON', 'BELONGS_TO_PROJECT', 'DEPLOYS_MODEL', 'DEPLOYS_REGISTERED_MODEL', 'REGISTERED_FROM'],
        'Data Flow': ['SOURCED_FROM', 'CONNECTS_TO', 'PROCESSES_DATA_FROM', 'PROCESSED_BY', 'GENERATED_BY_QUERY'],
        'AI & LLM': ['BUILT_FROM_DATASET', 'USES_VECTOR_DB', 'USES_LLM', 'USES_LLM_BLUEPRINT', 'CONFIGURED_IN_PLAYGROUND', 'EXPERIMENTS_WITH'],
        'Default': ['IS_PARENT_OF']
    };

    const toggleLegend = () => {
        if (onToggle) {
            onToggle();
        } else {
            setShowLegend(!showLegend);
        }
    };

    const EdgeLine = ({ edgeInfo, type }) => (
        <div className="edge-legend-line">
            <svg width="40" height="20" style={{ marginRight: '8px' }}>
                <line
                    x1="5" y1="10" x2="35" y2="10"
                    stroke={edgeInfo.color}
                    strokeWidth={edgeInfo.width}
                    strokeDasharray={edgeInfo.dashes ? edgeInfo.dashes.join(',') : 'none'}
                    markerEnd="url(#arrowhead)"
                />
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                            refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={edgeInfo.color} />
                    </marker>
                </defs>
            </svg>
            <span className="edge-legend-text">
                <strong>{type}:</strong> {edgeInfo.label} <span className="edge-count">({edgeInfo.count})</span>
            </span>
        </div>
    );

    if (Object.keys(edgeTypes).length === 0) {
        return null;
    }

    return (
        <div className="edge-legend">
            <div className="legend-header" onClick={toggleLegend}>
                <h4>
                    {showLegend ? '▼' : '▶'} Edge Types ({edges.length} total)
                </h4>
            </div>
            
            {showLegend && (
                <div className="legend-content">
                    {Object.entries(edgeCategories).map(([category, categoryTypes]) => {
                        const categoryEdges = categoryTypes.filter(type => edgeTypes[type]);
                        
                        if (categoryEdges.length === 0) return null;

                        return (
                            <div key={category} className="legend-category">
                                <h5>{category}</h5>
                                {categoryEdges.map(type => (
                                    <EdgeLine 
                                        key={type} 
                                        edgeInfo={edgeTypes[type]} 
                                        type={type}
                                    />
                                ))}
                            </div>
                        );
                    })}
                    
                    <div className="graph-stats">
                        <small>📏 Line thickness indicates relationship importance</small>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EdgeLegend; 