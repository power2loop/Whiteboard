// Canvas.jsx
import { useRef, useEffect, useState } from "react";
import "./Canvas.css";

// Shape tools
const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line"];

export default function Canvas({ selectedTool }) {
  const canvasRef = useRef(null);
  // Store all drawn shapes
  const [shapes, setShapes] = useState([]);
  // Current drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const appEl = document.querySelector(".app");
    canvas.width = appEl.scrollWidth;
    canvas.height = appEl.scrollHeight;
    redraw();
    // eslint-disable-next-line
  }, []);

// ✅ Apply custom cursor based on selected tool
  useEffect(() => {
    const canvas = canvasRef.current;

    if (selectedTool === "pen") {
      // Use your pen image as cursor
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15.4998 5.49994L18.3282 8.32837M3 20.9997L3.04745 20.6675C3.21536 19.4922 3.29932 18.9045 3.49029 18.3558C3.65975 17.8689 3.89124 17.4059 4.17906 16.9783C4.50341 16.4963 4.92319 16.0765 5.76274 15.237L17.4107 3.58896C18.1918 2.80791 19.4581 2.80791 20.2392 3.58896C21.0202 4.37001 21.0202 5.63634 20.2392 6.41739L8.37744 18.2791C7.61579 19.0408 7.23497 19.4216 6.8012 19.7244C6.41618 19.9932 6.00093 20.2159 5.56398 20.3879C5.07171 20.5817 4.54375 20.6882 3.48793 20.9012L3 20.9997Z\"/></svg>') 0 20, auto";
    } else if (selectedTool === "eraser") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"-5.5 0 32 32\" fill=\"black\"><path d=\"M2.125 13.781l7.938-7.938c0.719-0.719 1.813-0.719 2.531 0l7.688 7.688c0.719 0.719 0.719 1.844 0 2.563l-7.938 7.938c-2.813 2.813-7.375 2.813-10.219 0-2.813-2.813-2.813-7.438 0-10.25zM11.063 22.75l-7.656-7.688c-2.125 2.125-2.125 5.563 0 7.688s5.531 2.125 7.656 0z\"/></svg>') 10 10, auto";
    } else if (selectedTool === "select") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z\"/></svg>') 10 10, auto";
    } else if (selectedTool === "hand") {
      canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 512 512\" fill=\"none\" stroke=\"black\" stroke-width=\"40\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M160 200V120a40 40 0 0 1 80 0v68\"/><path d=\"M240 188V104a40 40 0 0 1 80 0v76\"/><path d=\"M320 168V120a40 40 0 0 1 80 0v80c0 88-72 160-160 160s-160-72-160-160v-24a40 40 0 0 1 40-40h40v56\"/></svg>') 10 10, auto";
    } else {
      canvas.style.cursor = "crosshair";
    }
  }, [selectedTool]);

  // Redraw whenever new shapes or preview shape
  useEffect(() => {
    redraw();
    // eslint-disable-next-line
  }, [shapes, currentPoint, isDrawing, selectedTool]);

  // Get mouse coordinates relative to canvas
  function getRelativeCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  // Mouse down handler, starts drawing or erasing
  const handleMouseDown = (e) => {
    const point = getRelativeCoords(e);
    if (selectedTool === "pen") {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
      const ctx = canvasRef.current.getContext("2d");
      setupTool(ctx);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    } else if (selectedTool === "eraser") {
      // Eraser: find and remove shape under cursor
      const hitIndex = shapes.findIndex((shape) => isInShape(shape, point));
      if (hitIndex !== -1) {
        const updatedShapes = shapes.filter((_, i) => i !== hitIndex);
        setShapes(updatedShapes);
      }
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
    }
  };

  // Mouse move handler, draws or previews shape
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const point = getRelativeCoords(e);
    setCurrentPoint(point);

    if (selectedTool === "pen") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  // Mouse up handler, finalizes drawing
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (selectedTool === "pen") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.closePath();
    } else if (SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      setShapes([
        ...shapes,
        { tool: selectedTool, start: startPoint, end: currentPoint },
      ]);
    }
    setStartPoint(null);
    setCurrentPoint(null);
  };

  // Setup pen tool parameters
  function setupTool(ctx) {
    if (selectedTool === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
    }
  }

  // Redraw all shapes & current preview
  function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      drawShape(ctx, shape.start, shape.end, shape.tool);
    });

    if (isDrawing && SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      drawShape(ctx, startPoint, currentPoint, selectedTool, true);
    }
  }

  // Draw shapes including diamond (replacing triangle)
  function drawShape(ctx, start, end, tool, isPreview = false) {
    ctx.save();
    ctx.beginPath();

    switch (tool) {
      case "square": {
        const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
        ctx.rect(
          start.x,
          start.y,
          size * Math.sign(end.x - start.x),
          size * Math.sign(end.y - start.y)
        );
        break;
      }
      case "diamond": {
        // Diamond geometry centered in between start/end
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
      }
      case "circle": {
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2) / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        break;
      }
      case "arrow": {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        drawArrowHead(ctx, start, end, 16);
        break;
      }
      case "line": {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        break;
      }
      default:
        break;
    }

    ctx.strokeStyle = isPreview ? "#888" : "#333";
    ctx.lineWidth = isPreview ? 1 : 2;
    ctx.stroke();
    ctx.restore();
  }

  // Draw arrow head function
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

  // Check if point (x,y) is inside shape
  function isInShape(shape, point) {
    const { start, end, tool } = shape;
    switch (tool) {
      case "square":
      case "diamond": {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
      }
      case "circle": {
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radius = Math.sqrt(
          (end.x - start.x) ** 2 + (end.y - start.y) ** 2
        ) / 2;
        return (
          (point.x - centerX) ** 2 + (point.y - centerY) ** 2 <= radius ** 2
        );
      }
      case "line":
      case "arrow":
        return isNearLine(start, end, point, 8);
      default:
        return false;
    }
  }

  // Check proximity of point to line segment for eraser hit-testing
  function isNearLine(start, end, point, threshold) {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
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

    const dx = point.x - xx;
    const dy = point.y - yy;
    return dx * dx + dy * dy <= threshold * threshold;
  }

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      tabIndex={0}
      aria-label="whiteboard-canvas"
    />
  );
}
