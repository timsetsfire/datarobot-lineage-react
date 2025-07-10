import React from 'react';
import '../App.css';

const MiniModeToggle = ({ isMiniMode, onToggle, nodeCount }) => {
    return (
        <div className="mini-mode-toggle">
            <label>
                <input 
                    type="checkbox" 
                    checked={isMiniMode}
                    onChange={onToggle}
                />
                <span className="toggle-label">
                    📱 Mini Mode ({nodeCount} nodes)
                </span>
            </label>
            {isMiniMode && (
                <div className="mini-mode-info">
                    <small>🔍 Labels hidden • Legend collapsed • Overview mode</small>
                </div>
            )}
        </div>
    );
};

export default MiniModeToggle; 