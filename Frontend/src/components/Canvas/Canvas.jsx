import { useRef, useEffect, useState } from "react";
import "./Canvas.css";

const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line", "rectangle"];
const ERASER_RADIUS = 2;

export default function Canvas({
  selectedTool,
  selectedColor = "#000000",
  strokeWidth = 2,
  strokeStyle = "solid",
  backgroundColor = "#ffffff",
  opacity = 100
}) {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  const [penPoints, setPenPoints] = useState([]);
  const [laserPoints, setLaserPoints] = useState([]);
  const [eraserPath, setEraserPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [markedIds, setMarkedIds] = useState([]);
  
  // Simple text state
  const [textInput, setTextInput] = useState({
    show: false,
    x: 0,
    y: 0,
    value: "",
    fontSize: 16
  });

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
  }, [shapes, penPoints, laserPoints, eraserPath, markedIds, isDrawing, selectedTool, startPoint, currentPoint, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity]);

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
canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z\"/></svg>') 10 10, auto";    } else {
      canvas.style.cursor = "crosshair";
    }
  }, [selectedTool]);

  function getRelativeCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
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

  const handleMouseDown = (e) => {
    const point = getRelativeCoords(e);
    
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
      setPenPoints([point]);
      setIsDrawing(true);
    } else if (selectedTool === "eraser") {
      setEraserPath([point]);
      setMarkedIds([]);
      setIsDrawing(true);
    } else if (selectedTool === "laser") {
      setLaserPoints([point]);
      setIsDrawing(true);
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
    }
  };

  const handleMouseMove = (e) => {
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
    setIsDrawing(false);

    if (selectedTool === "pen" && penPoints.length > 0) {
      setShapes([...shapes, {
        tool: "pen",
        points: penPoints,
        color: selectedColor,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100
      }]);
      setPenPoints([]);
    } else if (selectedTool === "laser" && laserPoints.length > 1) {
      setShapes([
        ...shapes,
        {
          tool: "laser",
          points: laserPoints,
          opacity: opacity / 100,
          expiration: Date.now() + 2000,
          color: selectedColor,
          strokeWidth,
          strokeStyle
        },
      ]);
      setLaserPoints([]);
    } else if (selectedTool === "eraser" && eraserPath.length > 0) {
      setShapes(shapes.filter((_, i) => !markedIds.includes(i)));
      setMarkedIds([]);
      setEraserPath([]);
    } else if (SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      setShapes([...shapes, {
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
      setShapes([...shapes, {
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

  // Simple text change handler
  const handleTextChange = (e) => {
    setTextInput(prev => ({ 
      ...prev, 
      value: e.target.value
    }));
  };

  // Simple keyboard handler
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

    shapes.forEach((shape, idx) => {
      const fade = markedIds.includes(idx);
      if (shape.tool === "pen") {
        drawPenStroke(ctx, shape.points, false, fade, shape);
      } else if (shape.tool === "laser") {
        drawLaserStroke(ctx, shape.points, shape.opacity, shape);
      } else if (shape.tool === "text") {
        drawText(ctx, shape, fade);
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
  }

  function drawText(ctx, shape, faded = false) {
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
  }

  // All your existing drawing functions remain the same...
  function drawPenStroke(ctx, points, isPreview = false, faded = false, shape = {}) {
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
  }

  function drawLaserStroke(ctx, points, laserOpacity = 1, shape = {}) {
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
    setMousePos(getRelativeCoords(e));
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
      />
      {selectedTool === "eraser" && (
        <div
          className="eraser-cursor-pulse"
          style={{ left: mousePos.x, top: mousePos.y, width: ERASER_RADIUS * 2, height: ERASER_RADIUS * 2 }}
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
    left: textInput.x,
    top: textInput.y - 10,
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
    transition: 'all 0.005s ease-in-out',
    ...(textInput.focused && {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    })
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
