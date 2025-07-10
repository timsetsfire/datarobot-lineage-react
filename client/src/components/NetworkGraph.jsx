import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/peer';
import { DataSet, DataView } from 'vis-data/peer';
import '../App.css';
// NetworkGraph component

// Color mapping for different node types
const getNodeColor = (nodeLabel) => {
    const colorMap = {
        // Data & Storage
        'datasets': '#4CAF50',        // Green - Primary data
        'datastore': '#2E7D32',       // Dark Green - Data storage
        'datasource': '#66BB6A',      // Light Green - Data sources
        'vectorDatabases': '#81C784',  // Pale Green - Vector storage
        
        // Projects & Models  
        'projects': '#2196F3',        // Blue - Projects
        'models': '#1976D2',          // Dark Blue - ML Models
        'customModelVersion': '#42A5F5', // Light Blue - Custom models
        'registeredModels': '#64B5F6', // Lighter Blue - Registered models
        
        // AI & LLM
        'llm': '#9C27B0',            // Purple - LLM models
        'llmBlueprint': '#BA68C8',   // Light Purple - LLM blueprints  
        'playgrounds': '#CE93D8',    // Pale Purple - Playgrounds
        
        // Applications
        'applications': '#FF9800',    // Orange - Applications
        'customApplications': '#FB8C00', // Dark Orange - Custom apps
        'customApplicationSources': '#FFB74D', // Light Orange - App sources
        
        // Processing & Deployment
        'deployments': '#F44336',     // Red - Deployments
        'recipes': '#795548',         // Brown - Data recipes
        'dataEngineQueries': '#607D8B', // Blue Grey - Queries
        
        // Default fallback
        'default': '#9E9E9E'         // Grey - Unknown types
    };
    
    return colorMap[nodeLabel] || colorMap['default'];
};

export function getNode(id, nodes) {
    return nodes.filter((item) => item.id === id)[0]
}

export function getParents(id, nodes, edges) { 
    let parentNodes = []
    function helper(id) {
        for (let j = 0; j < edges.length; j++) {
            if (id === edges[j].to) {
                let parent = getNode(edges[j].from, nodes)
                parentNodes.push(parent)
                helper(edges[j].from)
            }
        }
    }
    helper(id)
    return parentNodes
}

export function getChildren(id, nodes, edges) {
    let childrenNodes = []
    function helper(id) {
        for (let j = 0; j < edges.length; j++) {
            if (id === edges[j].from) {
                let child = getNode(edges[j].to, nodes)
                childrenNodes.push(child)
                helper(edges[j].to)
            }
        }
    }
    helper(id)
    return childrenNodes
}

export function topologicalSort(nodes, edges) {
    const inDegree = {};
    const result = [];
    const queue = [];

    // Calculate in-degree of each node
    nodes.forEach(node => inDegree[node.id] = 0);
    edges.forEach(edge => inDegree[edge.to]++);

    // Add nodes with in-degree 0 to the queue
    for (const nodeId in inDegree) {
        if (inDegree[nodeId] === 0) {
            queue.push(nodeId);
        }
    }

    // Process nodes in topological order
    while (queue.length > 0) {
        const nodeId = queue.shift();
        result.push(getNode(nodeId, nodes, edges));

        edges.forEach(edge => {
            if (edge.from === nodeId) {
                inDegree[edge.to]--;
                if (inDegree[edge.to] === 0) {
                    queue.push(edge.to);
                }
            }
        });
    }

    if (result.length !== nodes.length) {
        throw new Error("Cycle detected in the graph");
    }

    return result;
}

export function getVisibleNodes(selectedEntity, nodes, edges) {
    const children = getChildren(selectedEntity, nodes, edges)
    const parents = getParents(selectedEntity, nodes, edges)
    const visibleNodes = [getNode(selectedEntity, nodes)].concat(children).concat(parents)
    return visibleNodes.map((item) => item.id)
}

const NetworkGraph = ({ onNodeSelect, nodes, edges, selectedEntity, searchTerm, onSearchResult, showNodeLabels = true, showEdgeLabels = true }) => {
    const networkRef = useRef(null);
    const networkInstanceRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
    const [highlightedNode, setHighlightedNode] = useState(null);
    const [currentZoom, setCurrentZoom] = useState(1);

    // Search functionality
    useEffect(() => {
        if (searchTerm && nodes.length > 0) {
            const foundNode = nodes.find(node => 
                node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (node.name && node.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                node.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (foundNode) {
                setHighlightedNode(foundNode.id);
                onNodeSelect(foundNode.id);
                if (onSearchResult) {
                    onSearchResult(foundNode);
                }
            } else {
                setHighlightedNode(null);
                if (onSearchResult) {
                    onSearchResult(null);
                }
            }
        } else {
            setHighlightedNode(null);
        }
    }, [searchTerm, nodes, onNodeSelect, onSearchResult]);

    useEffect(() => {
        
        // Add colors to nodes based on their type/label
        const coloredNodes = nodes.map(node => {
            const isHighlighted = node.id === highlightedNode;
            const isSelected = node.id === selectedEntity;
            
            // Base colors
            const baseColor = getNodeColor(node.label);
            
            // Determine node appearance based on state
            let nodeColor;
            if (isHighlighted) {
                // Search highlighted node - yellow background with orange border
                nodeColor = {
                    background: '#ffc107',
                    border: '#ff8c00',
                    highlight: { background: '#ffc107', border: '#ff8c00' },
                    hover: { background: '#ffc107', border: '#ff8c00' }
                };
            } else if (isSelected) {
                // Selected entity - keep original color but add bold black border
                nodeColor = {
                    background: baseColor,
                    border: '#000000',
                    highlight: { background: baseColor, border: '#000000' },
                    hover: { background: baseColor, border: '#000000' }
                };
            } else {
                // Default node appearance
                nodeColor = {
                    background: baseColor,
                    border: baseColor,
                    highlight: {
                        background: baseColor,
                        border: '#000000'
                    },
                    hover: {
                        background: baseColor,
                        border: '#000000'
                    }
                };
            }
            
            return {
                ...node,
                color: nodeColor,
                borderWidth: isSelected ? 4 : 2, // Make selected entity border thicker
                title: `${node.label}: ${node.name || node.id}\nID: ${node.id}${node.url ? '\nDouble-click to open in DataRobot' : ''}`
            };
        });

        const visibleNodes = selectedEntity != null ? getVisibleNodes(selectedEntity, coloredNodes, edges) : null
        const nodesFilter = visibleNodes != null ? (node) => { return visibleNodes.includes(node.id) } : (node) => { return true }
        const nodesDataSet = new DataSet(coloredNodes);
        const nodesView = new DataView(nodesDataSet, { filter: nodesFilter });
        const edgesDataSet = new DataSet(edges);
        const edgesFilter = (edge) => {
            return true
        };
        const edgesView = new DataView(edgesDataSet, { filter: edgesFilter });
        const data = { nodes: nodesView, edges: edgesView }

        const options = {
            nodes: { 
                shape: "dot",
                size: 20,
                font: showNodeLabels ? {
                    size: 14,
                    color: '#000000'
                } : {
                    size: 0
                },
                borderWidth: 2,
                scaling: { 
                    min: 10,
                    max: 30,
                    label: showNodeLabels ? { 
                        min: 12,
                        max: 30, 
                        drawThreshold: 12,
                        maxVisible: 20,
                    } : {
                        enabled: false
                    }
                },
            },
            edges: { 
                color: 'gray',
                width: 2, 
                arrows: { to: true },
                smooth: {
                    type: 'continuous'
                },
                font: showEdgeLabels ? {
                    size: Math.max(6, Math.min(11, currentZoom * 10)),
                    color: '#333333',
                    background: 'rgba(255,255,255,0.8)',
                    strokeWidth: 0
                } : {
                    size: 0
                }
            },
            physics: { enabled: true, }, 
            layout: {
                improvedLayout: true,
                randomSeed: 2,
                hierarchical: {
                  enabled: false
                }
              },
            height: '100%',
            width: '100%',
            interaction: {
                tooltipDelay: 300,
                hideEdgesOnDrag: true,
                hideNodesOnDrag: false
            }
        };

        if (!networkRef.current) return;

        const container = networkRef.current;
        const network = new Network(container, data, options);
        networkInstanceRef.current = network;

        // Zoom-to-fit on initial load or reset (when no entity selected)
        if (!selectedEntity) {
            setTimeout(() => {
                if (network && typeof network.fit === 'function') {
                    try {
                        network.fit({
                            animation: {
                                duration: 1000,
                                easingFunction: 'easeInOutQuad'
                            }
                        });
                    } catch (error) {
                        console.warn('Failed to fit network view:', error);
                    }
                }
            }, 200); // Increased timeout to ensure network is ready
        }

        // Focus on highlighted node
        if (highlightedNode && network && typeof network.focus === 'function') {
            try {
                network.focus(highlightedNode, {
                    scale: 1.5,
                    animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
                });
            } catch (error) {
                console.warn('Failed to focus on highlighted node:', error);
            }
        }

        // Track zoom changes for dynamic edge label sizing
        // disabling for now as it is messing up zoom capability
        // if (network && typeof network.on === 'function') {
        //     network.on('zoom', (event) => {
        //         if (event && typeof event.scale === 'number') {
        //             setCurrentZoom(event.scale);
        //         }
        //     });
        // }

        if (network && typeof network.on === 'function') {
            network.on('selectNode', (event) => {
                if (event && event.nodes && event.nodes[0]) {
                    const nodeId = event.nodes[0];
                    onNodeSelect(nodeId);
                }
            });

        network.on('doubleClick', function (event) {
            const { nodes: selectedNodes } = event;
            const nodeId = selectedNodes[0]
            edges.forEach( (edge) => {
                if (nodeId === edge.to) {
                    visibleNodes.push(edge.from)
                } else if (nodeId === edge.from) {
                    visibleNodes.push(edge.to)
                } else {
                    {}
                }
            })
            nodesView.refresh()
        });

            // Custom tooltip handling
            network.on('hoverNode', (event) => {
                if (event && event.node && event.pointer && event.pointer.DOM) {
                    const nodeId = event.node;
                    const node = nodes.find(n => n.id === nodeId);
                    if (node) {
                        setTooltip({
                            visible: true,
                            x: event.pointer.DOM.x,
                            y: event.pointer.DOM.y,
                            content: `${node.label}: ${node.name || node.id}`
                        });
                    }
                }
            });

            network.on('blurNode', () => {
                setTooltip({ visible: false, x: 0, y: 0, content: '' });
            });
        }

        return () => {
            if (network) {
                network.destroy();
            }
            networkInstanceRef.current = null;
        };
    }, [onNodeSelect, nodes, edges, selectedEntity, highlightedNode, currentZoom]);

    // Separate effect for updating label visibility without recreating the entire network
    useEffect(() => {
        if (networkInstanceRef.current) {
            console.log(`🏷️ Updating label visibility: nodes=${showNodeLabels}, edges=${showEdgeLabels}`);
            
            const labelOptions = {
                nodes: {
                    font: showNodeLabels ? {
                        size: 14,
                        color: '#000000'
                    } : {
                        size: 0
                    },
                    scaling: {
                        min: 10,
                        max: 30,
                        label: showNodeLabels ? {
                            min: 12,
                            max: 30,
                            drawThreshold: 12,
                            maxVisible: 20,
                        } : {
                            enabled: false
                        }
                    }
                },
                edges: {
                    font: showEdgeLabels ? {
                        size: Math.max(6, Math.min(11, currentZoom * 10)),
                        color: '#333333',
                        background: 'rgba(255,255,255,0.8)',
                        strokeWidth: 0
                    } : {
                        size: 0
                    }
                }
            };

            try {
                networkInstanceRef.current.setOptions(labelOptions);
            } catch (error) {
                console.warn('Failed to update label options:', error);
            }
        }
    }, [showNodeLabels, showEdgeLabels, currentZoom]);

    // Expose fit function for external use
    const fitGraph = () => {
        if (networkInstanceRef.current && typeof networkInstanceRef.current.fit === 'function') {
            try {
                networkInstanceRef.current.fit({
                    animation: {
                        duration: 1000,
                        easingFunction: 'easeInOutQuad'
                    }
                });
            } catch (error) {
                console.warn('Failed to fit graph externally:', error);
            }
        }
    };



    return (
        <div className="network-graph-container" style={{ height: '75%' }}>
            <div ref={networkRef} style={{ height: '100%', width: '100%' }} />
            {tooltip.visible && (
                <div 
                    className="node-tooltip"
                    style={{ 
                        left: tooltip.x + 10, 
                        top: tooltip.y - 10 
                    }}
                >
                    <strong>{tooltip.content}</strong>
                </div>
            )}
        </div>
    );
};

export default NetworkGraph
