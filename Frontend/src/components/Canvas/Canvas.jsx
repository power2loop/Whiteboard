//Canvas.jsx
import { useRef, useEffect, useState, useCallback } from "react";
import "./Canvas.css";

const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line", "rectangle"];
const ERASER_RADIUS = 2;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SENSITIVITY = 0.001;

export default function Canvas({
  selectedTool,
  selectedColor = "#000000",
  strokeWidth = 2,
  strokeStyle = "solid",
  backgroundColor = "#ffffff",
  opacity = 100,
  onToolChange,
  // New props for zoom and undo/redo
  zoom,
  onZoomChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  const [penPoints, setPenPoints] = useState([]);
  const [laserPoints, setLaserPoints] = useState([]);
  const [eraserPath, setEraserPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [markedIds, setMarkedIds] = useState([]);
  const [loadedImages, setLoadedImages] = useState(new Map());
  
  // Zoom and pan states
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // History management for undo/redo
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

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

  // Save state to history for undo/redo
  const saveToHistory = useCallback(() => {
    setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(shapes))]);
    setRedoHistory([]); // Clear redo history when new action is performed
  }, [shapes]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (undoHistory.length === 0) return;
    
    const previousState = undoHistory[undoHistory.length - 1];
    setRedoHistory(prev => [...prev, JSON.parse(JSON.stringify(shapes))]);
    setShapes(previousState);
    setUndoHistory(prev => prev.slice(0, -1));
  }, [undoHistory, shapes]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (redoHistory.length === 0) return;
    
    const nextState = redoHistory[redoHistory.length - 1];
    setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(shapes))]);
    setShapes(nextState);
    setRedoHistory(prev => prev.slice(0, -1));
  }, [redoHistory, shapes]);

  // Expose undo/redo functions to parent component
  useEffect(() => {
    if (onUndo) onUndo(handleUndo);
    if (onRedo) onRedo(handleRedo);
  }, [handleUndo, handleRedo, onUndo, onRedo]);

  // Provide undo/redo availability to parent
  useEffect(() => {
    if (canUndo) canUndo(undoHistory.length > 0);
    if (canRedo) canRedo(redoHistory.length > 0);
  }, [undoHistory.length, redoHistory.length, canUndo, canRedo]);

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
    redraw();
  }, [shapes, penPoints, laserPoints, eraserPath, markedIds, isDrawing, selectedTool, startPoint, currentPoint, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity, zoom, panOffset]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (selectedTool === "pen") {
      canvas.style.cursor ="url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"><path d=\"M15.4998 5.49994L18.3282 8.32837M3 20.9997L3.04745 20.6675C3.21536 19.4922 3.29932 18.9045 3.49029 18.3558C3.65975 17.8689 3.89124 17.4059 4.17906 16.9783C4.50341 16.4963 4.92319 16.0765 5.76274 15.237L17.4107 3.58896C18.1918 2.80791 19.4581 2.80791 20.2392 3.58896C21.0202 4.37001 21.0202 5.63634 20.2392 6.41739L8.37744 18.2791C7.61579 19.0408 7.23497 19.4216 6.8012 19.7244C6.41618 19.9932 6.00093 20.2159 5.56398 20.3879C5.07171 20.5817 4.54375 20.6882 3.48793 20.9012L3 20.9997Z\"/></svg>') 0 20, auto";
    } else if (selectedTool === "eraser") {
      canvas.style.cursor ="url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"/></svg>') 8 8, auto";
    } else if (selectedTool === "laser") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" width=\"24\" height=\"24\" viewBox=\"0 0 6.827 6.827\" style=\"shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd\"><defs><style>.fil3{fill:%23414141;fill-rule:nonzero}</style></defs><g id=\"Layer_x0020_1\"><path d=\"m2.897 3.462-.5-.549.079-.071-.08.071a.107.107 0 0 1 .016-.157l.309-.28.071.08-.071-.08a.107.107 0 0 1 .157.016l.503.557-.482.412-.002.001z\" style=\"fill:%23959595;fill-rule:nonzero\"/><path d=\"m4.625 5.377-1.73-1.913.002-.002.484-.413L5.1 4.948l-.474.43z\" style=\"fill:%23676767;fill-rule:nonzero\"/><path d=\"m5.575 5.648-.31.279-.07-.079.07.08a.107.107 0 0 1-.156-.016l-.484-.535.474-.43.49.544-.078.071.079-.071a.107.107 0 0 1-.015.157z\" style=\"fill:%232f2f2f;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M3.27 1.342a.807.807 0 0 1-.295.293.808.808 0 0 1 .294.293.808.808 0 0 1 .294-.293.808.808 0 0 1-.294-.293z\"/><path d=\"M3.27 2.358c-.105-.352-.464-.708-.693-.708.357-.137.575-.429.692-.778.117.35.335.64.692.778-.229 0-.587.356-.692.708z\" style=\"fill:%23bcbcbc;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.788 1.858a.582.582 0 0 1-.212.21.582.582 0 0 1 .212.212A.582.582 0 0 1 2 2.069a.582.582 0 0 1-.212-.211z\"/><path d=\"M1.788 2.59c-.076-.254-.334-.51-.499-.51.257-.1.414-.31.499-.561.084.252.241.462.498.56-.165 0-.423.257-.498.51z\" style=\"fill:%23a0a0a0;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.555 3.314a.404.404 0 0 1-.147.146.404.404 0 0 1 .147.147.404.404 0 0 1 .147-.147.404.404 0 0 1-.147-.146z\"/><path d=\"M1.555 3.822c-.052-.176-.231-.355-.346-.355a.594.594 0 0 0 .346-.389c.059.175.168.321.346.39-.114 0-.293.178-.346.354z\" style=\"fill:%23868686;fill-rule:nonzero\"/></g><path style=\"fill:none\" d=\"M0 0h6.827v6.827H0z\"/></svg>') 3 3, auto";
    } else if (selectedTool === "text") {
      canvas.style.cursor = "text";
    } else if (selectedTool === "hand") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z\"/></svg>') 10 10, auto";
    } else {
      canvas.style.cursor = "crosshair";
    }
  }, [selectedTool]);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate zoom
    const delta = e.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * zoomFactor));
    
    // Calculate new pan offset to zoom towards mouse position
    const zoomPointX = (mouseX - panOffset.x) / zoom;
    const zoomPointY = (mouseY - panOffset.y) / zoom;
    
    const newPanX = mouseX - zoomPointX * newZoom;
    const newPanY = mouseY - zoomPointY * newZoom;
    
    onZoomChange?.(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [zoom, panOffset, onZoomChange]);

  // Add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  function getRelativeCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;
    return { x, y };
  }

  function interpolatePoints(p1, p2, spacing = 2) {
    const points = [];
    const dist = distance(p1, p2);
    const steps = Math.floor(dist / spacing);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      points.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      });
    }
    return points;
  }

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
    if (onToolChange) {
      onToolChange("select");
    }
  };

  const handleMouseDown = (e) => {
    const point = getRelativeCoords(e);
    
    // Handle panning with hand tool
    if (selectedTool === "hand") {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Handle image placement
    if (imageToPlace) {
      saveToHistory(); // Save state before adding image
      
      const imageId = `img_${Date.now()}_${Math.random()}`;
      
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Map(prev.set(imageId, img)));
      };
      img.src = imageToPlace.src;
      
      setShapes(prev => [...prev, {
        tool: "image",
        id: imageId,
        x: point.x,
        y: point.y,
        width: imageToPlace.width,
        height: imageToPlace.height,
        src: imageToPlace.src,
        opacity: opacity / 100
      }]);
      
      setImageToPlace(null);
      return;
    }
    
    if (selectedTool === "text") {
      const fontSize = Math.max(strokeWidth * 8, 16);
      
      setTextInput({
        show: true,
        x: point.x,
        y: point.y,
        value: "",
        fontSize: fontSize
      });
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }, 10);
      return;
    }

    if (selectedTool === "pen") {
      saveToHistory(); // Save state before drawing
      setPenPoints([point]);
      setIsDrawing(true);
    } else if (selectedTool === "eraser") {
      setEraserPath([point]);
      setMarkedIds([]);
      setIsDrawing(true);
    } else if (selectedTool === "laser") {
      setPenPoints([point]);
      setIsDrawing(true);
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      saveToHistory(); // Save state before drawing shape
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
    }
  };

  const handleMouseMove = (e) => {
    // Handle panning
    if (isPanning && selectedTool === "hand") {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (!isDrawing) return;
    const point = getRelativeCoords(e);

    if (selectedTool === "pen") {
      setPenPoints(ps => [...ps, point]);
    } else if (selectedTool === "laser") {
      setLaserPoints(ls => [...ls, point]);
    } else if (selectedTool === "eraser") {
      setEraserPath(p => {
        if (p.length === 0) return [point];
        const lastPoint = p[p.length - 1];
        const newPoints = interpolatePoints(lastPoint, point);
        return [...p, ...newPoints, point];
      });
      const eraserPointsForCheck = [...eraserPath, point];
      setMarkedIds(
        shapes
          .map((shape, idx) => ({ shape, idx }))
          .filter(({ shape }) => shapeIntersectsEraser(shape, eraserPointsForCheck))
          .map(({ idx }) => idx)
      );
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      setCurrentPoint(point);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDrawing(false);

    if (selectedTool === "pen" && penPoints.length > 0) {
      setShapes(prev => [...prev, {
        tool: "pen",
        points: penPoints,
        color: selectedColor,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100
      }]);
      setPenPoints([]);
    } else if (selectedTool === "laser" && laserPoints.length > 1) {
      setShapes(prev => [...prev, {
        tool: "laser",
        points: laserPoints,
        opacity: opacity / 100,
        expiration: Date.now() + 2000,
        color: selectedColor,
        strokeWidth,
        strokeStyle
      }]);
      setLaserPoints([]);
    } else if (selectedTool === "eraser" && eraserPath.length > 0) {
      if (markedIds.length > 0) {
        saveToHistory(); // Save state before erasing
        setShapes(shapes.filter((_, i) => !markedIds.includes(i)));
      }
      setMarkedIds([]);
      setEraserPath([]);
    } else if (SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      setShapes(prev => [...prev, {
        tool: selectedTool,
        start: startPoint,
        end: currentPoint,
        color: selectedColor,
        backgroundColor: backgroundColor !== "#ffffff" ? backgroundColor : null,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100
      }]);
    }
    setStartPoint(null);
    setCurrentPoint(null);
  };

  // Simple text submission
  const handleTextSubmit = () => {
    if (textInput.value.trim()) {
      saveToHistory(); // Save state before adding text
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

  function applyStrokeStyle(ctx, sStyle) {
    switch (sStyle) {
      case 'dashed':
        ctx.setLineDash([8, 4]);
        break;
      case 'dotted':
        ctx.setLineDash([2, 4]);
        break;
      case 'wavy':
        ctx.setLineDash([6, 3, 2, 3]);
        break;
      default:
        ctx.setLineDash([]);
    }
  }

    function drawShape(ctx, start, end, tool, isPreview = false, faded = false, shape = {}) {
    const color = shape.color || selectedColor;
    const bgColor = shape.backgroundColor;
    const sWidth = shape.strokeWidth || strokeWidth;
    const sStyle = shape.strokeStyle || strokeStyle;
    const sOpacity = shape.opacity !== undefined ? shape.opacity : (opacity / 100);

    ctx.save();
    ctx.globalAlpha = faded ? 0.35 : sOpacity;
    applyStrokeStyle(ctx, sStyle);
    ctx.beginPath();
    switch (tool) {
      case "square":
        const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        ctx.rect(start.x, start.y, size * Math.sign(end.x - start.x), size * Math.sign(end.y - start.y));
        break;
      case "rectangle":
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        break;
      case "diamond":
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const w = Math.abs(end.x - start.x) / 2;
        const h = Math.abs(end.y - start.y) / 2;
        ctx.moveTo(cx, cy - h);
        ctx.lineTo(cx + w, cy);
        ctx.lineTo(cx, cy + h);
        ctx.lineTo(cx - w, cy);
        ctx.closePath();
        break;
      case "circle":
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        break;
      case "arrow":
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        drawArrowHead(ctx, start, end, 16);
        break;
      case "line":
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        break;
      default:
        break;
    }
    if (bgColor && bgColor !== "#ffffff") {
      ctx.fillStyle = bgColor;
      ctx.fill();
    }
    ctx.strokeStyle = isPreview ? selectedColor : color;
    ctx.lineWidth = isPreview ? strokeWidth : sWidth;
    ctx.stroke();
    ctx.restore();
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformations
    ctx.save();
    ctx.setTransform(zoom, 0, 0, zoom, panOffset.x, panOffset.y);

    shapes.forEach((shape, idx) => {
      const fade = markedIds.includes(idx);
      if (shape.tool === "pen") {
        drawPenStroke(ctx, shape.points, false, fade, shape);
      } else if (shape.tool === "laser") {
        drawLaserStroke(ctx, shape.points, shape.opacity, shape);
      } else if (shape.tool === "text") {
        drawText(ctx, shape, fade);
      } else if (shape.tool === "image") {
        drawImage(ctx, shape, fade);
      } else {
        drawShape(ctx, shape.start, shape.end, shape.tool, false, fade, shape);
      }
    });

    if (isDrawing && selectedTool === "pen" && penPoints.length) {
      drawPenStroke(ctx, penPoints, true, false, { color: selectedColor, strokeWidth, strokeStyle, opacity: opacity / 100 });
    }
    if (isDrawing && selectedTool === "laser" && laserPoints.length) {
      drawLaserStroke(ctx, laserPoints, opacity / 100, { color: selectedColor, strokeWidth, strokeStyle });
    }
    if (isDrawing && SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      drawShape(ctx, startPoint, currentPoint, selectedTool, true, false, {
        color: selectedColor,
        backgroundColor: backgroundColor !== "#ffffff" ? backgroundColor : null,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100
      });
    }
    if (selectedTool === "eraser" && eraserPath.length > 0) {
      drawEraserPath(ctx, eraserPath);
    }
    
    ctx.restore();
  }

  // ... [Keep all your existing drawing functions unchanged - drawImage, drawText, drawPenStroke, etc.]
  // ... [All the existing helper functions remain exactly the same]

  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const handleCursorMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
    handleMouseMove(e);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleCursorMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        tabIndex={0}
        aria-label="whiteboard-canvas"
        style={{ cursor: imageToPlace ? 'crosshair' : 'default' }}
      />
      
      {/* Hidden file input for image selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {selectedTool === "eraser" && (
        <div
          className="eraser-cursor-pulse"
          style={{ left: mousePos.x, top: mousePos.y, width: ERASER_RADIUS * 2, height: ERASER_RADIUS * 2 }}
        />
      )}
      
      {imageToPlace && (
        <div
          className="image-placement-cursor"
          style={{
            position: 'absolute',
            left: mousePos.x,
            top: mousePos.y,
            width: imageToPlace.width * zoom,
            height: imageToPlace.height * zoom,
            border: '2px dashed #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)'
          }}
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
            left: (textInput.x * zoom) + panOffset.x,
            top: (textInput.y * zoom) + panOffset.y - 10,
            zIndex: 1000,
            width: '300px',
            minWidth: '200px',
            height: '100px',
            minHeight: '60px',
            fontSize: `${textInput.fontSize * zoom}px`,
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
            transition: 'all 0.005s ease-in-out',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
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

// [Include all the existing helper functions here - they remain unchanged]
