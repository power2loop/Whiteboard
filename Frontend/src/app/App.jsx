import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import Rightbar from '../components/Rightbar/Rightbar';
import "./App.css";
import { useState, useRef, useEffect } from 'react';
import socket from '../services/socket/socket';

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
  const canvasAddImageRef = useRef(null);

  // Save function references
  const canvasSaveRef = useRef(null);
  const canvasExportRef = useRef(null);

  // Collaboration states
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);

  // NEW: Image trigger function state
  const [imageTriggerFunc, setImageTriggerFunc] = useState(null);

  // Socket connection management
  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected to server:', socket.id);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    const handleRoomInfo = (data) => {
      console.log('Room info received:', data);
      setRoomUsers(data.users || []);
    };

    const handleUserJoined = (userData) => {
      console.log('User joined:', userData);
      setRoomUsers(prev => [...prev.filter(u => u.id !== userData.userId), userData]);
    };

    const handleUserLeft = (userData) => {
      console.log('User left:', userData);
      setRoomUsers(prev => prev.filter(u => u.id !== userData.userId));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('roomInfo', handleRoomInfo);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('roomInfo', handleRoomInfo);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
    };
  }, []);

  // Auto-join room from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');

    if (roomFromUrl && !roomId) {
      setRoomId(roomFromUrl);
      // Auto-join room
      socket.emit('joinRoom', {
        roomId: roomFromUrl,
        userInfo: {
          userId: socket.id,
          name: `User ${socket.id?.slice(0, 6) || 'Unknown'}`,
          color: selectedColor
        }
      });
    }
  }, [roomId, selectedColor]);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    if (["hand", "select", "image", "eraser"].includes(tool)) {
      setShowToolbar(false);
    } else {
      setShowToolbar(true);
    }
  };

  // NEW: Handle image button click from Topbar
  const handleImageClick = () => {
    if (imageTriggerFunc) {
      imageTriggerFunc(); // Trigger the file input in Canvas
    }
  };

  // NEW: Receive the image trigger function from Canvas
  const handleImageTrigger = (triggerFunction) => {
    setImageTriggerFunc(() => triggerFunction);
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

        // Broadcast clear to room if connected
        if (roomId && isConnected) {
          socket.emit('clearCanvas', { roomId });
        }
      } catch (error) {
        console.error('Failed to clear canvas:', error);
      }
    }
  };

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

  const handleSaveFunctions = (functions) => {
    canvasSaveRef.current = functions.saveCanvas;
    canvasExportRef.current = functions.exportImage;
  };

  const handleResetCanvas = () => {
    handleClearCanvas();
  };

  const handleShowHelp = () => {
    alert('Help: Use the tools to draw, add text, or insert images. Use Ctrl+Z for undo and Ctrl+Y for redo. Click Save to download your work!');
  };

  const handleOpenFile = (fileData) => {
    if (fileData.type === 'canvas') {
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
      <Sidebar
        onOpenFile={handleOpenFile}
        onSaveCanvas={handleSaveCanvas}
        onExportImage={handleExportImage}
        onResetCanvas={handleResetCanvas}
        onShowHelp={handleShowHelp}
      />

      <Topbar
        onToolSelect={handleToolSelect}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
        onImageClick={handleImageClick} // NEW: Pass image click handler
      />

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

      <Canvas
        selectedTool={selectedTool}
        selectedColor={selectedColor}
        strokeWidth={strokeWidth}
        strokeStyle={strokeStyle}
        backgroundColor={backgroundColor}
        opacity={opacity}
        canvasBackgroundColor={canvasBackgroundColor}
        onToolChange={setSelectedTool}
        onUndoFunction={(undoFn) => { undoFunctionRef.current = undoFn; }}
        onRedoFunction={(redoFn) => { redoFunctionRef.current = redoFn; }}
        onCanUndo={setCanUndo}
        onCanRedo={setCanRedo}
        onCopyFunction={(copyFn) => { canvasCopyRef.current = copyFn; }}
        onClearFunction={(clearFn) => { canvasClearRef.current = clearFn; }}
        onLoadCanvasData={(loadFn) => { canvasLoadRef.current = loadFn; }}
        onAddImageToCanvas={(addImageFn) => { canvasAddImageRef.current = addImageFn; }}
        onSaveFunction={handleSaveFunctions}
        onImageTrigger={handleImageTrigger} // NEW: Pass trigger function receiver
        socket={socket}
        roomId={roomId}
        userColor={selectedColor}
      />

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

      <Rightbar
        socket={socket}
        roomId={roomId}
        setRoomId={setRoomId}
      />

      {/* Connection status indicator */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: isConnected ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        {roomId && ` | Room: ${roomId.slice(0, 8)}`}
        {roomUsers.length > 0 && ` | Users: ${roomUsers.length}`}
      </div>
    </div>
  );
}

export default App;
