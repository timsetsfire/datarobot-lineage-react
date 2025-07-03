import React, { useState, useEffect } from 'react';
import LoginBox from "./components/Login";
import UseCases from "./components/UseCases";
import NetworkGraph from './components/NetworkGraph';
import NodeData from "./components/NodeData";
import EntityList from "./components/EntityList";
import Loader from "./components/Loader";
import ExportGraph from './components/ExportGraph';
import Chat from "./components/Chat";
import EnhancedColorLegend from './components/EnhancedColorLegend';
import MiniModeToggle from './components/MiniModeToggle';
import EdgeLegend from './components/EdgeLegend';
import { Tab, Tabs, Dropdown, DropdownButton, DropdownItem } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';
// import getUseCases from "./utils/utils";

const baseURL = "http://localhost:8080";

console.log("checking baseURL in app.jsx")
console.log(baseURL)   

function App() {

  const [activeTab, setActiveTab] = useState('explore-data');
  // console.log(sessionStorage)
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

 
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // const [useCases, setUseCases] = useState([]);
  const [useCaseSelection, setUseCaseSelection] = useState(null);
  const [useCaseRetrieved, setUseCaseRetrieved] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphKey, setGraphKey] = useState(0); // Add key to force network refresh
  
  // Enhanced features state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showFloatingLegend, setShowFloatingLegend] = useState(false);
  const [showEmbeddedLegend, setShowEmbeddedLegend] = useState(true);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);


  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const endpoint = sessionStorage.getItem('endpoint');
    if (token && endpoint) {
      setLoggedIn(true);
    }
  }, []);


  const handleLogin = async (event) =>  {
    setLoggedIn(true);
    setIsLoading(true);
    const token = sessionStorage.getItem('token');
    const endpoint = sessionStorage.getItem('endpoint');
    try {
      const response = await fetch(`${baseURL}/getUseCases`, {
        method: 'GET',
        headers: {
          'token': token,
          'endpoint': endpoint,
        },
        mode: 'cors'
      });
      const data = await response.json();
      console.log("checking use casew")
      console.log(data)
      sessionStorage.setItem('useCases', JSON.stringify(data));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false); // Set loading to false after the fetch completes
    }
  };


  const handleUseCaseSelection = (useCase, nodes, edges, done) => {
    setSelectedEntity(null)
    setSelectedNode(null)
    setUseCaseSelection(useCase)
    setNodes(nodes)
    setEdges(edges)
    setUseCaseRetrieved(done)
  };

  const handleEntitySelection = (event) => { 
    setSelectedEntity( event )
    setSelectedNode(event)
  }

  const handleGraphReset = () => {
    setSelectedEntity(null);
    setSelectedNode(null);
    setSearchTerm('');
    setSearchResult(null);
    setGraphKey(prev => prev + 1); // Force network refresh
  };

  // Export current graph state for debugging
  const exportGraphSnapshot = () => {
    const snapshot = {
      nodes: nodes,
      edges: edges,
      selectedEntity: selectedEntity,
      selectedNode: selectedNode,
      searchTerm: searchTerm,
      useCaseSelection: useCaseSelection,
      timestamp: new Date().toISOString(),
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodeTypes: [...new Set(nodes.map(n => n.label))],
        edgeTypes: [...new Set(edges.map(e => e.type || 'IS_PARENT_OF'))]
      }
    };
    
    const dataStr = JSON.stringify(snapshot, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datarobot-lineage-snapshot-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearCache = async () => {
    try {
      setIsLoading(true);
      console.log('🗑️ Clearing cache...');
      
      const response = await fetch(`${baseURL}/cache`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Cache cleared! Deleted ${result.filesDeleted} files:`, result.files);
        alert(`Cache cleared successfully! Deleted ${result.filesDeleted} cache files. The next use case selection will fetch fresh data from DataRobot.`);
        
        // Reset current graph state
        setNodes([]);
        setEdges([]);
        setSelectedEntity(null);
        setSelectedNode(null);
        setUseCaseSelection(null);
        setUseCaseRetrieved(true);
        setGraphKey(prev => prev + 1);
      } else {
        console.error('❌ Failed to clear cache:', result.message);
        alert(`Failed to clear cache: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      alert(`Error clearing cache: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced feature handlers
  const handleNodeSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setSearchResult(null);
    }
  };

  const handleSearchResult = (result) => {
    setSearchResult(result);
  };

  const toggleFloatingLegend = () => {
    setShowFloatingLegend(!showFloatingLegend);
    if (!showFloatingLegend) {
      setShowEmbeddedLegend(false); // Hide embedded when floating is shown
    }
  };

  const toggleEmbeddedLegend = () => {
    setShowEmbeddedLegend(!showEmbeddedLegend);
  };

  const toggleMiniMode = () => {
    setIsMiniMode(!isMiniMode);
    if (!isMiniMode) {
      // Entering mini mode - hide legends
      setShowEmbeddedLegend(false);
      setShowFloatingLegend(false);
    } else {
      // Exiting mini mode - show embedded legend
      setShowEmbeddedLegend(true);
    }
  };

  const toggleNodeLabels = () => {
    setShowNodeLabels(!showNodeLabels);
  };

  const toggleEdgeLabels = () => {
    setShowEdgeLabels(!showEdgeLabels);
  };

  return (
    <div className="App">
      {!loggedIn || isLoading ? (
        <LoginBox onLogin={handleLogin} />
      ) : (
        <>
        <div className="sidebar left-sidebar">
          <h2>Artifacts</h2>
          <EntityList nodes={nodes} onEntitySelection={handleEntitySelection} />
        </div>

          <div className="main-container">  
            <Tabs id="controlled-tab-example" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">

            <Tab eventKey="explore-data" title="Explore Data">
            <UseCases onUseCaseSelection={handleUseCaseSelection}/>
            {/* <h2>Use Case Graph {useCaseSelection}</h2> */}
            {useCaseRetrieved ? (
              <>
              {/* Mini Mode Toggle */}
              <MiniModeToggle 
                isMiniMode={isMiniMode}
                onToggle={toggleMiniMode}
                nodeCount={nodes.length}
              />
              
              {/* Label Toggles */}
              <div className="mini-mode-toggle">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showNodeLabels}
                    onChange={toggleNodeLabels}
                  />
                  <span className="toggle-label">
                    🏷️ Show Node Labels
                  </span>
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={showEdgeLabels}
                    onChange={toggleEdgeLabels}
                  />
                  <span className="toggle-label">
                    🔗 Show Edge Labels
                  </span>
                </label>
                {(!showNodeLabels || !showEdgeLabels) && (
                  <div className="mini-mode-info">
                    <small>📝 {!showNodeLabels && !showEdgeLabels ? 'All labels hidden' : 
                              !showNodeLabels ? 'Node labels hidden' : 'Edge labels hidden'}</small>
                  </div>
                )}
              </div>
              
              {/* Enhanced Color Legend */}
              {showEmbeddedLegend && !isMiniMode && (
                <EnhancedColorLegend 
                  nodes={nodes} 
                  onNodeSearch={handleNodeSearch}
                  isFloating={false}
                />
              )}
              
              {/* Edge Legend */}
              {showEmbeddedLegend && !isMiniMode && edges.length > 0 && (
                <EdgeLegend 
                  edges={edges}
                  isExpanded={false}
                />
              )}
              
              {/* Enhanced Network Graph */}
              <NetworkGraph 
                key={graphKey}
                onNodeSelect={setSelectedNode} 
                nodes={nodes} 
                edges={edges} 
                selectedEntity={selectedEntity}
                searchTerm={searchTerm}
                onSearchResult={handleSearchResult}
                showNodeLabels={showNodeLabels}
                showEdgeLabels={showEdgeLabels}
              />
              
              {/* Controls */}
              <div className="button-container">
                <ExportGraph nodes={nodes} edges={edges} selectedEntity={selectedEntity} filename="graph"/>
                <button 
                  className="reset-button" 
                  onClick={handleGraphReset}
                  title="Reset view, clear search, and reload full graph"
                >
                  🔄 Reset Graph
                </button>
                <button 
                  className="reset-button" 
                  onClick={toggleEmbeddedLegend}
                  title={`${showEmbeddedLegend ? 'Hide' : 'Show'} the color and edge legends`}
                >
                  {showEmbeddedLegend ? '👁️ Hide' : '👁️ Show'} Legend
                </button>
                <button 
                  className="debug-button" 
                  onClick={clearCache}
                  title="Clear cached graph data and force fresh API queries"
                >
                  🗑️ Clear Cache
                </button>
                <button 
                  className="debug-button" 
                  onClick={exportGraphSnapshot}
                  title="Download current graph state for debugging and sharing"
                >
                  📸 Debug Snapshot
                </button>
              </div>
              
              {/* Search Result Info */}
              {searchResult && (
                <div className="graph-controls">
                  <div className="graph-stats">
                    🎯 Found: <strong>{searchResult.label}</strong> - {searchResult.name || searchResult.id}
                  </div>
                </div>
              )}

              {/* Graph Statistics */}
              {nodes.length > 0 && (
                <div className="graph-controls">
                  <div className="graph-stats">
                    📊 <strong>{nodes.length}</strong> nodes • <strong>{edges.length}</strong> edges
                    {selectedEntity && (
                      <span> • Filtered view</span>
                    )}
                    <span style={{ marginLeft: '15px', fontSize: '12px', color: '#6c757d' }}>
                      💡 Double-click nodes to open in DataRobot • Use mouse wheel to zoom
                    </span>
                  </div>
                </div>
              )}
              </>
            ) : (
              <Loader/>             
            )
            }
            </Tab>
            <Tab eventKey="chat" title="Chat with your Data">
              <h2>Use Case {useCaseSelection}</h2>
              <Chat />
            </Tab>
          </Tabs>
          </div>
          <NodeData selectedNode={selectedNode} nodeData={nodes} />
          
          {/* Floating Legend Toggle */}
          {nodes.length > 0 && !isMiniMode && (
            <EnhancedColorLegend 
              nodes={nodes} 
              onNodeSearch={handleNodeSearch}
              isFloating={true}
              onToggle={toggleFloatingLegend}
            />
          )}
          
          {/* Floating Legend Modal */}
          {showFloatingLegend && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              width: '350px',
              zIndex: 1000,
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <EnhancedColorLegend 
                nodes={nodes} 
                onNodeSearch={handleNodeSearch}
                isFloating={false}
              />
              <div style={{ padding: '10px', textAlign: 'center' }}>
                <button onClick={toggleFloatingLegend} style={{ width: '100%' }}>
                  Close Legend
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
    </div>
  );

}

export default App;
