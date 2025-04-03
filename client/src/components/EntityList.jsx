import React, { useState } from 'react';
import { Collapse } from 'react-collapse';
import SearchBar from "./SearchBar";
import AutoCompleteSearch from './AutoCompleteSearch';
import '../App.css';

const EntityList = ( {nodes, onEntitySelection}) => {

    const [entities, setEntities] = useState({})
    var artifacts = {}
    for (let i = 0; i < nodes.length; i++) {
        var node = nodes[i]
        var nodeType = node["label"]

        if (artifacts[nodeType]) {
            artifacts[nodeType].push(node)
        } else {
            artifacts[nodeType] = [node]
        }
    }

    const defaultCollapse = Object.fromEntries(
        Object.entries(artifacts).map(([key, value]) => [key, false]) // set all to false (collapsed by default)
    );

    const [collapsed, setCollapsed] = useState(defaultCollapse);
    
    const [query, setQuery] = useState('');

    const handleInputChange = (event) => {
        const newQuery = event.target.value;
        console.log(`current query: ${newQuery}`)
        setQuery(newQuery);
        // onSearch(newQuery); 
    };

    const toggleCollapse = (entity) => {
        setCollapsed((prevState) => ({
            ...prevState,
            [entity]: !prevState[entity]
        }))
    }

    const handleEntitySelection = (entity) => { 
        console.log(`checking log from within artifact collapsable boxes ${entity.target.id}`)
        onEntitySelection(entity.target.id)
    }

    // console.log("checking flattened artifacts in EntityList")
    // console.log(Object.values(artifacts).flat())
    // const handleSearch = (query) => {
    //     if (query) {
    //       const filteredResults = Object.entries(artifacts).map( ([artifactType, artifactList]) => )
    //       setSearchResults(filteredResults);
    //     } else {
    //       setSearchResults(items);
    //     }
    //   };

    const entityListHtml = Object.entries(artifacts).map(([artifactType, artifactList]) => (
        // <li className="list-item" key={artifactType} onClick={() => toggleCollapse(artifactType)}>
        <li className = "list-item" key={artifactType}>
            <button onClick={() => toggleCollapse(artifactType)}>
                {artifactType}
            </button>
            <Collapse isOpened={collapsed[artifactType]}>
                <ul>
                    {artifactList.map((artifact) => (
                        <li className="list-item" id={artifact.id} value={artifact.id} key={artifact.id} title={artifact.name || `${artifact.label}-${artifact.id}`} onClick={handleEntitySelection}>
                            {artifact.name || `${artifact.label}-${artifact.id}`}
                        </li>
                    ))}
                </ul>
            </Collapse>
        </li>
    ))

    return (
        <div>
            <AutoCompleteSearch items={artifacts} onEntitySelection={onEntitySelection}/>
            {entityListHtml}
        </div>
    )
}

export default EntityList;