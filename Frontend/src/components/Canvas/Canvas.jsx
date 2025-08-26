import { useRef, useEffect, useState } from "react";
import "./Canvas.css";

const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line", "rectangle"];
const ERASER_RADIUS = 2; // Thickness for erase checking

export default function Canvas({ selectedTool }) {
  const canvasRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  const [penPoints, setPenPoints] = useState([]);
  const [eraserPath, setEraserPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [markedIds, setMarkedIds] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const appEl = document.querySelector(".app");
    if (appEl) {
      canvas.width = appEl.scrollWidth;
      canvas.height = appEl.scrollHeight;
    }
    redraw();
    // eslint-disable-next-line
  }, [shapes, penPoints, eraserPath, markedIds, isDrawing, selectedTool, startPoint, currentPoint]);

  // Cursor with small outlined circle for eraser
  useEffect(() => {
    const canvas = canvasRef.current;

    if (selectedTool === "pen") {
      canvas.style.cursor =
        "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15.4998 5.49994L18.3282 8.32837M3 20.9997L3.04745 20.6675C3.21536 19.4922 3.29932 18.9045 3.49029 18.3558C3.65975 17.8689 3.89124 17.4059 4.17906 16.9783C4.50341 16.4963 4.92319 16.0765 5.76274 15.237L17.4107 3.58896C18.1918 2.80791 19.4581 2.80791 20.2392 3.58896C21.0202 4.37001 21.0202 5.63634 20.2392 6.41739L8.37744 18.2791C7.61579 19.0408 7.23497 19.4216 6.8012 19.7244C6.41618 19.9932 6.00093 20.2159 5.56398 20.3879C5.07171 20.5817 4.54375 20.6882 3.48793 20.9012L3 20.9997Z\"/></svg>') 0 20, auto";
    } else if (selectedTool === "eraser") {
      canvas.style.cursor =
        "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" /></svg>') 8 8, auto";
    } else if (selectedTool === "rectangle") {
      canvas.style.cursor = "crosshair";
    } else if (selectedTool === "hand") {
      canvas.style.cursor ="url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z\"/></svg>') 10 10, auto";
    } else {
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

  // Interpolate points helper for eraser path
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
    if (selectedTool === "pen") {
      setPenPoints([point]);
      setIsDrawing(true);
    } else if (selectedTool === "eraser") {
      setEraserPath([point]);
      setMarkedIds([]);
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
      setPenPoints((ps) => [...ps, point]);
    } else if (selectedTool === "eraser") {
      setEraserPath((p) => {
        if (p.length === 0) return [point];
        const lastPoint = p[p.length - 1];
        const newPoints = interpolatePoints(lastPoint, point);
        return [...p, ...newPoints, point];
      });

      // Mark shapes intersected by eraser path (note eraserPath state update is async,
      // so combine current eraserPath with new point for immediate check)
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
      setShapes([...shapes, { tool: "pen", points: penPoints }]);
      setPenPoints([]);
    } else if (selectedTool === "eraser" && eraserPath.length > 0) {
      setShapes(shapes.filter((_, i) => !markedIds.includes(i)));
      setMarkedIds([]);
      setEraserPath([]);
    } else if (SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      setShapes([...shapes, { tool: selectedTool, start: startPoint, end: currentPoint }]);
    }
    setStartPoint(null);
    setCurrentPoint(null);
  };

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape, idx) => {
      const fade = markedIds.includes(idx);
      if (shape.tool === "pen") {
        drawPenStroke(ctx, shape.points, false, fade);
      } else {
        drawShape(ctx, shape.start, shape.end, shape.tool, false, fade);
      }
    });

    if (isDrawing && selectedTool === "pen" && penPoints.length) {
      drawPenStroke(ctx, penPoints, true, false);
    }
    if (isDrawing && SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      drawShape(ctx, startPoint, currentPoint, selectedTool, true, false);
    }
    if (selectedTool === "eraser" && eraserPath.length > 0) {
      drawEraserPath(ctx, eraserPath);
    }
  }

  function drawPenStroke(ctx, points, isPreview = false, faded = false) {
    ctx.save();
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = isPreview ? "#888" : faded ? "rgba(128,128,128,0.35)" : "#333";
    ctx.lineWidth = isPreview ? 1.5 : faded ? 3.5 : 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  function drawShape(ctx, start, end, tool, isPreview = false, faded = false) {
    ctx.save();
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
    ctx.strokeStyle = isPreview ? "#888" : faded ? "rgba(128,128,128,0.35)" : "#333";
    ctx.lineWidth = isPreview ? 1 : faded ? 3 : 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawArrowHead(ctx, from, to, headlen = 16) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headlen * Math.cos(angle - Math.PI / 6),
      to.y - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headlen * Math.cos(angle + Math.PI / 6),
      to.y - headlen * Math.sin(angle + Math.PI / 6)
    );
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

  // Intersection logic
  function shapeIntersectsEraser(shape, eraserPts) {
    if (shape.tool === "pen") {
      // Check each segment of pen stroke against eraser points
      for (let i = 0; i < shape.points.length - 1; i++) {
        const p1 = shape.points[i];
        const p2 = shape.points[i + 1];
        for (const ep of eraserPts) {
          if (pointNearLine(ep, p1, p2, ERASER_RADIUS)) {
            return true;
          }
        }
      }
      return false;
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
        const cx = (start.x + end.x) / 2,
          cy = (start.y + end.y) / 2;
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
    const minX = Math.min(start.x, end.x),
      maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y),
      maxY = Math.max(start.y, end.y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }

  function pointInDiamond(point, start, end) {
    const cx = (start.x + end.x) / 2,
      cy = (start.y + end.y) / 2;
    const w = Math.abs(end.x - start.x) / 2,
      h = Math.abs(end.y - start.y) / 2;
    const dx = Math.abs(point.x - cx),
      dy = Math.abs(point.y - cy);
    if (w === 0 || h === 0) return false;
    return dx / w + dy / h <= 1;
  }

  function pointNearLine(point, start, end, threshold) {
    const A = point.x - start.x,
      B = point.y - start.y;
    const C = end.x - start.x,
      D = end.y - start.y;
    const dot = A * C + B * D,
      len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }
    const dx = point.x - xx,
      dy = point.y - yy;
    return dx * dx + dy * dy <= threshold * threshold;
  }

  // Eraser cursor visual
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
    </>
  );
}
