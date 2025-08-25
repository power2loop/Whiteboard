import React from 'react';
import './Toolbar.css';
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { CgBorderStyleDashed } from "react-icons/cg";
import { CgBorderStyleDotted } from "react-icons/cg";
import { PiWaveSineDuotone } from "react-icons/pi";
import { GoCopy } from "react-icons/go";
import { AiOutlineDelete } from "react-icons/ai";
import { IoIosLink } from "react-icons/io";

const strokeColors = ['#191919', '#EF4444', '#22C55E', '#3B82F6', '#F59E42', '#00fffbff'];
const backgroundColors = ['#e8e8e8ff', '#F8A5B3', '#BBF7D0', '#93E7FF', '#FDE68A', '#22C55E'];

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
                    <button className="option-btn stroke-width thin"></button>
                    <button className="option-btn stroke-width medium"></button>
                    <button className="option-btn stroke-width thick"></button>
                </div>
            </div>

            <div className="toolbar-section">
                <div className="toolbar-label">Stroke style</div>
                <div className="option-group">
                    <button className="option-btn stroke-style"><TfiLayoutLineSolid /></button>
                    <button className="option-btn stroke-style"><CgBorderStyleDashed /></button>
                    <button className="option-btn stroke-style"><CgBorderStyleDotted /></button>
                    <button className="option-btn stroke-style"><PiWaveSineDuotone /></button>
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
                    <button className="action-btn" title="Copy"><GoCopy /></button>
                    <button className="action-btn" title="Delete"><AiOutlineDelete /></button>
                    <button className="action-btn" title="Link"><IoIosLink /></button>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
