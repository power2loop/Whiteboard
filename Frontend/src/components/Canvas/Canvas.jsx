import { useRef, useEffect, useState, useCallback } from "react";
import useUndoRedo from './hooks/useUndoRedo';
import useCanvasDrawing from './hooks/useCanvasDrawing';
import useCanvasSelection from './hooks/useCanvasSelection';
import useCanvasEraser from './hooks/useCanvasEraser';
import useCanvasPanning from './hooks/useCanvasPanning';
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

  // Use the enhanced undo/redo hook
  const { saveToHistory } = useUndoRedo(
    shapes,
    setShapes,
    onUndoFunction,
    onRedoFunction,
    onCanUndo,
    onCanRedo
  );

  // Use the drawing hook
  const drawing = useCanvasDrawing(
    selectedTool,
    selectedColor,
    strokeWidth,
    strokeStyle,
    backgroundColor,
    opacity
  );

  // Use the selection hook
  const selection = useCanvasSelection(shapes);

  // Use the eraser hook
  const eraser = useCanvasEraser(shapes, setShapes, saveToHistory);

  // Use the panning hook
  const panning = useCanvasPanning();

  // Clear all canvas content function
  const clearAllCanvas = useCallback(() => {
    console.log('Clearing entire canvas');
    console.log('Elements before clear:', shapes.length);

    if (shapes.length > 0) {
      saveToHistory(shapes);
      setShapes([]);

      // Clear all temporary states using hooks
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

      tempCtx.fillStyle = '#ffffff';
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
  }, []);

  // Expose copy function to parent component
  useEffect(() => {
    if (onCopyFunction) {
      onCopyFunction(copyCanvasToClipboard);
    }
  }, [copyCanvasToClipboard, onCopyFunction]);

  // Function to check if a point is inside an element
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
    } else {
      return isPointInShape(shape, point);
    }
  }, []);

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
  }, [shapes, drawing.penPoints, drawing.laserPoints, eraser.eraserPath, eraser.markedIds, drawing.isDrawing, selectedTool, drawing.startPoint, drawing.currentPoint, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity, panning.panOffset, selection.selectedElements, selection.selectionBox, selection.isSelecting]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes.length, selection]);

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
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"><path d=\"M15.4998 5.49994L18.3282 8.32837M3 20.9997L3.04745 20.6675C3.21536 19.4922 3.29932 18.9045 3.49029 18.3558C3.65975 17.8689 3.89124 17.4059 4.17906 16.9783C4.50341 16.4963 4.92319 16.0765 5.76274 15.237L17.4107 3.58896C18.1918 2.80791 19.4581 2.80791 20.2392 3.58896C21.0202 4.37001 21.0202 5.63634 20.2392 6.41739L8.37744 18.2791C7.61579 19.0408 7.23497 19.4216 6.8012 19.7244C6.41618 19.9932 6.00093 20.2159 5.56398 20.3879C5.07171 20.5817 4.54375 20.6882 3.48793 20.9012L3 20.9997Z\"/></svg>') 0 20, auto";
    } else if (selectedTool === "eraser") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"/></svg>') 8 8, auto";
    } else if (selectedTool === "laser") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" width=\"24\" height=\"24\" viewBox=\"0 0 6.827 6.827\" style=\"shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd\"><defs><style>.fil3{fill:%23414141;fill-rule:nonzero}</style></defs><g id=\"Layer_x0020_1\"><path d=\"m2.897 3.462-.5-.549.079-.071-.08.071a.107.107 0 0 1 .016-.157l.309-.28.071.08-.071-.08a.107.107 0 0 1 .157.016l.503.557-.482.412-.002.001z\" style=\"fill:%23959595;fill-rule:nonzero\"/><path d=\"m4.625 5.377-1.73-1.913.002-.002.484-.413L5.1 4.948l-.474.43z\" style=\"fill:%23676767;fill-rule:nonzero\"/><path d=\"m5.575 5.648-.31.279-.07-.079.07.08a.107.107 0 0 1-.156-.016l-.484-.535.474-.43.49.544-.078.071.079-.071a.107.107 0 0 1-.015.157z\" style=\"fill:%232f2f2f;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M3.27 1.342a.807.807 0 0 1-.295.293.808.808 0 0 1 .294.293.808.808 0 0 1 .294-.293.808.808 0 0 1-.294-.293z\"/><path d=\"M3.27 2.358c-.105-.352-.464-.708-.693-.708.357-.137.575-.429.692-.778.117.35.335.64.692.778-.229 0-.587.356-.692.708z\" style=\"fill:%23bcbcbc;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.788 1.858a.582.582 0 0 1-.212.21.582.582 0 0 1 .212.212A.582.582 0 0 1 2 2.069a.582.582 0 0 1-.212-.211z\"/><path d=\"M1.788 2.59c-.076-.254-.334-.51-.499-.51.257-.1.414-.31.499-.561.084.252.241.462.498.56-.165 0-.423.257-.498.51z\" style=\"fill:%23a0a0a0;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.555 3.314a.404.404 0 0 1-.147.146.404.404 0 0 1 .147.147.404.404 0 0 1 .147-.147.404.404 0 0 1-.147-.146z\"/><path d=\"M1.555 3.822c-.052-.176-.231-.355-.346-.355a.594.594 0 0 0 .346-.389c.059.175.168.321.346.39-.114 0-.293.178-.346.354z\" style=\"fill:%23868686;fill-rule:nonzero\"/></g><path style=\"fill:none\" d=\"M0 0h6.827v6.827H0z\"/></svg>') 3 3, auto";
    } else if (selectedTool === "text") {
      canvas.style.cursor = "text";
    } else if (selectedTool === "hand") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z\"/></svg>') 10 10, auto";
    } else if (selectedTool === "select") {
      canvas.style.cursor = "default";
    } else {
      canvas.style.cursor = "crosshair";
    }
  }, [selectedTool]);

  // Updated to use panning hook's getRelativeCoords
  function getRelativeCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return panning.getRelativeCoords(e, rect);
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
  };

  const handleMouseDown = (e) => {
    const point = getRelativeCoords(e);

    // Handle panning with hand tool using the panning hook
    if (selectedTool === "hand") {
      panning.startPanning(e);
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

        setShapes(prev => [...prev, {
          tool: "image",
          id: imageId,
          x: point.x - imageToPlace.width / 2,
          y: point.y - imageToPlace.height / 2,
          width: imageToPlace.width,
          height: imageToPlace.height,
          src: imageToPlace.src,
          opacity: opacity / 100
        }]);

        setImageToPlace(null);
        if (onToolChange) {
          onToolChange("select");
        }
        return;
      } else {
        fileInputRef.current?.click();
        return;
      }
    }

    // Handle selection tool using the selection hook
    if (selectedTool === "select") {
      let clickedElementIndex = -1;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInElement(point, shapes[i])) {
          clickedElementIndex = i;
          break;
        }
      }

      if (clickedElementIndex !== -1) {
        if (selection.isElementSelected(clickedElementIndex)) {
          return;
        }
        selection.selectElement(clickedElementIndex, e.ctrlKey || e.metaKey);
      } else {
        if (!e.ctrlKey && !e.metaKey) {
          selection.clearSelection();
        }
        selection.startSelection(point);
      }
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

    // Clear selection when starting to draw
    if (selectedTool !== "select" && selectedTool !== "image") {
      selection.clearSelection();
    }

    // Handle drawing tools using the hook
    if (drawing.isDrawingTool()) {
      saveToHistory(shapes);
      drawing.startDrawing(point);
    } else if (selectedTool === "eraser") {
      eraser.startErasing(point);
    }
  };

  const handleMouseMove = (e) => {
    // Handle panning using the panning hook
    if (panning.isPanning && selectedTool === "hand") {
      panning.updatePanning(e);
      return;
    }

    const point = getRelativeCoords(e);

    // Handle selection box using the selection hook
    if (selection.isSelecting && selectedTool === "select") {
      selection.updateSelection(point, selection.selectionBox);
      return;
    }

    // Handle drawing using the hook
    if (drawing.isDrawingTool()) {
      drawing.updateDrawing(point);
    } else if (selectedTool === "eraser" && eraser.isErasing) {
      eraser.updateErasing(point, interpolatePoints, shapeIntersectsEraser);
    }
  };

  const handleMouseUp = () => {
    // Stop panning using the panning hook
    panning.stopPanning();

    // Handle selection completion using the selection hook
    if (selection.isSelecting && selectedTool === "select") {
      selection.finishSelection();
      return;
    }

    // Handle drawing completion using the hook
    if (drawing.isDrawingTool()) {
      drawing.finishDrawing(setShapes);
    } else if (selectedTool === "eraser" && eraser.isErasing) {
      eraser.finishErasing();
    }
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

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan transformation using hook state
    ctx.save();
    ctx.translate(panning.panOffset.x, panning.panOffset.y);

    shapes.forEach((shape, idx) => {
      const fade = eraser.markedIds.includes(idx);
      const isSelected = selection.isElementSelected(idx);

      if (shape.tool === "pen") {
        drawPenStroke(ctx, shape.points, false, fade, shape, isSelected);
      } else if (shape.tool === "laser") {
        drawLaserStroke(ctx, shape.points, shape.opacity, shape, isSelected);
      } else if (shape.tool === "text") {
        drawText(ctx, shape, fade, isSelected);
      } else if (shape.tool === "image") {
        drawImage(ctx, shape, fade, isSelected);
      } else {
        drawShape(ctx, shape.start, shape.end, shape.tool, false, fade, shape, isSelected);
      }
    });

    // Draw current drawing using hook states
    if (drawing.isDrawing && selectedTool === "pen" && drawing.penPoints.length) {
      drawPenStroke(ctx, drawing.penPoints, true, false, { color: selectedColor, strokeWidth, strokeStyle, opacity: opacity / 100 });
    }
    if (drawing.isDrawing && selectedTool === "laser" && drawing.laserPoints.length) {
      drawLaserStroke(ctx, drawing.laserPoints, opacity / 100, { color: selectedColor, strokeWidth, strokeStyle });
    }
    if (drawing.isDrawing && SHAPE_TOOLS.includes(selectedTool) && drawing.startPoint && drawing.currentPoint) {
      drawShape(ctx, drawing.startPoint, drawing.currentPoint, selectedTool, true, false, {
        color: selectedColor,
        backgroundColor: backgroundColor !== "#ffffff" ? backgroundColor : null,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100
      });
    }

    // Draw eraser path using hook state
    if (selectedTool === "eraser" && eraser.eraserPath.length > 0) {
      drawEraserPath(ctx, eraser.eraserPath);
    }

    // Draw selection box using hook state
    if (selection.selectionBox && selection.isSelecting) {
      drawSelectionBox(ctx, selection.selectionBox);
    }

    ctx.restore();
  }

  // All your drawing functions remain the same...
  function drawSelectionBox(ctx, box) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.restore();
  }

  function drawSelectionHighlight(ctx, shape, isSelected) {
    if (!isSelected) return;

    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);

    if (shape.tool === "text") {
      const textWidth = shape.text.length * (shape.fontSize || 16) * 0.6;
      const textHeight = (shape.fontSize || 16) * 1.2;
      ctx.strokeRect(shape.x - 2, shape.y - 2, textWidth + 4, textHeight + 4);
    } else if (shape.tool === "image") {
      ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
    } else if (shape.start && shape.end) {
      const minX = Math.min(shape.start.x, shape.end.x) - 5;
      const minY = Math.min(shape.start.y, shape.end.y) - 5;
      const maxX = Math.max(shape.start.x, shape.end.x) + 5;
      const maxY = Math.max(shape.start.y, shape.end.y) + 5;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }

    ctx.restore();
  }

  function drawImage(ctx, shape, faded = false, isSelected = false) {
    const img = loadedImages.get(shape.id);
    if (!img) {
      ctx.save();
      ctx.globalAlpha = faded ? 0.2 : 0.5;
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 2;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);

      ctx.fillStyle = "#6b7280";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Loading...", shape.x + shape.width / 2, shape.y + shape.height / 2);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = faded ? 0.35 : (shape.opacity || 1);

    try {
      ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
    } catch (error) {
      console.error("Error drawing image:", error);
      ctx.fillStyle = "#fca5a5";
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }

    ctx.restore();
    drawSelectionHighlight(ctx, shape, isSelected);
  }

  function drawText(ctx, shape, faded = false, isSelected = false) {
    ctx.save();
    ctx.globalAlpha = faded ? 0.35 : (shape.opacity || 1);
    ctx.fillStyle = shape.color || "#000000";
    ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || "Arial"}`;
    ctx.textBaseline = "top";

    const lines = shape.text.split('\n');
    const lineHeight = (shape.fontSize || 16) * 1.2;

    lines.forEach((line, index) => {
      ctx.fillText(line, shape.x, shape.y + (index * lineHeight));
    });

    ctx.restore();
    drawSelectionHighlight(ctx, shape, isSelected);
  }

  function drawPenStroke(ctx, points, isPreview = false, faded = false, shape = {}, isSelected = false) {
    const color = shape.color || selectedColor;
    const sWidth = shape.strokeWidth || strokeWidth;
    const sStyle = shape.strokeStyle || strokeStyle;
    const sOpacity = shape.opacity !== undefined ? shape.opacity : (opacity / 100);

    ctx.save();
    ctx.globalAlpha = faded ? 0.35 : sOpacity;
    applyStrokeStyle(ctx, sStyle);
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = isPreview ? selectedColor : color;
    ctx.lineWidth = isPreview ? strokeWidth : sWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    if (isSelected && points.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = sWidth + 4;
      ctx.globalAlpha = 0.3;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawLaserStroke(ctx, points, laserOpacity = 1, shape = {}, isSelected = false) {
    const color = shape.color || selectedColor;
    const sWidth = shape.strokeWidth || 3;
    const sStyle = shape.strokeStyle || strokeStyle;

    ctx.save();
    ctx.globalAlpha = laserOpacity;
    applyStrokeStyle(ctx, sStyle);
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = sWidth;
    ctx.shadowColor = color;
    ctx.shadowBlur = 50;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    if (isSelected && points.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = sWidth + 4;
      ctx.globalAlpha = 0.3;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShape(ctx, start, end, tool, isPreview = false, faded = false, shape = {}, isSelected = false) {
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

    drawSelectionHighlight(ctx, shape, isSelected);
  }

  function drawArrowHead(ctx, from, to, headlen = 16) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6),
      to.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6),
      to.y - headlen * Math.sin(angle + Math.PI / 6));
  }

  function drawEraserPath(ctx, points) {
    ctx.save();
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = "rgba(160,160,160,0.5)";
    ctx.lineWidth = ERASER_RADIUS * 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  function shapeIntersectsEraser(shape, eraserPts) {
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
    return eraserPts.some(ep => isPointInShape(shape, ep));
  }

  function distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  function isPointInShape(shape, point) {
    const { start, end, tool } = shape;
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

  function pointInRect(point, start, end) {
    const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }

  function pointInDiamond(point, start, end) {
    const cx = (start.x + end.x) / 2, cy = (start.y + end.y) / 2;
    const w = Math.abs(end.x - start.x) / 2, h = Math.abs(end.y - start.y) / 2;
    const dx = Math.abs(point.x - cx), dy = Math.abs(point.y - cy);
    if (w === 0 || h === 0) return false;
    return dx / w + dy / h <= 1;
  }

  function pointNearLine(point, start, end, threshold) {
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
  }

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
        style={{
          cursor: imageToPlace ? 'crosshair' : 'default',
          backgroundColor: 'transparent'
        }}
      />

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
          style={{
            left: mousePos.x,
            top: mousePos.y,
            width: ERASER_RADIUS * 2,
            height: ERASER_RADIUS * 2,
            position: 'absolute',
            border: '1px solid rgba(160,160,160,0.5)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {imageToPlace && (
        <div
          className="image-placement-cursor"
          style={{
            position: 'absolute',
            left: mousePos.x,
            top: mousePos.y,
            width: imageToPlace.width,
            height: imageToPlace.height,
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

      {selection.selectedElements.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1001,
            pointerEvents: 'none'
          }}
        >
          {selection.selectedElements.length} element(s) selected
        </div>
      )}
    </>
  );
}
