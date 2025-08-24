import { useRef, useEffect, useState } from "react";
import "./DrawCanvas.css";

export default function DrawingBoard() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const appEl = document.querySelector(".app");

    // Full scrollable area size
    canvas.width = appEl.scrollWidth;
    canvas.height = appEl.scrollHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
  }, []);

  const getCoords = (e) => {
    return {
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
    };
  };

  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}
