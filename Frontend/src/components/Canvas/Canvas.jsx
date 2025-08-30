import { useRef, useEffect, useState, useCallback } from "react";
import useUndoRedo from './hooks/useUndoRedo';
import useCanvasDrawing from './hooks/useCanvasDrawing';
import useCanvasSelection from './hooks/useCanvasSelection';
import useCanvasEraser from './hooks/useCanvasEraser';
import useCanvasPanning from './hooks/useCanvasPanning';
import useCanvasRenderer from './hooks/useCanvasRenderer';
import useCanvasEvents from './hooks/useCanvasEvents';
import useCursor from './hooks/useCursor';
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
  onClearFunction
}) {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  const [loadedImages, setLoadedImages] = useState(new Map());

  // Simple text state
  const [textInput, setTextInput] = useState({
    show: false,
    x: 0,
    y: 0,
    value: "",
    fontSize: 16
  });

  // Image placement state
  const [imageToPlace, setImageToPlace] = useState(null);

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

  // Add cursor hook
  const cursor = useCursor(selectedTool, panning.panOffset, imageToPlace, ERASER_RADIUS);

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

  // Handle paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        console.log('Clipboard API not supported');
        return;
      }

      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const reader = new FileReader();

            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const maxSize = 300;
                let width = img.naturalWidth;
                let height = img.naturalHeight;

                if (width > maxSize || height > maxSize) {
                  const ratio = Math.min(maxSize / width, maxSize / height);
                  width = width * ratio;
                  height = height * ratio;
                }

                const canvas = canvasRef.current;
                if (canvas) {
                  const centerX = (canvas.width / 2 - panning.panOffset.x);
                  const centerY = (canvas.height / 2 - panning.panOffset.y);

                  saveToHistory(shapes);

                  const imageId = `img_${Date.now()}_${Math.random()}`;

                  const newImg = new Image();
                  newImg.onload = () => {
                    setLoadedImages(prev => new Map(prev.set(imageId, newImg)));
                  };
                  newImg.src = event.target.result;

                  setShapes(prev => [...prev, {
                    tool: "image",
                    id: imageId,
                    x: centerX - width / 2,
                    y: centerY - height / 2,
                    width,
                    height,
                    src: event.target.result,
                    opacity: opacity / 100
                  }]);
                }
              };
              img.src = event.target.result;
            };

            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error pasting from clipboard:', error);
    }
  };

// Canvas.jsx - Add this check in your mouse event handlers
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
  setImageToPlace,
  imageToPlace,
  selectedColor,
  strokeWidth,
  opacity,
  fileInputRef,
  handlePasteFromClipboard,
  setLoadedImages,
  cursor
);


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
      setLoadedImages(new Map());

      setTextInput({
        show: false,
        x: 0,
        y: 0,
        value: "",
        fontSize: 16
      });

      setImageToPlace(null);
      console.log('Canvas cleared successfully');
    }
  }, [shapes, saveToHistory, drawing, selection, eraser, panning]);

  // Expose clear function to parent component
  useEffect(() => {
    if (onClearFunction) {
      onClearFunction(clearAllCanvas);
    }
  }, [clearAllCanvas, onClearFunction]);

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
      loadedImages,
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
  }, [shapes, drawing.penPoints, drawing.laserPoints, eraser.eraserPath, eraser.markedIds, drawing.isDrawing, selectedTool, drawing.startPoint, drawing.currentPoint, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity, panning.panOffset, selection.selectedElements, selection.selectionBox, selection.isSelecting, renderer, loadedImages, canvasBackgroundColor]);

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
      fileInputRef.current?.click();
    }
  }, [selectedTool]);

  // Handle file selection for images
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 300;
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = width * ratio;
            height = height * ratio;
          }

          setImageToPlace({
            src: event.target.result,
            width,
            height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

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
    const distance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const CLICK_THRESHOLD = 10;

    const pointInRect = (point, start, end) => {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        return point.x >= minX - CLICK_THRESHOLD && 
               point.x <= maxX + CLICK_THRESHOLD && 
               point.y >= minY - CLICK_THRESHOLD && 
               point.y <= maxY + CLICK_THRESHOLD;
    };

    const pointInSquare = (point, start, end) => {
        // Calculate actual square dimensions
        const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        const squareWidth = size * Math.sign(end.x - start.x);
        const squareHeight = size * Math.sign(end.y - start.y);
        
        // Calculate actual square bounds
        const squareEnd = {
            x: start.x + squareWidth,
            y: start.y + squareHeight
        };
        
        return pointInRect(point, start, squareEnd);
    };

    const pointNearRectBorder = (point, start, end, threshold) => {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        const nearLeft = Math.abs(point.x - minX) <= threshold && point.y >= minY - threshold && point.y <= maxY + threshold;
        const nearRight = Math.abs(point.x - maxX) <= threshold && point.y >= minY - threshold && point.y <= maxY + threshold;
        const nearTop = Math.abs(point.y - minY) <= threshold && point.x >= minX - threshold && point.x <= maxX + threshold;
        const nearBottom = Math.abs(point.y - maxY) <= threshold && point.x >= minX - threshold && point.x <= maxX + threshold;

        return nearLeft || nearRight || nearTop || nearBottom;
    };

    const pointInDiamond = (point, start, end) => {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const w = Math.abs(end.x - start.x) / 2;
        const h = Math.abs(end.y - start.y) / 2;
        
        if (w === 0 || h === 0) return false;
        
        const dx = Math.abs(point.x - cx);
        const dy = Math.abs(point.y - cy);
        return (dx / w + dy / h) <= 1.2;
    };

    const pointNearLine = (point, start, end, threshold) => {
        const A = point.x - start.x;
        const B = point.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        
        if (len_sq === 0) {
            return distance(point, start) <= threshold;
        }
        
        let param = dot / len_sq;
        param = Math.max(0, Math.min(1, param));
        
        const xx = start.x + param * C;
        const yy = start.y + param * D;
        const dx = point.x - xx;
        const dy = point.y - yy;
        
        return (dx * dx + dy * dy) <= (threshold * threshold);
    };

    const { start, end, tool } = shape;

    switch (tool) {
        case "square":
            // Use special square hit detection
            return pointInSquare(point, start, end);
        case "rectangle":
            return pointInRect(point, start, end) || pointNearRectBorder(point, start, end, CLICK_THRESHOLD);
        case "diamond":
            return pointInDiamond(point, start, end);
        case "circle":
            const cx = (start.x + end.x) / 2;
            const cy = (start.y + end.y) / 2;
            const r = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2) / 2;
            const distToCenter = distance(point, { x: cx, y: cy });
            return Math.abs(distToCenter - r) <= CLICK_THRESHOLD || distToCenter <= r;
        case "line":
        case "arrow":
            return pointNearLine(point, start, end, CLICK_THRESHOLD);
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
        onMouseDown={events.handleMouseDown}
        onMouseMove={(e) => {
          cursor.updateMousePosition(e);
          events.handleCursorMove(e);
        }}
        onMouseUp={events.handleMouseUp}
        onMouseEnter={cursor.handleMouseEnter}
        onMouseLeave={(e) => {
          cursor.handleMouseLeave();
          events.handleMouseUp(e);
        }}
        tabIndex={0}
        aria-label="whiteboard-canvas"
        style={{
          cursor: cursor.getCursorStyle(),
          backgroundColor: canvasBackgroundColor
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Render only eraser and image cursors - crosshair cursor removed */}
      {imageCursor && (
        <div
          className="image-placement-cursor"
          style={imageCursor.style}
        />
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
