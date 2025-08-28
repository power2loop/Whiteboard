import { useState, useEffect } from "react";
import './BottomControls.css';
import { BiUndo } from "react-icons/bi";
import { BiRedo } from "react-icons/bi";

const BottomControls = ({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
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
