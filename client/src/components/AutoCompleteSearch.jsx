import React, { useState } from 'react';


function AutoCompleteSearch({items, onEntitySelection}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  
  const itemNames = Object.values(items).flat().map( artifact => artifact.name ? artifact.name : `${artifact.label}-${artifact.id}`)
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value) {
      const filteredSuggestions = itemNames.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion);
    setSuggestions([]);  // Clear suggestions after selection
    const selectedNode = Object.values(items).flat().filter( item => (item.name === suggestion) | (item.id === suggestion))[0]
    console.log(`checking the select based on the autocomplete search ${selectedNode.id}`)
    onEntitySelection(selectedNode.id)
    setQuery("")
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search Artifacts..."
        style={{ marginBottom: "10px" }} 
      />
      {suggestions.length > 0 && (
        <ul style={{ listStyleType: 'none'}}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              style={{ padding: '5px', cursor: 'pointer' }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutoCompleteSearch;
