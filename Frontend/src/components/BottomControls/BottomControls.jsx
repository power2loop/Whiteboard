//BottomControls.jsx
import { useState, useEffect } from "react";
import './BottomControls.css';
import { HiOutlineMinus } from "react-icons/hi";
import { RxPlus } from "react-icons/rx";
import { BiUndo } from "react-icons/bi";
import { BiRedo } from "react-icons/bi";

const BottomControls = ({ 
  zoom = 100, 
  onZoomChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false 
}) => {
  const decrease = () => {
    const newZoom = Math.max(10, zoom - 10);
    onZoomChange?.(newZoom / 100);
  };

  const increase = () => {
    const newZoom = Math.min(500, zoom + 10);
    onZoomChange?.(newZoom / 100);
  };

  const handleUndo = () => {
    if (canUndo && onUndo) {
      onUndo();
    }
  };

  const handleRedo = () => {
    if (canRedo && onRedo) {
      onRedo();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <div className='bottomcontrols-container'>
      <div className="control-group">
        <button 
          className="control-btn" 
          onClick={decrease}
          disabled={zoom <= 10}
          aria-label="Zoom out"
        >
          <HiOutlineMinus />
        </button>
        <span className="control-value">{Math.round(zoom)}%</span>
        <button 
          className="control-btn" 
          onClick={increase}
          disabled={zoom >= 500}
          aria-label="Zoom in"
        >
          <RxPlus />
        </button>
      </div>
      <div className='control-group'>
        <button 
          className={`control-btn ${!canUndo ? 'disabled' : ''}`}
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label='Undo (Ctrl+Z)'
          title="Undo (Ctrl+Z)"
        >
          <BiUndo />
        </button>
        <button 
          className={`control-btn ${!canRedo ? 'disabled' : ''}`}
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label='Redo (Ctrl+Y)'
          title="Redo (Ctrl+Y)"
        >
          <BiRedo />
        </button>
      </div>
    </div>
  );
};

export default BottomControls;
