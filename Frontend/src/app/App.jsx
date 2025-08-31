import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import Rightbar from '../components/Rightbar/Rightbar';
import socketService from '../services/socket/socket.service.js';
import "./App.css";
import { useState, useRef, useCallback, useEffect } from 'react';

function App() {
  // Collaboration state
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(null);

  // Tool and drawing states
  const [selectedTool, setSelectedTool] = useState("hand");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showToolbar, setShowToolbar] = useState(false);

  // Toolbar properties
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
  const canvasAddImageRef = useRef(null);

  // Save function references
  const canvasSaveRef = useRef(null);
  const canvasExportRef = useRef(null);

  // Enhanced collaboration handler
  const handleStartCollaboration = useCallback((boardId, userId, userName) => {
    console.log('🚀 Starting collaboration:', { boardId, userId, userName });
    
    // Connect to socket
    socketService.connect();
    
    // Wait for connection then join room
    setTimeout(() => {
      if (socketService.joinRoom(boardId, userId, userName)) {
        setIsCollaborating(true);
        setCurrentBoardId(boardId);
        
        // Set up socket event listeners
        socketService.onBoardState((data) => {
          console.log('📊 Received board state:', data);
          if (canvasLoadRef.current && data.shapes) {
            canvasLoadRef.current({ shapes: data.shapes });
          }
          setCollaborators(data.collaborators || []);
        });
        
        socketService.onUserJoined((data) => {
          console.log('👋 User joined:', data.user.name);
          setCollaborators(data.collaborators);
        });
        
        socketService.onUserLeft((data) => {
          console.log('👋 User left:', data.user.name);
          setCollaborators(data.collaborators);
        });
        
        socketService.onShapesUpdate((data) => {
          console.log('🎨 Shapes updated by:', data.updatedBy || 'collaborator');
          if (canvasLoadRef.current) {
            canvasLoadRef.current({ shapes: data.shapes });
          }
        });
        
        socketService.onCanvasClear(() => {
          console.log('🧹 Canvas cleared by collaborator');
          if (canvasClearRef.current) {
            canvasClearRef.current();
          }
        });

        // Additional collaboration events
        socketService.onDrawingStart((data) => {
          console.log('🎨 Remote drawing started:', data);
        });

        socketService.onDrawingUpdate((data) => {
          console.log('🎨 Remote drawing updated');
        });

        socketService.onDrawingEnd((data) => {
          console.log('🎨 Remote drawing ended:', data);
        });
      }
    }, 1000);
  }, []);

  // Check for collaboration URL parameters on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('boardId');
    
    if (boardId) {
      console.log('🔗 Auto-joining collaboration from URL:', boardId);
      
      // Get user info (you could also check if user is logged in)
      const userName = prompt("Enter your name to join this whiteboard collaboration:") || "Anonymous User";
      const userId = `guest_${Date.now()}_${Math.random()}`;
      
      // Start collaboration after a short delay
      setTimeout(() => {
        handleStartCollaboration(boardId, userId, userName);
      }, 500);
      
      // Clean URL after joining (optional)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleStartCollaboration]);

  // Enhanced collaboration callbacks
  const handleShapesChange = useCallback((shapes) => {
    if (isCollaborating && socketService.isSocketConnected()) {
      console.log('📤 Emitting shapes update, count:', shapes.length);
      socketService.emitShapesUpdate(shapes);
    }
  }, [isCollaborating]);

  const handleDrawingStart = useCallback((data) => {
    if (isCollaborating && socketService.isSocketConnected()) {
      console.log('📤 Emitting drawing start:', data.tool);
      socketService.emitDrawingStart(data);
    }
  }, [isCollaborating]);

  const handleDrawingUpdate = useCallback((data) => {
    if (isCollaborating && socketService.isSocketConnected()) {
      socketService.emitDrawingUpdate(data);
    }
  }, [isCollaborating]);

  const handleDrawingEnd = useCallback((data) => {
    if (isCollaborating && socketService.isSocketConnected()) {
      console.log('📤 Emitting drawing end:', data.tool);
      socketService.emitDrawingEnd(data);
    }
  }, [isCollaborating]);

  const handleCanvasClearCollaboration = useCallback(() => {
    if (isCollaborating && socketService.isSocketConnected()) {
      console.log('📤 Emitting canvas clear');
      socketService.emitCanvasClear();
    }
  }, [isCollaborating]);

  const handleCursorMove = useCallback((x, y) => {
    if (isCollaborating && socketService.isSocketConnected()) {
      socketService.emitCursorMove(x, y);
    }
  }, [isCollaborating]);

  // Tool selection handler
  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    if (["hand", "select", "image", "eraser"].includes(tool)) {
      setShowToolbar(false);
    } else {
      setShowToolbar(true);
    }
  };

  // Undo/Redo handlers
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

  // Canvas action handlers
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
        
        // Emit clear event for collaboration
        handleCanvasClearCollaboration();
      } catch (error) {
        console.error('Failed to clear canvas:', error);
      }
    }
  };

  // Save canvas handler
  const handleSaveCanvas = async () => {
    if (canvasSaveRef.current) {
      try {
        await canvasSaveRef.current();
        console.log('Canvas saved successfully!');
      } catch (error) {
        console.error('Failed to save canvas:', error);
        alert('Failed to save canvas. Please try again.');
      }
    } else {
      alert('Save functionality not available yet. Please wait a moment.');
    }
  };

  // Export image handler
  const handleExportImage = async () => {
    if (canvasExportRef.current) {
      try {
        await canvasExportRef.current();
        console.log('Image exported successfully!');
      } catch (error) {
        console.error('Failed to export image:', error);
        alert('Failed to export image. Please try again.');
      }
    } else {
      alert('Export functionality not available yet. Please wait a moment.');
    }
  };

  // Handle save functions from Canvas
  const handleSaveFunctions = (functions) => {
    canvasSaveRef.current = functions.saveCanvas;
    canvasExportRef.current = functions.exportImage;
  };

  // Handle reset canvas from Sidebar
  const handleResetCanvas = () => {
    handleClearCanvas();
  };

  // Handle help from Sidebar
  const handleShowHelp = () => {
    alert('Help: Use the tools to draw, add text, or insert images. Use Ctrl+Z for undo and Ctrl+Y for redo. Click Save to download your work!');
  };

  // File handling function
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCollaborating) {
        socketService.leaveRoom();
        socketService.disconnect();
      }
    };
  }, [isCollaborating]);

  // Debug collaboration state
  useEffect(() => {
    console.log('Collaboration state:', { 
      isCollaborating, 
      collaboratorsCount: collaborators.length,
      currentBoardId,
      socketConnected: socketService.isSocketConnected()
    });
  }, [isCollaborating, collaborators.length, currentBoardId]);

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
          <Sidebar
            onOpenFile={handleOpenFile}
            onSaveCanvas={handleSaveCanvas}
            onExportImage={handleExportImage}
            onResetCanvas={handleResetCanvas}
            onShowHelp={handleShowHelp}
          />
        </aside>
        
        <aside className="rightbar">
          <Rightbar 
            onStartCollaboration={handleStartCollaboration}
            isCollaborating={isCollaborating}
            collaborators={collaborators}
          />
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
            onSaveFunction={handleSaveFunctions}
            
            // Collaboration props with proper handlers
            onShapesChange={handleShapesChange}
            onDrawingStart={handleDrawingStart}
            onDrawingUpdate={handleDrawingUpdate}
            onDrawingEnd={handleDrawingEnd}
            onCanvasClearCollaboration={handleCanvasClearCollaboration}
            onCursorMove={handleCursorMove}
            isCollaborating={isCollaborating}
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
      
      {/* Collaboration status indicator */}
      {/* {isCollaborating && (
        <div className="collaboration-indicator">
          <div className="collaboration-status">
            <div className="status-dot"></div>
            <span>Live collaboration active</span>
            {collaborators.length > 0 && (
              <span className="collaborators-count-small">
                {collaborators.length} online
              </span>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}

export default App;
