import { useEffect, useCallback, useState } from 'react';

const useCanvasEvents = (
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
  cursor,
  // Collaboration parameters
  onDrawingStart,
  onDrawingUpdate,
  onDrawingEnd,
  onCursorMove,
  isCollaborating = false
) => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  // Get relative coordinates helper
  const getRelativeCoords = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return panning.getRelativeCoords(e, rect);
  }, [canvasRef, panning]);

  // Interpolate points helper
  const interpolatePoints = useCallback((p1, p2, spacing = 2) => {
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
  }, []);

  // Shape intersects eraser helper
  const shapeIntersectsEraser = useCallback((shape, eraserPts) => {
    const ERASER_RADIUS = 2;
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
        for (const ep of eraserPts) {
          if (pointNearLine(ep, p1, p2, ERASER_RADIUS)) return true;
        }
      }
      return false;
    } else if (shape.tool === "text") {
      return eraserPts.some(ep => {
        const dx = ep.x - shape.x;
        const dy = ep.y - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= ERASER_RADIUS * 15;
      });
    } else if (shape.tool === "image") {
      return eraserPts.some(ep => {
        return ep.x >= shape.x && ep.x <= shape.x + shape.width &&
          ep.y >= shape.y && ep.y <= shape.y + shape.height;
      });
    }

    return eraserPts.some(ep => isPointInElement(ep, shape));
  }, [isPointInElement]);

  // Enhanced mouse down handler with collaboration
  const handleMouseDown = useCallback((e) => {
    const point = getRelativeCoords(e);

    // Handle selection with hand tool
    if (selectedTool === "hand") {
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
      return;
    }

    // Handle image placement
    if (selectedTool === "image") {
      if (imageToPlace) {
        saveToHistory(shapes);
        const imageId = `img_${Date.now()}_${Math.random()}`;
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Map(prev.set(imageId, img)));
        };
        img.src = imageToPlace.src;

        const newShape = {
          tool: "image",
          id: imageId,
          x: point.x - imageToPlace.width / 2,
          y: point.y - imageToPlace.height / 2,
          width: imageToPlace.width,
          height: imageToPlace.height,
          src: imageToPlace.src,
          opacity: opacity / 100
        };

        setShapes(prev => [...prev, newShape]);
        setImageToPlace(null);
        if (onToolChange) {
          onToolChange("hand");
        }
        return;
      } else {
        fileInputRef.current?.click();
        return;
      }
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
        const textAreaRef = document.querySelector('.whiteboard-text-input');
        if (textAreaRef) {
          textAreaRef.focus();
        }
      }, 10);
      return;
    }

    // Clear selection when starting to draw
    if (selectedTool !== "hand" && selectedTool !== "select" && selectedTool !== "image") {
      selection.clearSelection();
    }

    // Handle drawing tools with collaboration
    if (drawing.isDrawingTool()) {
      saveToHistory(shapes);
      
      // Emit drawing start for collaboration
      if (isCollaborating && onDrawingStart) {
        onDrawingStart({
          tool: selectedTool,
          point,
          color: selectedColor,
          strokeWidth,
          opacity: opacity / 100
        });
      }
      
      drawing.startDrawing(point);
    } else if (selectedTool === "eraser") {
      eraser.startErasing(point);
    }
  }, [selectedTool, getRelativeCoords, shapes, selection, drawing, eraser, isPointInElement, saveToHistory, setShapes, setImageToPlace, onToolChange, strokeWidth, setTextInput, opacity, fileInputRef, setLoadedImages, isCollaborating, onDrawingStart, selectedColor]);

  // Enhanced mouse move handler with collaboration
  const handleMouseMove = useCallback((e) => {
    const point = getRelativeCoords(e);

    // Handle panning
    if (panning.isPanning && selectedTool === "hand") {
      panning.updatePanning(e);
      return;
    }

    // Handle selection box for hand tool
    if (selection.isSelecting && (selectedTool === "hand" || selectedTool === "select")) {
      const startPoint = selection.selectionStartPoint || {
        x: selection.selectionBox?.x || point.x,
        y: selection.selectionBox?.y || point.y
      };
      selection.updateSelection(point, startPoint);
      return;
    }

    // Handle drawing with collaboration
    if (drawing.isDrawingTool() && drawing.isDrawing) {
      drawing.updateDrawing(point);
      
      // Emit drawing update for collaboration
      if (isCollaborating && onDrawingUpdate) {
        onDrawingUpdate({
          tool: selectedTool,
          point,
          points: selectedTool === "pen" ? drawing.penPoints : 
                 selectedTool === "laser" ? drawing.laserPoints : [],
          startPoint: drawing.startPoint,
          currentPoint: point
        });
      }
    } else if (selectedTool === "eraser" && eraser.isErasing) {
      eraser.updateErasing(point, interpolatePoints, shapeIntersectsEraser);
    }
  }, [panning, selectedTool, getRelativeCoords, selection, drawing, eraser, interpolatePoints, shapeIntersectsEraser, isCollaborating, onDrawingUpdate]);

  // Enhanced mouse up handler with collaboration
  const handleMouseUp = useCallback(() => {
    // Stop panning
    panning.stopPanning();

    // Handle selection completion for hand tool
    if (selection.isSelecting && (selectedTool === "hand" || selectedTool === "select")) {
      selection.finishSelection();
      return;
    }

    // Handle drawing completion with collaboration
    if (drawing.isDrawingTool() && drawing.isDrawing) {
      // Emit drawing end for collaboration before finishing
      if (isCollaborating && onDrawingEnd) {
        onDrawingEnd({
          tool: selectedTool,
          finalShape: {
            tool: selectedTool,
            points: selectedTool === "pen" ? drawing.penPoints : 
                   selectedTool === "laser" ? drawing.laserPoints : undefined,
            start: drawing.startPoint,
            end: drawing.currentPoint,
            color: selectedColor,
            strokeWidth,
            opacity: opacity / 100
          }
        });
      }
      
      drawing.finishDrawing(setShapes);
    } else if (selectedTool === "eraser" && eraser.isErasing) {
      eraser.finishErasing();
    }
  }, [panning, selection, selectedTool, drawing, eraser, setShapes, isCollaborating, onDrawingEnd, selectedColor, strokeWidth, opacity]);

  // Cursor move handler (tracks mouse position)
  const handleCursorMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const newMousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setMousePos(newMousePos);

    // Emit cursor position for collaboration
    if (isCollaborating && onCursorMove) {
      const adjustedPos = getRelativeCoords(e);
      onCursorMove(adjustedPos.x, adjustedPos.y);
    }

    handleMouseMove(e);
  }, [canvasRef, handleMouseMove, isCollaborating, onCursorMove, getRelativeCoords]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      selection.clearSelection();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      selection.selectAll();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      handlePasteFromClipboard();
    }
  }, [selection, handlePasteFromClipboard]);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCursorMove,
    handleKeyDown,
    getRelativeCoords,
    interpolatePoints,
    shapeIntersectsEraser,
    mousePos
  };
};

export default useCanvasEvents;
