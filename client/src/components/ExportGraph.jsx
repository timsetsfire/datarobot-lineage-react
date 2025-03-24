import { getNode, getChildren, getParents, getVisibleNodes, topologicalSort } from "./NetworkGraph";
import React from 'react';

const ExportGraph = ({nodes, edges, selectedEntity, filename}) => {

    const handleDownload = () => {
        const visibleNodes = selectedEntity != null ? getVisibleNodes(selectedEntity, nodes, edges) : null
        const nodesFilter = visibleNodes != null ? (node) => { return visibleNodes.includes(node.id) } : (node) => { return true }
        const exportNodes = topologicalSort(nodes, edges).filter(nodesFilter);
        const jsonData = JSON.stringify(exportNodes, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return (
        <button className="export-graph-button" onClick={handleDownload}>
          Download Graph as JSON
        </button>
      );
}

export default ExportGraph;