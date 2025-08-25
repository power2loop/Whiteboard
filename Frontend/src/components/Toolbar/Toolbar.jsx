import React from 'react';
import './Toolbar.css';

const strokeColors = ['#191919', '#EF4444', '#22C55E', '#3B82F6', '#F59E42', '#191919'];
const backgroundColors = ['#fff', '#F8A5B3', '#BBF7D0', '#93E7FF', '#FDE68A', 'transparent'];

const Toolbar = () => {
    return (
        <div className="toolbar-container">

            <div className="toolbar-section">
                <div className="toolbar-label">Stroke</div>
                <div className="color-group">
                    {strokeColors.map((color, idx) => (
                        <button key={idx} className={`color-btn ${idx === 0 ? 'selected' : ''}`} style={{ backgroundColor: color }} />
                    ))}
                </div>
            </div>
            <div className="toolbar-section">
                <div className="toolbar-label">Background</div>
                <div className="color-group">
                    {backgroundColors.map((color, idx) => (
                        <button key={idx} className={`color-btn bg-btn ${idx === 0 ? 'selected' : ''}`} style={{ backgroundColor: color }} />
                    ))}
                </div>
            </div>
            <div className="toolbar-section">
                <div className="toolbar-label">Stroke width</div>
                <div className="option-group">
                    <button className="option-btn selected">−</button>
                    <button className="option-btn">−</button>
                </div>
            </div>
            <div className="toolbar-section">
                <div className="toolbar-label">Stroke style</div>
                <div className="option-group">
                    <button className="option-btn selected">─</button>
                    <button className="option-btn">····</button>
                </div>
            </div>
            <div className="toolbar-section">
                <div className="toolbar-label">Opacity</div>
                <div className="slider-row">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="100"
                        className="toolbar-slider"
                    />
                </div>
                <div className="opacity-values">
                    <span>0</span>
                    <span>100</span>
                </div>
            </div>

            <div className="toolbar-section">
                <div className="toolbar-label">Actions</div>
                <div className="action-group">
                    <button className="action-btn" title="Copy">⧉</button>
                    <button className="action-btn" title="Delete">🗑️</button>
                    <button className="action-btn" title="Link">🔗</button>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
