import React, { useRef, useState, useEffect } from "react";
import "./DrawCanvas.css"; // import CSS file

export default function DrawCanvas() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 600;
    canvas.height = 400;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineWidth = 3;
    context.strokeStyle = "#222"; // dark gray pen
    setCtx(context);
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx.closePath();
  };

  return (
    <div className="canvas-container">
      <h2>Simple Drawing Board 🎨</h2>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
