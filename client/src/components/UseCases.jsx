import React, { useState, useEffect } from 'react';
import '../App.css';


const baseURL = "http://localhost:8080";

console.log(`checking in UseCases.jsx: ${baseURL}`)   
// populate dropdown with use cases
const UseCases = ({ onUseCaseSelection }) => {
    const [useCases, setUseCases] = useState([]);
    const [selectedUseCaseId, setSelectedUseCaseId] = useState('');

    // Retrieve the JSON from sessionStorage when the component mounts
    useEffect(() => {
        const useCases = sessionStorage.getItem('useCases');
        if (useCases) {
            setUseCases(JSON.parse(useCases));  // Parse the stored JSON string to an object
        }
    }, []);

    const handleChange = async (event) => {
        const selectedUseCaseId = event.target.value;
        const token = sessionStorage.getItem('token');
        const endpoint = sessionStorage.getItem('endpoint');
        setSelectedUseCaseId(selectedUseCaseId);  // Update the state with the selected id
        const useCase = useCases.find(item => item.id === selectedUseCaseId);
        
        console.log(`🔍 Loading use case: ${useCase.name} (ID: ${useCase.id})`);
        onUseCaseSelection(useCase.name, [], [], false)
        
        const startTime = Date.now();
        try {
            console.log(`⏳ Fetching graph data for ${useCase.name}...`);
            const response = await fetch(`${baseURL}/getUseCaseGraph?useCaseId=${useCase.id}`, {
                method: 'GET',
                headers: {
                    'token': token,
                    'Endpoint': endpoint,
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const loadTime = Date.now() - startTime;
            
            const nodes = data.nodes;
            const edges = data.edges;
            
            console.log(`✅ Graph loaded in ${loadTime}ms`);
            console.log(`📊 Nodes: ${nodes?.length || 0}, Edges: ${edges?.length || 0}`);
            console.log(`📁 Data size: ~${JSON.stringify(data).length} characters`);
            
            sessionStorage.setItem('nodes', JSON.stringify(nodes));
            sessionStorage.setItem('edges', JSON.stringify(edges));
            onUseCaseSelection(useCase.name, nodes, edges, true)
        } catch (error) {
            const loadTime = Date.now() - startTime;
            console.error(`❌ Error after ${loadTime}ms:`, error);
            onUseCaseSelection(useCase.name, [], [], true); // Show empty state instead of infinite loading
        } finally {
            console.log("done");
        }

    };


    return (
        <div>
            <h3>Select a Use Case:</h3>
            <select onChange={handleChange} value={selectedUseCaseId}>
                <option value="">-- Select --</option>
                {useCases.length > 0 ? (
                    useCases.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.name}
                        </option>
                    ))
                ) : (
                    <option disabled>Loading options...</option>
                )}
            </select>
        </div>
    );
};

export default UseCases;
