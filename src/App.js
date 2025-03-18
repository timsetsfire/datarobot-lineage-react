import React, { useState, useEffect } from 'react';
import LoginBox from "./components/Login";
import UseCases from "./components/UseCases";
import NetworkGraph from './components/NetworkGraph';
import NodeData from "./components/NodeData";
import EntityList from "./components/EntityList";
import './App.css';


function App() {

  // console.log(sessionStorage)
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

 
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // const [useCases, setUseCases] = useState([]);
  const [useCaseSelection, setUseCaseSelection] = useState(null);
  const [useCaseRetrieved, setUseCaseRetrieved] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState(null)


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
      const response = await fetch('http://0.0.0.0:5000/getUseCases', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Endpoint': endpoint,
        },
      });
      const data = await response.json();
      sessionStorage.setItem('useCases', JSON.stringify(data));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false); // Set loading to false after the fetch completes
    }
  };


  const handleUseCaseSelection = (useCase, nodes, edges, done) => {
    setSelectedEntity(null)
    setUseCaseSelection(useCase)
    setNodes(nodes)
    setEdges(edges)
    setSelectedNode(null)
    setUseCaseRetrieved(done)
  };

  const handleEntitySelection = (event) => { 
    setSelectedEntity( event )
  }

  const handleGraphReset = () => setSelectedEntity(null)

  return (
    <div className="App">
      {!loggedIn || isLoading ? (
        <LoginBox onLogin={handleLogin} />
      ) : (
        <>
        <div className="sidebar left-sidebar">
          <h2>Artifacts</h2>
          <EntityList nodes={nodes} onEntitySelection={handleEntitySelection} />
            <button className="reset-button" onClick={handleGraphReset}>Reset Graph</button>
        </div>
          <div className="main-container">  
            <UseCases onUseCaseSelection={handleUseCaseSelection}/>
            <h2>Use Case Graph {useCaseSelection}</h2>
            {useCaseRetrieved ? (
              <NetworkGraph onNodeSelect={setSelectedNode} nodes={nodes} edges={edges} selectedEntity={selectedEntity}/>
            ) : ( <p>Retrieving Use Case, this might take a moment</p>)
            }
          </div>
          <NodeData selectedNode={selectedNode} nodeData={nodes} />
        </>
      )}
      
    </div>
  );

}

export default App;
