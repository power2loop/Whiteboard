//App.jsx
import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import Rightbar from '../components/Rightbar/Rightbar';
import "./App.css";
import { useState, useRef } from 'react';

function App() {
  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showToolbar, setShowToolbar] = useState(false);

  // Add new states for toolbar properties
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState("solid");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(100);

  // Zoom state
  const [zoom, setZoom] = useState(1);

  // Undo/Redo state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoFunctionRef = useRef(null);
  const redoFunctionRef = useRef(null);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    if (["hand", "select", "image", "eraser"].includes(tool)) {
      setShowToolbar(false);
    } else {
      setShowToolbar(true);
    }
  };

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  const handleUndo = () => {
    if (undoFunctionRef.current) {
      undoFunctionRef.current();
    }
  };

  const handleRedo = () => {
    if (redoFunctionRef.current) {
      redoFunctionRef.current();
    }
  };

  return (
    <div className="app">
      <div className="layout">
        <header className="topbar">
          <Topbar
            onToolSelect={handleToolSelect}
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </header>
        <aside className="sidebar">
          <Sidebar />
        </aside>
        <aside className="rightbar">
          <Rightbar />
        </aside>
        <main className="canvas">
          <Canvas
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            selectedColor={selectedColor}
            strokeWidth={strokeWidth}
            strokeStyle={strokeStyle}
            backgroundColor={backgroundColor}
            opacity={opacity}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onUndo={(undoFunc) => { undoFunctionRef.current = undoFunc; }}
            onRedo={(redoFunc) => { redoFunctionRef.current = redoFunc; }}
            canUndo={(canUndoState) => setCanUndo(canUndoState)}
            canRedo={(canRedoState) => setCanRedo(canRedoState)}
          />
        </main>
        {showToolbar && (
          <aside className="toolbar">
            <Toolbar
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
              backgroundColor={backgroundColor}
              onBackgroundColorSelect={setBackgroundColor}
              strokeWidth={strokeWidth}
              onStrokeWidthSelect={setStrokeWidth}
              strokeStyle={strokeStyle}
              onStrokeStyleSelect={setStrokeStyle}
              opacity={opacity}
              onOpacityChange={setOpacity}
            />
          </aside>
        )}
        <footer className="bottom-controls">
          <BottomControls 
            zoom={zoom * 100}
            onZoomChange={handleZoomChange}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </footer>
      </div>
    </div>
  );
}

export default App;
