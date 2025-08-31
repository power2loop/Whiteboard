import { useRef, useEffect, useState, useCallback } from "react";
import useUndoRedo from './hooks/useUndoRedo';
import useCanvasDrawing from './hooks/useCanvasDrawing';
import useCanvasSelection from './hooks/useCanvasSelection';
import useCanvasEraser from './hooks/useCanvasEraser';
import useCanvasPanning from './hooks/useCanvasPanning';
import useCanvasRenderer from './hooks/useCanvasRenderer';
import useCanvasEvents from './hooks/useCanvasEvents';
import useCursor from './hooks/useCursor';
import useCanvasImages from './hooks/useCanvasImages';
import "./Canvas.css";

const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line", "rectangle"];
const ERASER_RADIUS = 2;

export default function Canvas({
  selectedTool,
  selectedColor = "#000000",
  strokeWidth = 2,
  strokeStyle = "solid",
  backgroundColor = "#ffffff",
  opacity = 100,
  canvasBackgroundColor = "#ffffff",
  onToolChange,
  onUndoFunction,
  onRedoFunction,
  onCanUndo,
  onCanRedo,
  onCopyFunction,
  onClearFunction,
  onLoadCanvasData,
  onAddImageToCanvas,
  onSaveFunction,

  // NEW: Socket.IO props
  socket,
  roomId,
  userColor = "#000000"
  // Collaboration props
  onShapesChange,
  onDrawingStart,
  onDrawingUpdate,
  onDrawingEnd,
  onCanvasClearCollaboration,
  onCursorMove,
  isCollaborating = false

}) {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const [shapes, setShapes] = useState([]);

  const [remoteCursors, setRemoteCursors] = useState(new Map());

  const [isReceivingUpdate, setIsReceivingUpdate] = useState(false);


  // Simple text state
  const [textInput, setTextInput] = useState({
    show: false,
    x: 0,
    y: 0,
    value: "",
    fontSize: 16
  });

  // Use hooks
  const { saveToHistory } = useUndoRedo(
    shapes,
    setShapes,
    onUndoFunction,
    onRedoFunction,
    onCanUndo,
    onCanRedo
  );

  // In Canvas.jsx, update the drawing hook initialization:
const drawing = useCanvasDrawing(
  selectedTool,
  selectedColor,
  strokeWidth,
  strokeStyle,
  backgroundColor,
  opacity,
  // Add collaboration callbacks
  onDrawingStart,
  onDrawingUpdate,
  onDrawingEnd,
  isCollaborating
);


  const selection = useCanvasSelection(shapes);
  const eraser = useCanvasEraser(shapes, setShapes, saveToHistory);
  const panning = useCanvasPanning();
  const renderer = useCanvasRenderer();

  // Use the new image hook
  const images = useCanvasImages(
    shapes,
    setShapes,
    saveToHistory,
    panning,
    opacity,
    canvasRef
  );

  // Add cursor hook
  const cursor = useCursor(selectedTool, panning.panOffset, images.imageToPlace, ERASER_RADIUS);

  // ==================== SOCKET.IO INTEGRATION ====================

  // Socket.IO: Listen for drawing events from other users
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDrawing = (data) => {
      // Don't add our own drawings back
      if (data.userId === socket.id) return;

      // Create shape object from received data
      const newShape = {
        id: data.id || Date.now() + Math.random(),
        tool: data.tool,
        start: data.start,
        end: data.end,
        points: data.points,
        color: data.color,
        strokeWidth: data.strokeWidth,
        opacity: data.opacity,
        text: data.text,
        fontSize: data.fontSize,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        expiration: data.expiration
      };

      setShapes(prevShapes => {
        // For pen/laser tools, update existing shape or add new one
        if (data.tool === 'pen' || data.tool === 'laser') {
          const existingIndex = prevShapes.findIndex(s => s.id === newShape.id);
          if (existingIndex >= 0) {
            const updated = [...prevShapes];
            updated[existingIndex] = newShape;
            return updated;
          }
        }
        return [...prevShapes, newShape];
      });
    };

    const handleRemoteCursor = (data) => {
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(data.userId, {
          name: data.name,
          color: data.color,
          x: data.x,
          y: data.y,
          timestamp: data.timestamp
        });
        return newCursors;
      });

      // Remove cursor after 3 seconds of inactivity
      setTimeout(() => {
        setRemoteCursors(prev => {
          const newCursors = new Map(prev);
          const cursor = newCursors.get(data.userId);
          if (cursor && cursor.timestamp === data.timestamp) {
            newCursors.delete(data.userId);
          }
          return newCursors;
        });
      }, 3000);
    };

    const handleCanvasState = (canvasData) => {
      if (canvasData && canvasData.length > 0) {
        setShapes(canvasData);
      }
    };

    const handleClearCanvas = () => {
      setShapes([]);
      drawing.resetDrawing();
      selection.resetSelection();
      eraser.resetEraser();
      images.resetImageStates();
      setTextInput({
        show: false,
        x: 0,
        y: 0,
        value: "",
        fontSize: 16
      });
    };

    const handleRemoveCursor = (userId) => {
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });
    };

    // Socket event listeners
    socket.on('drawing', handleRemoteDrawing);
    socket.on('cursorMove', handleRemoteCursor);
    socket.on('canvasState', handleCanvasState);
    socket.on('clearCanvas', handleClearCanvas);
    socket.on('removeCursor', handleRemoveCursor);

    return () => {
      socket.off('drawing', handleRemoteDrawing);
      socket.off('cursorMove', handleRemoteCursor);
      socket.off('canvasState', handleCanvasState);
      socket.off('clearCanvas', handleClearCanvas);
      socket.off('removeCursor', handleRemoveCursor);
    };
  }, [socket, drawing, selection, eraser, images]);

  // Socket.IO: Broadcast drawing data
  const broadcastDrawing = useCallback((shapeData) => {
    if (!socket || !roomId) return;

    socket.emit('drawing', {
      ...shapeData,
      roomId,
      userId: socket.id,
      timestamp: Date.now()
    });
  }, [socket, roomId]);

  // Socket.IO: Broadcast cursor movement
  const broadcastCursor = useCallback((x, y) => {
    if (!socket || !roomId) return;

    socket.emit('cursorMove', {
      x,
      y,
      roomId,
      timestamp: Date.now()
    });
  }, [socket, roomId]);

  // ==================== MODIFIED FUNCTIONS ====================
  // Enhanced shapes update function for collaboration
// Replace the updateShapesWithCollaboration function in Canvas.jsx with this:

const updateShapesWithCollaboration = useCallback((newShapes, skipEmit = false) => {
  if (isReceivingUpdate) return;
  
  console.log('🔄 Updating shapes:', newShapes.length, 'skipEmit:', skipEmit);
  setShapes(newShapes);
  
  // Emit to collaborators if this is a local change
  if (isCollaborating && !skipEmit && onShapesChange) {
    console.log('📤 Emitting shapes change to collaborators');
    onShapesChange(newShapes);
  }
}, [isCollaborating, onShapesChange, isReceivingUpdate]);


  // Function to handle incoming collaboration updates
  const handleCollaborationUpdate = useCallback((collaborationShapes) => {
    setIsReceivingUpdate(true);
    setShapes(collaborationShapes);
    setTimeout(() => setIsReceivingUpdate(false), 100);
  }, []);

  // Function to check if a point is inside an element
  const isPointInElement = useCallback((point, shape) => {
    const pointNearLine = (point, start, end, threshold) => {
      const A = point.x - start.x, B = point.y - start.y;
      const C = end.x - start.x, D = end.y - start.y;
      const dot = A * C + B * D, len_sq = C * C + D * D;
      let param = -1;
      if (len_sq !== 0) param = dot / len_sq;
      let xx, yy;
      if (param < 0) { xx = start.x; yy = start.y; }
      else if (param > 1) { xx = end.x; yy = end.y; }
      else { xx = start.x + param * C; yy = start.y + param * D; }
      const dx = point.x - xx, dy = point.y - yy;
      return dx * dx + dy * dy <= threshold * threshold;
    };

    if (shape.tool === "pen" || shape.tool === "laser") {
      const points = shape.points;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (pointNearLine(point, p1, p2, 10)) return true;
      }
      return false;
    } else if (shape.tool === "text") {
      const textWidth = shape.text.length * (shape.fontSize || 16) * 0.6;
      const textHeight = (shape.fontSize || 16) * 1.2;
      return point.x >= shape.x && point.x <= shape.x + textWidth &&
        point.y >= shape.y && point.y <= shape.y + textHeight;
    } else if (shape.tool === "image") {
      return point.x >= shape.x && point.x <= shape.x + shape.width &&
        point.y >= shape.y && point.y <= shape.y + shape.height;
    } else {
      return isPointInShape(shape, point);
    }
  }, []);

  // Enhanced events with collaboration
  const events = useCanvasEvents(
    canvasRef,
    selectedTool,
    shapes,
    drawing,
    selection,
    eraser,
    panning,
    onToolChange,
    isPointInElement,
    saveToHistory,
    updateShapesWithCollaboration, // Use collaboration-aware setter
    setTextInput,
    images.setImageToPlace,
    images.imageToPlace,
    selectedColor,
    strokeWidth,
    opacity,
    images.fileInputRef,
    images.handlePasteFromClipboard,
    images.setLoadedImages,
    cursor,

    broadcastDrawing // Pass broadcast function

    // Collaboration callbacks
    onDrawingStart,
    onDrawingUpdate,
    onDrawingEnd,
    onCursorMove,
    isCollaborating

  );

  // Enhanced mouse down handler with collaboration
  const handleEnhancedMouseDown = useCallback((e) => {
    // First check if we're placing an image
    if (images.handleImagePlacement(e)) {
      return; // Image was placed, don't continue with other mouse handling
    }

    // Emit drawing start for collaboration
    if (isCollaborating && onDrawingStart && drawing.isDrawingTool()) {
      const rect = canvasRef.current.getBoundingClientRect();
      const point = {
        x: e.clientX - rect.left - panning.panOffset.x,
        y: e.clientY - rect.top - panning.panOffset.y
      };
      onDrawingStart({
        tool: selectedTool,
        point,
        color: selectedColor,
        strokeWidth,
        opacity
      });
    }

    // Otherwise, use normal mouse down handling
    events.handleMouseDown(e);
  }, [images.handleImagePlacement, events, isCollaborating, onDrawingStart, drawing, selectedTool, selectedColor, strokeWidth, opacity, panning.panOffset]);

  // Handle mouse move with image preview and cursor broadcasting
  // Handle mouse move with collaboration
  const handleMouseMoveWithPreview = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Broadcast cursor position (throttled)
      if (Date.now() - (handleMouseMoveWithPreview.lastBroadcast || 0) > 50) {
        broadcastCursor(x, y);
        handleMouseMoveWithPreview.lastBroadcast = Date.now();
      }
    }

    images.handleMouseMoveWithPreview(e);
    
    // Emit cursor position for collaboration
    if (isCollaborating && onCursorMove) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - panning.panOffset.x;
      const y = e.clientY - rect.top - panning.panOffset.y;
      onCursorMove(x, y);
    }

    // Continue with normal mouse move handling
    cursor.updateMousePosition(e);
    events.handleCursorMove(e);
  }, [images, cursor, events, broadcastCursor]);

  // Enhanced save canvas to include broadcasting
  }, [images, cursor, events, isCollaborating, onCursorMove, panning.panOffset]);

  // Enhanced mouse up handler with collaboration
  const handleMouseUp = useCallback((e) => {
    // Emit drawing end for collaboration
    if (isCollaborating && onDrawingEnd && drawing.isDrawing) {
      onDrawingEnd({
        tool: selectedTool,
        shapes: shapes
      });
    }

    events.handleMouseUp(e);
  }, [events, isCollaborating, onDrawingEnd, drawing.isDrawing, selectedTool, shapes]);

  // Save canvas as PNG function
  const saveCanvasToPNG = useCallback(async (quality = 0.95) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error('Canvas not available');
    }

    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      tempCtx.fillStyle = canvasBackgroundColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `whiteboard-${timestamp}.png`;

      return new Promise((resolve, reject) => {
        tempCanvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }

          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            console.log(`Canvas saved as ${filename}`);
            resolve({ filename, size: blob.size });
          }catch (error) {
            reject(error);
          }
        }, 'image/png', quality);
      });
    } catch (error) {
      console.error('Save canvas error:', error);
      throw error;
    }
  }, [canvasBackgroundColor]);

  const exportCanvasToPNG = useCallback(async (quality = 1.0) => {
    return await saveCanvasToPNG(quality);
  }, [saveCanvasToPNG]);

  // Enhanced clear function with broadcasting
  // Enhanced clear function with collaboration
  const clearAllCanvas = useCallback(() => {
    console.log('Clearing entire canvas');
    console.log('Elements before clear:', shapes.length);
    
    if (shapes.length > 0) {
      saveToHistory(shapes);
      updateShapesWithCollaboration([]);
      
      // Emit canvas clear for collaboration
      if (isCollaborating && onCanvasClearCollaboration) {
        onCanvasClearCollaboration();
      }
      
      drawing.resetDrawing();
      selection.resetSelection();
      eraser.resetEraser();
      panning.resetPan();
      images.resetImageStates();
      setTextInput({
        show: false,
        x: 0,
        y: 0,
        value: "",
        fontSize: 16
      });

      // Broadcast clear to other users
      if (socket && roomId) {
        socket.emit('clearCanvas', { roomId });
      }

      console.log('Canvas cleared successfully');
    }
  }, [shapes, saveToHistory, drawing, selection, eraser, panning, images, socket, roomId]);

  // Expose clear function to parent component
  useEffect(() => {
    if (onClearFunction) {
      onClearFunction(clearAllCanvas);
    }
  }, [clearAllCanvas, onClearFunction]);

  // Expose save functions to parent component
  useEffect(() => {
    if (onSaveFunction) {
      onSaveFunction({
        saveCanvas: saveCanvasToPNG,
        exportImage: exportCanvasToPNG
      });
    }
  }, [onSaveFunction, saveCanvasToPNG, exportCanvasToPNG]);

  // Load canvas data function
  const loadCanvasData = useCallback((canvasData) => {
    if (canvasData && canvasData.shapes) {
      console.log('Loading canvas data:', canvasData);

      console.log('Canvas cleared successfully');
    }
  }, [shapes, saveToHistory, updateShapesWithCollaboration, isCollaborating, onCanvasClearCollaboration, drawing, selection, eraser, panning, images]);

  // Load canvas data function with collaboration support
  const loadCanvasData = useCallback((canvasData) => {
    if (canvasData && canvasData.shapes) {
      console.log('Loading canvas data:', canvasData);
      
      if (shapes.length > 0) {
        saveToHistory(shapes);
      }

      setShapes(canvasData.shapes);
      images.loadImagesFromCanvasData(canvasData);

      // Use collaboration-aware update, but skip emit since this is incoming data
      handleCollaborationUpdate(canvasData.shapes);
      
      images.loadImagesFromCanvasData(canvasData);

      drawing.resetDrawing();
      selection.resetSelection();
      eraser.resetEraser();
      setTextInput({
        show: false,
        x: 0,
        y: 0,
        value: "",
        fontSize: 16
      });
      images.setImageToPlace(null);
      images.setImagePreview(null);
      images.setMousePosition({ x: 0, y: 0 });
      console.log('Canvas data loaded successfully');
    }
  }, [shapes, saveToHistory, handleCollaborationUpdate, images, drawing, selection, eraser]);

  // Copy canvas to clipboard function
  const copyCanvasToClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error('Canvas not available');
    }

    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.fillStyle = canvasBackgroundColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);

      return new Promise((resolve, reject) => {
        tempCanvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }

          try {
            if (!navigator.clipboard || !navigator.clipboard.write) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'canvas-copy.png';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              resolve();
              return;
            }

            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]);
            resolve();
          } catch (clipboardError) {
            console.error('Clipboard error:', clipboardError);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'canvas-copy.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve();
          }
        }, 'image/png', 0.95);
      });
    } catch (error) {
      console.error('Copy canvas error:', error);
      throw error;
    }
  }, [canvasBackgroundColor]);

  // Expose functions to parent components
  useEffect(() => {
    if (onClearFunction) {
      onClearFunction(clearAllCanvas);
    }
  }, [clearAllCanvas, onClearFunction]);

  useEffect(() => {
    if (onSaveFunction) {
      onSaveFunction({
        saveCanvas: saveCanvasToPNG,
        exportImage: exportCanvasToPNG
      });
    }
  }, [onSaveFunction, saveCanvasToPNG, exportCanvasToPNG]);

  useEffect(() => {
    if (onLoadCanvasData) {
      onLoadCanvasData(loadCanvasData);
    }
  }, [loadCanvasData, onLoadCanvasData]);

  useEffect(() => {
    if (onAddImageToCanvas) {
      onAddImageToCanvas(images.addImageToCanvas);
    }
  }, [images.addImageToCanvas, onAddImageToCanvas]);

  useEffect(() => {
    if (onCopyFunction) {
      onCopyFunction(copyCanvasToClipboard);
    }
  }, [copyCanvasToClipboard, onCopyFunction]);

  useEffect(() => {
    document.addEventListener('keydown', images.handleEscapeKey);
    return () => document.removeEventListener('keydown', images.handleEscapeKey);
  }, [images.handleEscapeKey]);

  // Canvas rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const appEl = document.querySelector(".app");
    if (appEl) {
      canvas.width = appEl.scrollWidth;
      canvas.height = appEl.scrollHeight;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    renderer.redraw(
      canvasRef,
      shapes,
      images.loadedImages,
      panning.panOffset,
      selection.selectedElements,
      selection.selectionBox,
      selection.isSelecting,
      drawing,
      eraser,
      selectedTool,
      selectedColor,
      strokeWidth,
      opacity,
      ERASER_RADIUS,
      canvasBackgroundColor
    );
  }, [shapes, drawing.penPoints, drawing.laserPoints, eraser.eraserPath, eraser.markedIds, drawing.isDrawing, selectedTool, drawing.startPoint, drawing.currentPoint, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity, panning.panOffset, selection.selectedElements, selection.selectionBox, selection.isSelecting, renderer, images.loadedImages, canvasBackgroundColor]);

  // Fade out laser strokes automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setShapes(shapes =>
        shapes
          .map(shape => {
            if (shape.tool === "laser" && shape.expiration) {
              const now = Date.now();
              const timeLeft = shape.expiration - now;
              if (timeLeft <= 0) return null;
              return {
                ...shape,
                opacity: Math.max(0, Math.min(1, timeLeft / 2000)),
              };
            }
            return shape;
          })
          .filter(Boolean)
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Trigger file input when image tool is selected
  useEffect(() => {
    if (selectedTool === "image") {
      images.fileInputRef.current?.click();
    }
  }, [selectedTool, images.fileInputRef]);

  // Enhanced text submission with broadcasting
  const handleTextSubmit = () => {
    if (textInput.value.trim()) {
      saveToHistory(shapes);
      const newTextShape = {
        id: Date.now() + Math.random(),
      const newShape = {
        tool: "text",
        text: textInput.value,
        x: textInput.x,
        y: textInput.y,
        color: selectedColor,
        fontSize: textInput.fontSize,
        fontFamily: "Arial",
        opacity: opacity / 100
      };

      setShapes(prev => [...prev, newTextShape]);

      // Broadcast text to other users
      broadcastDrawing(newTextShape);
      updateShapesWithCollaboration([...shapes, newShape]);
    }

    setTextInput({
      show: false,
      x: 0,
      y: 0,
      value: "",
      fontSize: 16
    });
  };

  const handleTextChange = (e) => {
    setTextInput(prev => ({
      ...prev,
      value: e.target.value
    }));
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTextInput({
        show: false,
        x: 0,
        y: 0,
        value: "",
        fontSize: 16
      });
    }
  };

  function isPointInShape(shape, point) {
    const { start, end, tool } = shape;
    const distance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const pointInRect = (point, start, end) => {
      const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y);
      return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    };
    const pointInDiamond = (point, start, end) => {
      const cx = (start.x + end.x) / 2, cy = (start.y + end.y) / 2;
      const w = Math.abs(end.x - start.x) / 2, h = Math.abs(end.y - start.y) / 2;
      const dx = Math.abs(point.x - cx), dy = Math.abs(point.y - cy);
      if (w === 0 || h === 0) return false;
      return dx / w + dy / h <= 1;
    };
    const pointNearLine = (point, start, end, threshold) => {
      const A = point.x - start.x, B = point.y - start.y;
      const C = end.x - start.x, D = end.y - start.y;
      const dot = A * C + B * D, len_sq = C * C + D * D;
      let param = -1;
      if (len_sq !== 0) param = dot / len_sq;
      let xx, yy;
      if (param < 0) { xx = start.x; yy = start.y; }
      else if (param > 1) { xx = end.x; yy = end.y; }
      else { xx = start.x + param * C; yy = start.y + param * D; }
      const dx = point.x - xx, dy = point.y - yy;
      return dx * dx + dy * dy <= threshold * threshold;
    };

    switch (tool) {
      case "square":
      case "rectangle":
        return pointInRect(point, start, end);
      case "diamond":
        return pointInDiamond(point, start, end);
      case "circle":
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const r = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2) / 2;
        return distance(point, { x: cx, y: cy }) <= r;
      case "line":
      case "arrow":
        return pointNearLine(point, start, end, ERASER_RADIUS);
      default:
        return false;
    }
  }

  // Get cursor render data
  const eraserCursor = cursor.renderEraserCursor();
  const imageCursor = cursor.renderImagePlacementCursor();

  return (
    <>
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          cursor.cursorRef.current = el;
        }}
        className="drawing-canvas"
        onMouseDown={handleEnhancedMouseDown}
        onMouseMove={handleMouseMoveWithPreview}
        onMouseUp={handleMouseUp}
        onMouseEnter={cursor.handleMouseEnter}
        onMouseLeave={(e) => {
          cursor.handleMouseLeave();
          events.handleMouseUp(e);
        }}
        tabIndex={0}
        aria-label="whiteboard-canvas"
        style={{
          cursor: images.imagePreview ? 'none' : cursor.getCursorStyle(),
          backgroundColor: canvasBackgroundColor
        }}
      />

      <input
        ref={images.fileInputRef}
        type="file"
        accept="image/*"
        onChange={images.handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Render remote cursors */}
      {Array.from(remoteCursors.entries()).map(([userId, cursor]) => (
        <div
          key={userId}
          className="remote-cursor"
          style={{
            position: 'absolute',
            left: cursor.x + panning.panOffset.x,
            top: cursor.y + panning.panOffset.y,
            pointerEvents: 'none',
            zIndex: 1001,
            transition: 'all 0.1s ease-out'
          }}
        >
          <div
            className="cursor-pointer"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              backgroundColor: cursor.color,
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
          <div
            className="cursor-label"
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: cursor.color,
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              maxWidth: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}

      {/* Render only eraser and image cursors */}
      {/* Render custom cursors */}
      {eraserCursor && (
        <div
          style={eraserCursor.style}
          className="custom-cursor eraser-cursor"
        />
      )}

      {imageCursor && (
        <div
          style={imageCursor.style}
          className="custom-cursor image-cursor"
        />
      )}

      {/* Image preview that follows mouse */}
      {images.imagePreview && (
        <div
          className="image-preview"
          style={{
            position: 'absolute',
            left: images.mousePosition.x,
            top: images.mousePosition.y,
            width: images.imagePreview.width,
            height: images.imagePreview.height,
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#3b82f6'
          }}
        >
          📷 {images.imagePreview.name}
        </div>
      )}

      {/* Text input */}
      {textInput.show && (
        <textarea
          ref={textAreaRef}
          className="whiteboard-text-input"
          style={{
            position: 'absolute',
            left: textInput.x + panning.panOffset.x,
            top: textInput.y + panning.panOffset.y,
            fontSize: `${textInput.fontSize}px`,
            fontFamily: 'Arial',
            color: selectedColor,
            background: 'transparent',
            border: '1px dashed #ccc',
            outline: 'none',
            resize: 'none',
            padding: '2px',
            minWidth: '100px',
            minHeight: '20px',
            zIndex: 1000
          }}
          value={textInput.value}
          onChange={handleTextChange}
          onKeyDown={handleTextKeyDown}
          onBlur={handleTextSubmit}
          placeholder="Type here..."
          autoFocus
        />
      )}

      {/* Hidden file input for images */}
      <input
        ref={images.fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={images.handleFileSelect}
      />
    </>
  );
}
