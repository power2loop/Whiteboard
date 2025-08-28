import { useState, useEffect, useRef } from "react";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import './BottomControls.css';
import { BiUndo, BiRedo } from "react-icons/bi";

const BottomControls = ({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  selectedColor = "#8F4A3D",
  onColorChange
}) => {
  const [color, setColor] = useColor(selectedColor);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  const colorButtonRef = useRef(null);

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

  const handleColorChange = (newColor) => {
    setColor(newColor);
    if (onColorChange) {
      onColorChange(newColor.hex);
    }
  };

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
  };

  // Safe color hex extraction
  const getColorHex = () => {
    if (!color || !color.hex) return selectedColor;
    return color.hex;
  };

  // Safe color hex display (without #)
  const getDisplayHex = () => {
    const hex = getColorHex();
    return hex.startsWith('#') ? hex.slice(1).toUpperCase() : hex.toUpperCase();
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target) &&
        colorButtonRef.current &&
        !colorButtonRef.current.contains(event.target)
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // Update color when prop changes
  useEffect(() => {
    if (selectedColor && selectedColor !== getColorHex()) {
      setColor(selectedColor);
    }
  }, [selectedColor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close color picker on Escape
      if (e.key === 'Escape' && showColorPicker) {
        setShowColorPicker(false);
        return;
      }

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
  }, [canUndo, canRedo, onUndo, onRedo, showColorPicker]);

  return (
    <div className='bottomcontrols-container'>
      <div className="control-group color-control-group">
        <div className="color-picker-wrapper">
          <button
            ref={colorButtonRef}
            className="color-picker-button"
            onClick={toggleColorPicker}
            aria-label="Select color"
            title="Select color"
          >
            <div 
              className="color-preview-circle"
              style={{ backgroundColor: getColorHex() }}
            />
            <span className="color-hex-display">#{getDisplayHex()}</span>
          </button>
          
          {showColorPicker && color && (
            <div 
              ref={colorPickerRef}
              className="color-picker-popup"
            > 
              <ColorPicker 
                color={color} 
                onChange={handleColorChange}
                hideInput={["rgb", "hsv"]}
              />
              
              <div className="color-picker-footer">
                <div className="selected-color-info">
                  <div 
                    className="selected-color-swatch"
                    style={{ backgroundColor: getColorHex() }}
                  />
                  <span className="selected-color-text">{getColorHex().toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
