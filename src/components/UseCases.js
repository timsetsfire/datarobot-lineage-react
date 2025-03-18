import React, { useState, useEffect } from 'react';
import '../App.css';

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
        onUseCaseSelection(useCase.name, [], [], false)
        try {
            const response = await fetch(`http://0.0.0.0:5000/getUseCaseGraph?useCaseId=${useCase.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Endpoint': endpoint,
                },
            });
            const data = await response.json();
            console.log(`use case returned ${JSON.stringify(data)}`)
            const nodeData = await fetch(`http://0.0.0.0:5000/getNodes?useCaseId=${useCase.id}`,
                {
                    method: 'GET'
                }
            )
            const edgeData = await fetch(`http://0.0.0.0:5000/getEdges?useCaseId=${useCase.id}`,
                {
                    method: 'GET'
                }
            )
            const nodes = await nodeData.json();
            const edges = await edgeData.json();
            sessionStorage.setItem('nodes', JSON.stringify(nodes));
            sessionStorage.setItem('edges', JSON.stringify(edges));
            onUseCaseSelection(useCase.name, nodes, edges, true)
        } catch (error) {
            console.error('Error:', error);
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
