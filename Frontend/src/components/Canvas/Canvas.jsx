import { useRef, useEffect, useState, useCallback, useMemo } from "react";
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

// Custom throttle function
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

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
  socket,
  roomId,
  userColor = "#000000",
  onImageTrigger // This prop exposes file input trigger
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const currentStrokeIdRef = useRef(null);
  const lastBroadcastTime = useRef(0);
  const lastCursorBroadcast = useRef(0);

  // File input ref for images
  const fileInputRef = useRef(null);

  const [shapes, setShapes] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState(new Map());

  // Image preview state
  const [imagePreview, setImagePreview] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Performance-critical state
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
  const images = useCanvasImages(shapes, setShapes, saveToHistory, panning, opacity, canvasRef);
  const cursor = useCursor(selectedTool, panning.panOffset, imagePreview || images.imageToPlace, ERASER_RADIUS);

  // ==================== DECLARE BROADCAST FUNCTIONS FIRST ====================

  // Immediate broadcast for completed shapes - DECLARED EARLY
  const broadcastDrawingImmediate = useCallback((shapeData) => {
    if (!socket || !roomId) return;

    socket.emit('drawing', {
      ...shapeData,
      roomId,
      userId: socket.id,
      timestamp: Date.now()
    });
  }, [socket, roomId]);

  // Throttled pen stroke broadcasting
  const broadcastPenStroke = useCallback((points, strokeId) => {
    if (!socket || !roomId) return;

    const now = Date.now();
    if (now - lastBroadcastTime.current < 16) return; // ~60fps max

    lastBroadcastTime.current = now;

    socket.emit('penStroke', {
      id: strokeId,
      points: points,
      tool: 'pen',
      color: selectedColor,
      strokeWidth,
      opacity: opacity / 100,
      roomId,
      userId: socket.id,
      timestamp: now
    });
  }, [socket, roomId, selectedColor, strokeWidth, opacity]);

  // Ultra-throttled cursor broadcasting
  const broadcastCursor = useCallback((x, y) => {
    if (!socket || !roomId) return;

    const now = Date.now();
    if (now - lastCursorBroadcast.current < 50) return; // 20fps max

    lastCursorBroadcast.current = now;

    socket.emit('cursorMove', {
      x, y, roomId,
      timestamp: now
    });
  }, [socket, roomId]);

  // ==================== IMAGE HANDLING FUNCTIONS ====================

  // Handle file selection for images
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 400;
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          // Resize if too large
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = width * ratio;
            height = height * ratio;
          }

          // Set image preview for placement
          setImagePreview({
            src: event.target.result,
            width,
            height,
            name: file.name
          });

          console.log(`Image "${file.name}" loaded. Click on canvas to place it.`);
        };
        img.onerror = () => {
          console.error('Failed to load image:', file.name);
          alert('Failed to load the selected image.');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    e.target.value = '';
  }, []);

  // Handle image placement on canvas
  const handleImagePlacement = useCallback((e) => {
    if (!imagePreview) return false;

    const canvas = canvasRef.current;
    if (!canvas) return false;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - panning.panOffset.x;
    const y = e.clientY - rect.top - panning.panOffset.y;

    // Place the image at clicked position
    saveToHistory(shapes);
    const imageId = `img_${Date.now()}_${Math.random()}`;

    // Create image element and add to loaded images
    const newImg = new Image();
    newImg.onload = () => {
      images.setLoadedImages(prev => new Map(prev.set(imageId, newImg)));
    };
    newImg.src = imagePreview.src;

    // Add image shape to canvas
    const newImageShape = {
      id: imageId,
      tool: "image",
      x: x - imagePreview.width / 2, // Center on click point
      y: y - imagePreview.height / 2,
      width: imagePreview.width,
      height: imagePreview.height,
      src: imagePreview.src,
      opacity: opacity / 100,
      name: imagePreview.name
    };

    setShapes(prev => [...prev, newImageShape]);
    broadcastDrawingImmediate(newImageShape);

    console.log(`Image "${imagePreview.name}" placed at position (${Math.round(x)}, ${Math.round(y)})`);

    // Clear preview after placing
    setImagePreview(null);
    setMousePosition({ x: 0, y: 0 });

    return true;
  }, [imagePreview, shapes, saveToHistory, panning.panOffset, opacity, images, broadcastDrawingImmediate]);

  // Handle mouse move for image preview
  const handleMouseMoveWithPreview = useCallback((e) => {
    if (imagePreview) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - panning.panOffset.x;
        const y = e.clientY - rect.top - panning.panOffset.y;
        setMousePosition({ x, y });
      }
    }
  }, [imagePreview, panning.panOffset]);

  // Handle ESC key to cancel image preview
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape' && imagePreview) {
      setImagePreview(null);
      setMousePosition({ x: 0, y: 0 });
      console.log('Image preview cancelled');
    }
  }, [imagePreview]);

  // ==================== ULTRA-FAST DRAWING SYSTEM ====================

  const drawDirectlyOnCanvas = useCallback((point, isEnd = false) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || selectedTool !== 'pen') return;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity / 100;

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x + panning.panOffset.x, lastPointRef.current.y + panning.panOffset.y);
      ctx.lineTo(point.x + panning.panOffset.x, point.y + panning.panOffset.y);
      ctx.stroke();
    }

    lastPointRef.current = point;
    ctx.restore();

    // Add point to current drawing
    drawing.setPenPoints(prev => [...prev, point]);

    if (isEnd) {
      // Finalize the stroke
      const newShape = {
        id: currentStrokeIdRef.current,
        tool: 'pen',
        points: [...drawing.penPoints, point],
        color: selectedColor,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100
      };

      setShapes(prev => [...prev, newShape]);
      broadcastDrawingImmediate(newShape);

      // Reset drawing state
      drawing.setPenPoints([]);
      lastPointRef.current = null;
      currentStrokeIdRef.current = null;
    }
  }, [selectedTool, selectedColor, strokeWidth, opacity, drawing, panning.panOffset, broadcastDrawingImmediate]);

  // ==================== EVENT HANDLERS ====================

  const handleMouseDown = useCallback((e) => {
    if (!canvasRef.current) return;

    // FIRST: Check if we're placing an image
    if (handleImagePlacement(e)) {
      return; // Image was placed, don't continue with other mouse handling
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left - panning.panOffset.x,
      y: e.clientY - rect.top - panning.panOffset.y
    };

    isDrawingRef.current = true;

    if (selectedTool === 'pen') {
      currentStrokeIdRef.current = Date.now() + Math.random();
      drawing.startDrawing(point);
      drawDirectlyOnCanvas(point);
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      drawing.startDrawing(point);
    } else if (selectedTool === 'text') {
      setTextInput({
        show: true,
        x: point.x,
        y: point.y,
        value: "",
        fontSize: Math.max(strokeWidth * 8, 16)
      });
    } else if (selectedTool === 'image') {
      // Remove this line - the toolbar will handle triggering the file input
      // fileInputRef.current?.click();
      return; // Don't set isDrawing for image tool
    } else if (selectedTool === 'eraser') {
      eraser.startErasing(point);
    } else if (selectedTool === 'hand') {
      // Handle selection logic here
      let clickedElementIndex = -1;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInElement(point, shapes[i])) {
          clickedElementIndex = i;
          break;
        }
      }

      if (clickedElementIndex !== -1) {
        if (!selection.isElementSelected(clickedElementIndex)) {
          selection.selectElement(clickedElementIndex, e.ctrlKey || e.metaKey);
        }
      } else {
        if (!e.ctrlKey && !e.metaKey) {
          selection.clearSelection();
        }
        selection.startSelection(point);
      }
    }
  }, [selectedTool, panning.panOffset, drawing, strokeWidth, drawDirectlyOnCanvas, eraser, shapes, selection, handleImagePlacement]);

  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = {
      x: x - panning.panOffset.x,
      y: y - panning.panOffset.y
    };

    // Handle image preview
    handleMouseMoveWithPreview(e);

    // Broadcast cursor (throttled)
    broadcastCursor(x, y);

    if (isDrawingRef.current) {
      if (selectedTool === 'pen') {
        // Direct canvas drawing for immediate response
        drawDirectlyOnCanvas(point);

        // Broadcast pen stroke (throttled)
        if (drawing.penPoints.length > 0) {
          broadcastPenStroke([...drawing.penPoints, point], currentStrokeIdRef.current);
        }
      } else if (SHAPE_TOOLS.includes(selectedTool)) {
        drawing.updateDrawing(point);
        requestAnimationFrame(redrawCanvas);
      } else if (selectedTool === 'eraser') {
        eraser.updateErasing(point, interpolatePoints, shapeIntersectsEraser);
        requestAnimationFrame(redrawCanvas);
      } else if (selectedTool === 'hand' && selection.isSelecting) {
        selection.updateSelection(point, selection.selectionStartPoint);
        requestAnimationFrame(redrawCanvas);
      }
    }

    cursor.updateMousePosition(e);
  }, [selectedTool, panning.panOffset, drawing, broadcastCursor, broadcastPenStroke, cursor, drawDirectlyOnCanvas, eraser, selection, handleMouseMoveWithPreview]);

  const handleMouseUp = useCallback((e) => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    if (selectedTool === 'pen') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const point = {
          x: e.clientX - rect.left - panning.panOffset.x,
          y: e.clientY - rect.top - panning.panOffset.y
        };
        drawDirectlyOnCanvas(point, true); // End the stroke
      }
    } else if (SHAPE_TOOLS.includes(selectedTool) && drawing.startPoint && drawing.currentPoint) {
      const newShape = {
        id: Date.now() + Math.random(),
        tool: selectedTool,
        start: drawing.startPoint,
        end: drawing.currentPoint,
        color: selectedColor,
        backgroundColor: backgroundColor !== "#ffffff" ? backgroundColor : null,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100
      };

      setShapes(prev => [...prev, newShape]);
      broadcastDrawingImmediate(newShape);
      drawing.resetDrawing();
      requestAnimationFrame(redrawCanvas);
    } else if (selectedTool === 'eraser') {
      eraser.finishErasing();
      requestAnimationFrame(redrawCanvas);
    } else if (selectedTool === 'hand' && selection.isSelecting) {
      selection.finishSelection();
      requestAnimationFrame(redrawCanvas);
    }
  }, [selectedTool, drawing, selectedColor, backgroundColor, strokeWidth, strokeStyle, opacity, panning.panOffset, broadcastDrawingImmediate, drawDirectlyOnCanvas, eraser, selection]);

  // Helper functions
  const isPointInElement = useCallback((point, shape) => {
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
    }
    return false;
  }, []);

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

  const interpolatePoints = (p1, p2, spacing = 2) => {
    const points = [];
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const steps = Math.floor(dist / spacing);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      points.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      });
    }
    return points;
  };

  const shapeIntersectsEraser = (shape, eraserPts) => {
    const ERASER_RADIUS = 2;
    if (shape.tool === "pen" || shape.tool === "laser") {
      const points = shape.points;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        for (const ep of eraserPts) {
          if (pointNearLine(ep, p1, p2, ERASER_RADIUS)) return true;
        }
      }
      return false;
    }
    return eraserPts.some(ep => isPointInElement(ep, shape));
  };

  // ==================== SOCKET EVENT HANDLERS ====================

  const handleRemoteDrawing = useCallback((data) => {
    if (data.userId === socket?.id) return;

    const newShape = {
      id: data.id || Date.now() + Math.random(),
      tool: data.tool,
      start: data.start,
      end: data.end,
      points: data.points,
      color: data.color,
      strokeWidth: data.strokeWidth,
      strokeStyle: data.strokeStyle,
      opacity: data.opacity,
      text: data.text,
      fontSize: data.fontSize,
      fontFamily: data.fontFamily,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      src: data.src,
      backgroundColor: data.backgroundColor,
      expiration: data.expiration
    };

    setShapes(prev => {
      if (data.tool === 'pen' || data.tool === 'laser') {
        const existingIndex = prev.findIndex(s => s.id === newShape.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newShape;
          return updated;
        }
      }
      return [...prev, newShape];
    });

    if (data.tool === 'image' && data.src) {
      const img = new Image();
      img.onload = () => {
        images.setLoadedImages(prev => new Map(prev.set(newShape.id, img)));
      };
      img.src = data.src;
    }

    requestAnimationFrame(redrawCanvas);
  }, [socket?.id, images]);

  const handleRemotePenStroke = useCallback((data) => {
    if (data.userId === socket?.id) return;

    setShapes(prev => {
      const existingIndex = prev.findIndex(s => s.id === data.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          points: data.points
        };
        return updated;
      }

      return [...prev, {
        id: data.id,
        tool: 'pen',
        points: data.points,
        color: data.color,
        strokeWidth: data.strokeWidth,
        opacity: data.opacity,
        temporary: true
      }];
    });

    requestAnimationFrame(redrawCanvas);
  }, [socket?.id]);

  const handleRemoteCursor = useCallback((data) => {
    setRemoteCursors(prev => {
      const newCursors = new Map(prev);
      newCursors.set(data.userId, {
        name: data.name || `User ${data.userId?.slice(0, 6)}`,
        color: data.color || '#000000',
        x: data.x,
        y: data.y,
        timestamp: data.timestamp
      });
      return newCursors;
    });

    setTimeout(() => {
      setRemoteCursors(prev => {
        const newCursors = new Map(prev);
        const cursorData = newCursors.get(data.userId);
        if (cursorData && cursorData.timestamp === data.timestamp) {
          newCursors.delete(data.userId);
        }
        return newCursors;
      });
    }, 2000);
  }, []);

  const handleClearCanvas = useCallback(() => {
    setShapes([]);
    drawing.resetDrawing();
    selection.resetSelection();
    eraser.resetEraser();
    images.resetImageStates();
    setTextInput({ show: false, x: 0, y: 0, value: "", fontSize: 16 });
    // Clear image preview
    setImagePreview(null);
    setMousePosition({ x: 0, y: 0 });
    requestAnimationFrame(redrawCanvas);
  }, [drawing, selection, eraser, images]);

  // ==================== CANVAS SETUP AND RENDERING ====================

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    contextRef.current = ctx;

    const appEl = document.querySelector(".app");
    if (appEl) {
      canvas.width = appEl.scrollWidth;
      canvas.height = appEl.scrollHeight;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasBackgroundColor]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply pan offset
    ctx.save();
    ctx.translate(panning.panOffset.x, panning.panOffset.y);

    // Draw all shapes
    shapes.forEach((shape, idx) => {
      const isSelected = selection.selectedElements.includes(idx);
      const isFaded = eraser.markedIds.includes(idx);

      if (shape.tool === 'pen' || shape.tool === 'laser') {
        if (!shape.points || shape.points.length < 2) return;

        ctx.save();
        ctx.globalAlpha = isFaded ? 0.3 : (shape.opacity || 1);
        ctx.strokeStyle = shape.color || '#000000';
        ctx.lineWidth = shape.strokeWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (shape.tool === 'laser') {
          ctx.shadowColor = shape.color;
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
        ctx.restore();

      } else if (shape.tool === 'text') {
        ctx.save();
        ctx.globalAlpha = isFaded ? 0.3 : (shape.opacity || 1);
        ctx.fillStyle = shape.color || '#000000';
        ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || 'Arial'}`;
        ctx.textBaseline = 'top';
        const lines = shape.text.split('\n');
        const lineHeight = (shape.fontSize || 16) * 1.2;
        lines.forEach((line, index) => {
          ctx.fillText(line, shape.x, shape.y + (index * lineHeight));
        });
        ctx.restore();

      } else if (shape.tool === 'image') {
        const img = images.loadedImages.get(shape.id);
        if (img) {
          ctx.save();
          ctx.globalAlpha = isFaded ? 0.3 : (shape.opacity || 1);
          try {
            ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
          } catch (error) {
            console.warn('Error drawing image:', error);
          }
          ctx.restore();
        }

      } else if (['rectangle', 'square', 'circle', 'line', 'arrow', 'diamond'].includes(shape.tool)) {
        ctx.save();
        ctx.globalAlpha = isFaded ? 0.3 : (shape.opacity || 1);
        ctx.strokeStyle = shape.color || '#000000';
        ctx.lineWidth = shape.strokeWidth || 2;

        if (shape.backgroundColor && shape.backgroundColor !== '#ffffff') {
          ctx.fillStyle = shape.backgroundColor;
        }

        ctx.beginPath();

        switch (shape.tool) {
          case 'rectangle':
            const width = shape.end.x - shape.start.x;
            const height = shape.end.y - shape.start.y;
            ctx.rect(shape.start.x, shape.start.y, width, height);
            break;

          case 'square':
            const size = Math.max(Math.abs(shape.end.x - shape.start.x), Math.abs(shape.end.y - shape.start.y));
            ctx.rect(shape.start.x, shape.start.y, size * Math.sign(shape.end.x - shape.start.x), size * Math.sign(shape.end.y - shape.start.y));
            break;

          case 'circle':
            const centerX = (shape.start.x + shape.end.x) / 2;
            const centerY = (shape.start.y + shape.end.y) / 2;
            const radius = Math.sqrt(Math.pow(shape.end.x - shape.start.x, 2) + Math.pow(shape.end.y - shape.start.y, 2)) / 2;
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            break;

          case 'line':
            ctx.moveTo(shape.start.x, shape.start.y);
            ctx.lineTo(shape.end.x, shape.end.y);
            break;

          case 'arrow':
            ctx.moveTo(shape.start.x, shape.start.y);
            ctx.lineTo(shape.end.x, shape.end.y);

            const angle = Math.atan2(shape.end.y - shape.start.y, shape.end.x - shape.start.x);
            const headlen = 15;
            ctx.moveTo(shape.end.x, shape.end.y);
            ctx.lineTo(
              shape.end.x - headlen * Math.cos(angle - Math.PI / 6),
              shape.end.y - headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(shape.end.x, shape.end.y);
            ctx.lineTo(
              shape.end.x - headlen * Math.cos(angle + Math.PI / 6),
              shape.end.y - headlen * Math.sin(angle + Math.PI / 6)
            );
            break;

          case 'diamond':
            const cx = (shape.start.x + shape.end.x) / 2;
            const cy = (shape.start.y + shape.end.y) / 2;
            const w = Math.abs(shape.end.x - shape.start.x) / 2;
            const h = Math.abs(shape.end.y - shape.start.y) / 2;
            ctx.moveTo(cx, cy - h);
            ctx.lineTo(cx + w, cy);
            ctx.lineTo(cx, cy + h);
            ctx.lineTo(cx - w, cy);
            ctx.closePath();
            break;
        }

        if (shape.backgroundColor && shape.backgroundColor !== '#ffffff') {
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
      }
    });

    // Draw current drawing preview
    if (drawing.isDrawing) {
      if (selectedTool === "pen" && drawing.penPoints && drawing.penPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = opacity / 100;

        ctx.beginPath();
        ctx.moveTo(drawing.penPoints[0].x, drawing.penPoints[0].y);
        for (let i = 1; i < drawing.penPoints.length; i++) {
          ctx.lineTo(drawing.penPoints[i].x, drawing.penPoints[i].y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (['square', 'rectangle', 'circle', 'line', 'arrow', 'diamond'].includes(selectedTool) && drawing.startPoint && drawing.currentPoint) {
        ctx.save();
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        switch (selectedTool) {
          case 'rectangle':
            const width = drawing.currentPoint.x - drawing.startPoint.x;
            const height = drawing.currentPoint.y - drawing.startPoint.y;
            ctx.rect(drawing.startPoint.x, drawing.startPoint.y, width, height);
            break;
          case 'square':
            const size = Math.max(Math.abs(drawing.currentPoint.x - drawing.startPoint.x), Math.abs(drawing.currentPoint.y - drawing.startPoint.y));
            ctx.rect(drawing.startPoint.x, drawing.startPoint.y, size * Math.sign(drawing.currentPoint.x - drawing.startPoint.x), size * Math.sign(drawing.currentPoint.y - drawing.startPoint.y));
            break;
          case 'circle':
            const centerX = (drawing.startPoint.x + drawing.currentPoint.x) / 2;
            const centerY = (drawing.startPoint.y + drawing.currentPoint.y) / 2;
            const radius = Math.sqrt(Math.pow(drawing.currentPoint.x - drawing.startPoint.x, 2) + Math.pow(drawing.currentPoint.y - drawing.startPoint.y, 2)) / 2;
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            break;
          case 'line':
            ctx.moveTo(drawing.startPoint.x, drawing.startPoint.y);
            ctx.lineTo(drawing.currentPoint.x, drawing.currentPoint.y);
            break;
          case 'arrow':
            ctx.moveTo(drawing.startPoint.x, drawing.startPoint.y);
            ctx.lineTo(drawing.currentPoint.x, drawing.currentPoint.y);
            break;
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw eraser path
    if (selectedTool === 'eraser' && eraser.eraserPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(160,160,160,0.5)";
      ctx.lineWidth = ERASER_RADIUS * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(eraser.eraserPath[0].x, eraser.eraserPath[0].y);
      for (let i = 1; i < eraser.eraserPath.length; i++) {
        ctx.lineTo(eraser.eraserPath[i].x, eraser.eraserPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw selection box
    if (selection.isSelecting && selection.selectionBox) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.fillRect(selection.selectionBox.x, selection.selectionBox.y, selection.selectionBox.width, selection.selectionBox.height);
      ctx.strokeRect(selection.selectionBox.x, selection.selectionBox.y, selection.selectionBox.width, selection.selectionBox.height);
      ctx.restore();
    }

    ctx.restore();
  }, [canvasBackgroundColor, panning.panOffset, shapes, drawing, selectedTool, selectedColor, strokeWidth, opacity, eraser, selection, images.loadedImages]);

  // ==================== SOCKET SETUP ====================

  useEffect(() => {
    if (!socket) return;

    socket.on('drawing', handleRemoteDrawing);
    socket.on('penStroke', handleRemotePenStroke);
    socket.on('cursorMove', handleRemoteCursor);
    socket.on('clearCanvas', handleClearCanvas);

    return () => {
      socket.off('drawing', handleRemoteDrawing);
      socket.off('penStroke', handleRemotePenStroke);
      socket.off('cursorMove', handleRemoteCursor);
      socket.off('clearCanvas', handleClearCanvas);
    };
  }, [socket, handleRemoteDrawing, handleRemotePenStroke, handleRemoteCursor, handleClearCanvas]);

  // ==================== COMPONENT SETUP ====================

  useEffect(() => {
    setupCanvas();
    redrawCanvas();
  }, [setupCanvas, redrawCanvas]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(redrawCanvas);
  }, [shapes.length, redrawCanvas]);

  // Text submission
  const handleTextSubmit = useCallback(() => {
    if (textInput.value.trim()) {
      const newTextShape = {
        id: Date.now() + Math.random(),
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
      broadcastDrawingImmediate(newTextShape);
    }

    setTextInput({
      show: false,
      x: 0,
      y: 0,
      value: "",
      fontSize: 16
    });
  }, [textInput, selectedColor, opacity, broadcastDrawingImmediate]);

  // Clear function for parent
  const clearAllCanvas = useCallback(() => {
    handleClearCanvas();

    if (socket && roomId) {
      socket.emit('clearCanvas', { roomId });
    }
  }, [handleClearCanvas, socket, roomId]);

  // Expose clear function to parent
  useEffect(() => {
    if (onClearFunction) {
      onClearFunction(clearAllCanvas);
    }
  }, [clearAllCanvas, onClearFunction]);

  // Expose image functions to parent
  useEffect(() => {
    if (onAddImageToCanvas) {
      onAddImageToCanvas((imageSrc, imageName) => {
        const img = new Image();
        img.onload = () => {
          const imageId = `img_${Date.now()}_${Math.random()}`;
          images.setLoadedImages(prev => new Map(prev.set(imageId, img)));

          const newImageShape = {
            id: imageId,
            tool: "image",
            x: 100,
            y: 100,
            width: img.width,
            height: img.height,
            src: imageSrc,
            opacity: opacity / 100,
            name: imageName
          };

          setShapes(prev => [...prev, newImageShape]);
          broadcastDrawingImmediate(newImageShape);
        };
        img.src = imageSrc;
      });
    }
  }, [onAddImageToCanvas, opacity, broadcastDrawingImmediate, images]);

  // NEW: Expose image trigger function to parent - THIS IS THE KEY FIX
  useEffect(() => {
    if (onImageTrigger) {
      onImageTrigger(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      });
    }
  }, [onImageTrigger]);

  // ESC key handler
  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Memoized remote cursors
  const remoteCursorElements = useMemo(() => {
    return Array.from(remoteCursors.entries()).map(([userId, cursorData]) => (
      <div
        key={userId}
        style={{
          position: 'absolute',
          left: cursorData.x + panning.panOffset.x,
          top: cursorData.y + panning.panOffset.y,
          pointerEvents: 'none',
          zIndex: 1000,
          transform: 'translate(-50%, -50%)',
          willChange: 'transform'
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: cursorData.color,
            border: '1px solid white',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)'
          }}
        />
        <div
          style={{
            marginTop: '2px',
            padding: '1px 4px',
            backgroundColor: cursorData.color,
            color: 'white',
            borderRadius: '2px',
            fontSize: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          {cursorData.name}
        </div>
      </div>
    ));
  }, [remoteCursors, panning.panOffset]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseEnter={cursor.handleMouseEnter}
        style={{
          cursor: imagePreview ? 'none' : cursor.getCursorStyle(),
          touchAction: 'none',
          willChange: 'contents'
        }}
      />

      {remoteCursorElements}

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Image preview that follows mouse */}
      {imagePreview && (
        <div
          style={{
            position: 'absolute',
            left: mousePosition.x + panning.panOffset.x,
            top: mousePosition.y + panning.panOffset.y,
            width: imagePreview.width,
            height: imagePreview.height,
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
            color: '#3b82f6',
            willChange: 'transform'
          }}
        >
          📷 {imagePreview.name}
        </div>
      )}

      {textInput.show && (
        <textarea
          value={textInput.value}
          onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleTextSubmit();
            } else if (e.key === 'Escape') {
              setTextInput({ show: false, x: 0, y: 0, value: "", fontSize: 16 });
            }
          }}
          style={{
            position: 'absolute',
            left: textInput.x + panning.panOffset.x,
            top: textInput.y + panning.panOffset.y,
            fontSize: `${textInput.fontSize}px`,
            color: selectedColor,
            background: 'transparent',
            border: '1px dashed #ccc',
            outline: 'none',
            resize: 'none',
            zIndex: 1000,
            minWidth: '100px',
            minHeight: `${textInput.fontSize * 1.2}px`,
          }}
          placeholder="Type..."
          autoFocus
        />
      )}
    </>
  );
}
