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

  // Handle mouse move with collaboration
  const handleMouseMoveWithPreview = useCallback((e) => {
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
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            console.log(`Canvas saved as ${filename}`);
            resolve({ filename, size: blob.size });
          } catch (error) {
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

  // Simple text submission
  const handleTextSubmit = () => {
    if (textInput.value.trim()) {
      saveToHistory(shapes);
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
