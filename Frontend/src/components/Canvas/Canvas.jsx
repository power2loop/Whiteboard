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
  onAddImageToCanvas
}) {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const [shapes, setShapes] = useState([]);

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

  const drawing = useCanvasDrawing(
    selectedTool,
    selectedColor,
    strokeWidth,
    strokeStyle,
    backgroundColor,
    opacity
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

  // DECLARE events FIRST - before any callbacks that use it
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
    setShapes,
    setTextInput,
    images.setImageToPlace,
    images.imageToPlace,
    selectedColor,
    strokeWidth,
    opacity,
    images.fileInputRef,
    images.handlePasteFromClipboard,
    images.setLoadedImages,
    cursor
  );

  // Enhanced mouse down handler that includes image placement
  const handleEnhancedMouseDown = useCallback((e) => {
    // First check if we're placing an image
    if (images.handleImagePlacement(e)) {
      return; // Image was placed, don't continue with other mouse handling
    }

    // Otherwise, use normal mouse down handling
    events.handleMouseDown(e);
  }, [images.handleImagePlacement, events]);

  // Handle mouse move with image preview
  const handleMouseMoveWithPreview = useCallback((e) => {
    images.handleMouseMoveWithPreview(e);

    // Continue with normal mouse move handling
    cursor.updateMousePosition(e);
    events.handleCursorMove(e);
  }, [images, cursor, events]);

  // Clear all canvas content function
  const clearAllCanvas = useCallback(() => {
    console.log('Clearing entire canvas');
    console.log('Elements before clear:', shapes.length);

    if (shapes.length > 0) {
      saveToHistory(shapes);
      setShapes([]);

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
  }, [shapes, saveToHistory, drawing, selection, eraser, panning, images]);

  // Expose clear function to parent component
  useEffect(() => {
    if (onClearFunction) {
      onClearFunction(clearAllCanvas);
    }
  }, [clearAllCanvas, onClearFunction]);

  // Load canvas data function
  const loadCanvasData = useCallback((canvasData) => {
    if (canvasData && canvasData.shapes) {
      console.log('Loading canvas data:', canvasData);

      // Save current state to history before loading new data
      if (shapes.length > 0) {
        saveToHistory(shapes);
      }

      // Set the new shapes
      setShapes(canvasData.shapes);

      // Handle images - reload them
      images.loadImagesFromCanvasData(canvasData);

      // Reset other states
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
  }, [shapes, saveToHistory, drawing, selection, eraser, images]);

  // Expose load function to parent component
  useEffect(() => {
    if (onLoadCanvasData) {
      onLoadCanvasData(loadCanvasData);
    }
  }, [loadCanvasData, onLoadCanvasData]);

  // Expose addImage function to parent component
  useEffect(() => {
    if (onAddImageToCanvas) {
      onAddImageToCanvas(images.addImageToCanvas);
    }
  }, [images.addImageToCanvas, onAddImageToCanvas]);

  // Handle ESC key to cancel image preview
  useEffect(() => {
    document.addEventListener('keydown', images.handleEscapeKey);
    return () => document.removeEventListener('keydown', images.handleEscapeKey);
  }, [images.handleEscapeKey]);

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

  // Expose copy function to parent component
  useEffect(() => {
    if (onCopyFunction) {
      onCopyFunction(copyCanvasToClipboard);
    }
  }, [copyCanvasToClipboard, onCopyFunction]);

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

    // Use the renderer hook's redraw function with canvas background color
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
      setShapes(prev => [...prev, {
        tool: "text",
        text: textInput.value,
        x: textInput.x,
        y: textInput.y,
        color: selectedColor,
        fontSize: textInput.fontSize,
        fontFamily: "Arial",
        opacity: opacity / 100
      }]);
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
        onMouseUp={events.handleMouseUp}
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

      {/* Render only eraser and image cursors */}
      {eraserCursor && (
        <div
          className="eraser-cursor-pulse"
          style={eraserCursor.style}
        />
      )}

      {imageCursor && (
        <div
          className="image-placement-cursor"
          style={imageCursor.style}
        />
      )}

      {/* Image preview that follows mouse */}
      {images.imagePreview && (
        <div
          style={{
            position: 'absolute',
            left: images.mousePosition.x + panning.panOffset.x - images.imagePreview.width / 2,
            top: images.mousePosition.y + panning.panOffset.y - images.imagePreview.height / 2,
            width: images.imagePreview.width,
            height: images.imagePreview.height,
            border: '2px dashed #4f46e5',
            borderRadius: '4px',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#4f46e5',
            fontWeight: '500'
          }}
        >
          📷 {images.imagePreview.name}
        </div>
      )}

      {textInput.show && (
        <textarea
          ref={textAreaRef}
          value={textInput.value}
          onChange={handleTextChange}
          onKeyDown={handleTextKeyDown}
          onBlur={handleTextSubmit}
          className="whiteboard-text-input"
          style={{
            position: 'absolute',
            left: textInput.x + panning.panOffset.x,
            top: textInput.y + panning.panOffset.y - 10,
            zIndex: 1000,
            width: '300px',
            minWidth: '200px',
            height: '100px',
            minHeight: '60px',
            fontSize: `${textInput.fontSize}px`,
            fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontWeight: 400,
            lineHeight: 1.4,
            color: selectedColor || '#1a1a1a',
            background: '#ffffff7f',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            outline: 'none',
            padding: '12px 16px',
            resize: 'both',
            transition: 'all 0.005s ease-in-out'
          }}
          placeholder="Enter your text here..."
          aria-label="Text input for whiteboard"
          spellCheck="true"
          autoComplete="off"
          rows={3}
        />
      )}
    </>
  );
}
