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
  onColorChange,
  canvasBackgroundColor = "#ffffff",
  onCanvasBackgroundColorChange
}) => {
  // Initialize colors with proper format for react-color-palette
  const [color, setColor] = useColor(selectedColor || "#000000");
  const [bgColor, setBgColor] = useColor(canvasBackgroundColor || "#ffffff");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  const bgColorPickerRef = useRef(null);
  const colorButtonRef = useRef(null);
  const bgColorButtonRef = useRef(null);

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

  // const handleColorChange = (newColor) => {
  //   setColor(newColor);
  //   if (onColorChange && newColor?.hex) {
  //     onColorChange(newColor.hex);
  //   }
  // };

  const handleBgColorChange = (newColor) => {
    setBgColor(newColor);
    if (onCanvasBackgroundColorChange && newColor?.hex) {
      onCanvasBackgroundColorChange(newColor.hex);
    }
  };

  // const toggleColorPicker = () => {
  //   setShowColorPicker(!showColorPicker);
  // };

  const toggleBgColorPicker = () => {
    setShowBgColorPicker(!showBgColorPicker);
  };

  // Safe color hex extraction with fallbacks
  // const getColorHex = () => {
  //   return color?.hex || selectedColor || "#000000";
  // };

  const getBgColorHex = () => {
    return bgColor?.hex || canvasBackgroundColor || "#ffffff";
  };

  // Safe color hex display (without #)
  // const getDisplayHex = () => {
  //   const hex = getColorHex();
  //   return hex.startsWith('#') ? hex.slice(1).toUpperCase() : hex.toUpperCase();
  // };

  const getBgDisplayHex = () => {
    const hex = getBgColorHex();
    return hex.startsWith('#') ? hex.slice(1).toUpperCase() : hex.toUpperCase();
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // if (
      //   colorPickerRef.current &&
      //   !colorPickerRef.current.contains(event.target) &&
      //   colorButtonRef.current &&
      //   !colorButtonRef.current.contains(event.target)
      // ) {
      //   setShowColorPicker(false);
      // }

      if (
        bgColorPickerRef.current &&
        !bgColorPickerRef.current.contains(event.target) &&
        bgColorButtonRef.current &&
        !bgColorButtonRef.current.contains(event.target)
      ) {
        setShowBgColorPicker(false);
      }
    };

    if (showBgColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBgColorPicker]);

  // Update color when prop changes - with proper error handling
  // useEffect(() => {
  //   if (selectedColor && selectedColor !== getColorHex()) {
  //     try {
  //       setColor(selectedColor);
  //     } catch (error) {
  //       console.warn('Error setting color:', error);
  //       setColor("#000000"); // Fallback to black
  //     }
  //   }
  // }, [selectedColor]);

  useEffect(() => {
    if (canvasBackgroundColor && canvasBackgroundColor !== getBgColorHex()) {
      try {
        setBgColor(canvasBackgroundColor);
      } catch (error) {
        console.warn('Error setting background color:', error);
        setBgColor("#ffffff"); // Fallback to white
      }
    }
  }, [canvasBackgroundColor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close color picker on Escape
      if (e.key === 'Escape' && (showBgColorPicker)) {
        // setShowColorPicker(false);
        setShowBgColorPicker(false);
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
  }, [canUndo, canRedo, onUndo, onRedo, showBgColorPicker]);

  return (
    <div className='bottomcontrols-container'>
      {/* Stroke Color Picker */}
      {/* <div className="control-group color-control-group">
        <div className="color-picker-wrapper"> 
          <button
            ref={colorButtonRef}
            className="color-picker-button"
            onClick={toggleColorPicker}
            aria-label="Select stroke color"
            title="Select stroke color"
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
      </div> */}

      {/* Background Color Picker */}
      <div className="control-group color-control-group">
        <div className="color-picker-wrapper">
          <button
            ref={bgColorButtonRef}
            className="color-picker-button"
            onClick={toggleBgColorPicker}
            aria-label="Select canvas background color"
            title="Select canvas background color"
          >
            <div
              className="color-preview-circle"
              style={{ backgroundColor: getBgColorHex() }}
            />
            <span className="color-hex-display">#{getBgDisplayHex()}</span>
          </button>

          {showBgColorPicker && bgColor && (
            <div
              ref={bgColorPickerRef}
              className="color-picker-popup"
            >
              <ColorPicker
                color={bgColor}
                onChange={handleBgColorChange}
                hideInput={["rgb", "hsv"]}
              />

              <div className="color-picker-footer">
                <div className="selected-color-info">
                  <div
                    className="selected-color-swatch"
                    style={{ backgroundColor: getBgColorHex() }}
                  />
                  <span className="selected-color-text">{getBgColorHex().toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Undo/Redo Controls */}
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
