import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import Rightbar from '../components/Rightbar/Rightbar';
import "./App.css";
import { useState, useRef } from 'react';

function App() {
  const [selectedTool, setSelectedTool] = useState("hand");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showToolbar, setShowToolbar] = useState(false);

  // Add new states for toolbar properties
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState("solid");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(100);

  // Canvas background color state
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");

  // Undo/Redo state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoFunctionRef = useRef(null);
  const redoFunctionRef = useRef(null);

  // Canvas action references
  const canvasCopyRef = useRef(null);
  const canvasClearRef = useRef(null);
  const canvasLoadRef = useRef(null);
  const canvasAddImageRef = useRef(null); // Add this new ref for adding images

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    if (["hand", "select", "image", "eraser"].includes(tool)) {
      setShowToolbar(false);
    } else {
      setShowToolbar(true);
    }
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

  const handleCopyCanvas = async () => {
    if (canvasCopyRef.current) {
      try {
        await canvasCopyRef.current();
        console.log('Canvas copied to clipboard successfully!');
        alert('Canvas copied to clipboard successfully!');
      } catch (error) {
        console.error('Failed to copy canvas:', error);
        alert('Failed to copy canvas. Please try again.');
      }
    }
  };

  const handleClearCanvas = () => {
    if (canvasClearRef.current) {
      try {
        canvasClearRef.current();
        console.log('Canvas cleared successfully!');
      } catch (error) {
        console.error('Failed to clear canvas:', error);
      }
    }
  };

  // Updated function to handle both canvas data and images
  const handleOpenFile = (fileData) => {
    if (fileData.type === 'canvas') {
      // Handle JSON canvas file
      if (canvasLoadRef.current && fileData.data) {
        try {
          canvasLoadRef.current(fileData.data);
          console.log('Canvas file loaded successfully!');
        } catch (error) {
          console.error('Failed to load canvas file:', error);
          alert('Failed to load canvas file. Please try again.');
        }
      }
    } else if (fileData.type === 'image') {
      // Handle image file
      if (canvasAddImageRef.current) {
        try {
          canvasAddImageRef.current(fileData.src, fileData.name);
          console.log('Image added to canvas successfully!');
        } catch (error) {
          console.error('Failed to add image to canvas:', error);
          alert('Failed to add image to canvas. Please try again.');
        }
      }
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
          <Sidebar onOpenFile={handleOpenFile} />
        </aside>
        <aside className="rightbar">
          <Rightbar />
        </aside>
        {showToolbar && (
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
            onCopyCanvas={handleCopyCanvas}
            onClearCanvas={handleClearCanvas}
          />
        )}
        <main className="canvas">
          <Canvas
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            selectedColor={selectedColor}
            strokeWidth={strokeWidth}
            strokeStyle={strokeStyle}
            backgroundColor={backgroundColor}
            opacity={opacity}
            canvasBackgroundColor={canvasBackgroundColor}
            onUndoFunction={(undoFn) => { undoFunctionRef.current = undoFn; }}
            onRedoFunction={(redoFn) => { redoFunctionRef.current = redoFn; }}
            onCanUndo={setCanUndo}
            onCanRedo={setCanRedo}
            onCopyFunction={(copyFn) => { canvasCopyRef.current = copyFn; }}
            onClearFunction={(clearFn) => { canvasClearRef.current = clearFn; }}
            onLoadCanvasData={(loadFn) => { canvasLoadRef.current = loadFn; }}
            onAddImageToCanvas={(addImageFn) => { canvasAddImageRef.current = addImageFn; }}
          />
        </main>
        <footer className="bottom-controls">
          <BottomControls
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            canvasBackgroundColor={canvasBackgroundColor}
            onCanvasBackgroundColorChange={setCanvasBackgroundColor}
          />
        </footer>
      </div>
    </div>
  );
}

export default App;
