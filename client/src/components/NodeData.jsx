
import React, { useState }  from 'react';


const NodeData = ({ selectedNode, nodeData }) => {

    // grab node from node data
    function getNode(id, nodeData) {
        for (let j = 0; j <= nodeData.length; j++) {
            if (nodeData[j]?.id === id) {
                return nodeData[j]
            }
        }
    }
    const [isPayloadOpen, setIsPayloadOpen] = useState(false);
    const [isParentsOpen, setIsParentsOpen] = useState(false);

    const togglePayloadCollapse = () => {
        setIsPayloadOpen(!isPayloadOpen);
    };

    const toggleParentsCollapse = () => {
        setIsParentsOpen(!isParentsOpen);
    };


    // create html to populate the node data sidebar
    function returnNodeHtml(key, value) {
        if (key === "url") {
            return (<>
                <strong>{key}</strong><p><a href={node[key]}>See asset in DataRobot</a></p>
            </>)
        } else if (key === "id") { 
            return (
                <>
                <strong>Entity Id - Entity Version Id</strong><p>{value}</p>
                </>
            )
        } else if (key === "apiUrl" || key === "id") { 
            {}
        } else if (key === "parents") {
            return (<>
                <strong onClick={toggleParentsCollapse} style={{ cursor: 'pointer' }}>
                    {isParentsOpen ? '▼' : '▶'} parents
                </strong>
                {isParentsOpen && (
                    <pre id="json">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                )}
            </>)
        } else if (key === "apiPayload") {
            return (<>
                <strong onClick={togglePayloadCollapse} style={{ cursor: 'pointer' }}>
                    {isPayloadOpen ? '▼' : '▶'} api payload
                </strong>
                {isPayloadOpen && (
                    <pre id="json">
                        {JSON.stringify(value, null, 2)}
                    </pre>
                )}
            </>)
        } else {
            return (<>
                <strong>{key}</strong><p>{value}</p>
            </>)
        }

    }

    const node = getNode(selectedNode, nodeData);

    return (<div className="right-panel">
        <h3>Node Data</h3>
        {selectedNode ? (
            <div>
                <p><strong>Node ID:</strong> {selectedNode}</p>
                {Object.entries(node).map(([key, value]) => (
                    <div key={key}>
                        {returnNodeHtml(key, value)}
                    </div>
                ))}
            </div>
        ) : (
            <p>Select a node to see data.</p>
        )}
    </div>)
};

export default NodeData;