import React, { useState, useEffect } from 'react';
import LoginBox from "./components/Login";
import UseCases from "./components/UseCases";
import NetworkGraph from './components/NetworkGraph';
import NodeData from "./components/NodeData";
import EntityList from "./components/EntityList";
import Loader from "./components/Loader";
import ExportGraph from './components/ExportGraph';
import Chat from "./components/Chat";
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
        </div>

          <div className="main-container">  
            <Tabs id="controlled-tab-example" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">

            <Tab eventKey="explore-data" title="Explore Data">
            <UseCases onUseCaseSelection={handleUseCaseSelection}/>
            {/* <h2>Use Case Graph {useCaseSelection}</h2> */}
            {useCaseRetrieved ? (
              <>
              <NetworkGraph onNodeSelect={setSelectedNode} nodes={nodes} edges={edges} selectedEntity={selectedEntity}/>
              <div className="button-container">
              <ExportGraph nodes={nodes} edges={edges} selectedEntity={selectedEntity} filename="graph"/>
              <button className="reset-button" onClick={handleGraphReset}>Reset Graph</button>
              </div>
              </>
            ) : (
              <Loader/>             
              // 
              // <p>Retrieving Use Case, this might take a moment</p>
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
        </>
      )}
      
    </div>
  );

}

export default App;
