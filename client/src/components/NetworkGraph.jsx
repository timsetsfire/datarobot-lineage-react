import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/peer';
import { DataSet, DataView } from 'vis-data/peer';
import '../App.css';
// NetworkGraph component

export function getNode(id, nodes) {
    return nodes.filter((item) => item.id === id)[0]
}

export function getParents(id, nodes) {
    let parentNodes = []
    function helper(id) {
        let n = getNode(id, nodes)
        let parents = n.parents || []
        if (parents.length > 0) {
            for (let j = 0; j < parents.length; j++) {
                parentNodes.push(getNode(parents[j].id, nodes))
                helper(parents[j].id)
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
    const parents = getParents(selectedEntity, nodes)
    const visibleNodes = [getNode(selectedEntity, nodes)].concat(children).concat(parents)
    return visibleNodes.map((item) => item.id)
}

const NetworkGraph = ({ onNodeSelect, nodes, edges, selectedEntity }) => {
    const networkRef = useRef(null);


    useEffect(() => {

        const visibleNodes = selectedEntity != null ? getVisibleNodes(selectedEntity, nodes, edges) : null
        const nodesFilter = visibleNodes != null ? (node) => { return visibleNodes.includes(node.id) } : (node) => { return true }
        const nodesDataSet = new DataSet(nodes);
        const nodesView = new DataView(nodesDataSet, { filter: nodesFilter });
        const edgesDataSet = new DataSet(edges);
        const edgesFilter = (edge) => {
            return true
        };
        const edgesView = new DataView(edgesDataSet, { filter: edgesFilter });
        const data = { nodes: nodesView, edges: edgesView }

        const options = {
            height: '100%',
            width: '100%',
            nodes: { shape: 'dot', size: 15 },
            edges: { color: 'gray', width: 2, arrows: { to: true } },
            physics: { enabled: true, }
        };

        const container = networkRef.current;
        const network = new Network(container, data, options);

        network.on('selectNode', (event) => {
            const nodeId = event.nodes[0];
            onNodeSelect(nodeId);
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

        return () => {
            network.destroy();
        };
    }, [onNodeSelect, nodes, edges, selectedEntity]);

    return <div ref={networkRef} style={{ height: '75%' }} />;
};

export default NetworkGraph