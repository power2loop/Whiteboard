import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import Rightbar from '../components/Rightbar/Rightbar';
import "./App.css";
import { useState } from 'react';

function App() {
  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showToolbar, setShowToolbar] = useState(false);

  // Add new states for toolbar properties
  const [strokeWidth, setStrokeWidth] = useState(2); // thin: 1, medium: 2, thick: 4
  const [strokeStyle, setStrokeStyle] = useState("solid"); // solid, dashed, dotted, wavy
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(100);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    if (["lock", "hand", "select", "text", "image", "eraser", "laser"].includes(tool)) {
      setShowToolbar(false);
    } else {
      setShowToolbar(true);
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
            selectedColor={selectedColor}
            strokeWidth={strokeWidth}
            strokeStyle={strokeStyle}
            backgroundColor={backgroundColor}
            opacity={opacity}
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
          <BottomControls />
        </footer>
      </div>
    </div>
  );
}

export default App;
