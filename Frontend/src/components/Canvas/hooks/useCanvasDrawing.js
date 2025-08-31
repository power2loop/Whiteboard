import { useState, useCallback } from 'react';

const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line", "rectangle"];

export default function useCanvasDrawing(selectedTool, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [penPoints, setPenPoints] = useState([]);
  const [laserPoints, setLaserPoints] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);

  // Start drawing for any tool
  const startDrawing = useCallback((point) => {
    setIsDrawing(true);
    if (selectedTool === "pen") {
      setPenPoints([point]);
    } else if (selectedTool === "laser") {
      setLaserPoints([point]);
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      setStartPoint(point);
      setCurrentPoint(point);
    }
  }, [selectedTool]);

  // Update drawing while mouse is moving
  const updateDrawing = useCallback((point) => {
    if (!isDrawing) return;
    
    if (selectedTool === "pen") {
      setPenPoints(ps => [...ps, point]);
    } else if (selectedTool === "laser") {
      setLaserPoints(ls => [...ls, point]);
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      setCurrentPoint(point);
    }
  }, [isDrawing, selectedTool]);

  // Finish drawing and create shape
  const finishDrawing = useCallback((setShapes) => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (selectedTool === "pen" && penPoints.length > 0) {
      const newShape = {
        tool: "pen",
        points: penPoints,
        color: selectedColor,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100,
        id: `pen_${Date.now()}_${Math.random()}`
      };
      
      setShapes(prev => {
        const newShapes = [...prev, newShape];
        console.log('✏️ Pen stroke completed, total shapes:', newShapes.length);
        return newShapes;
      });
      setPenPoints([]);
      
    } else if (selectedTool === "laser" && laserPoints.length > 1) {
      const newShape = {
        tool: "laser",
        points: laserPoints,
        opacity: opacity / 100,
        expiration: Date.now() + 2000,
        color: selectedColor,
        strokeWidth,
        strokeStyle,
        id: `laser_${Date.now()}_${Math.random()}`
      };
      
      setShapes(prev => {
        const newShapes = [...prev, newShape];
        console.log('✨ Laser stroke completed, total shapes:', newShapes.length);
        return newShapes;
      });
      setLaserPoints([]);
      
    } else if (SHAPE_TOOLS.includes(selectedTool) && startPoint && currentPoint) {
      const newShape = {
        tool: selectedTool,
        start: startPoint,
        end: currentPoint,
        color: selectedColor,
        backgroundColor: backgroundColor !== "#ffffff" ? backgroundColor : null,
        strokeWidth,
        strokeStyle,
        opacity: opacity / 100,
        id: `${selectedTool}_${Date.now()}_${Math.random()}`
      };
      
      setShapes(prev => {
        const newShapes = [...prev, newShape];
        console.log(`🔷 ${selectedTool} shape completed, total shapes:`, newShapes.length);
        return newShapes;
      });
    }

    // Reset drawing states
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isDrawing, selectedTool, penPoints, laserPoints, startPoint, currentPoint, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity]);

  // Check if current tool is a drawing tool
  const isDrawingTool = useCallback(() => {
    return selectedTool === "pen" || selectedTool === "laser" || SHAPE_TOOLS.includes(selectedTool);
  }, [selectedTool]);

  // Reset all drawing states (useful for tool changes)
  const resetDrawing = useCallback(() => {
    setIsDrawing(false);
    setPenPoints([]);
    setLaserPoints([]);
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  return {
    // States
    isDrawing,
    penPoints,
    laserPoints,
    startPoint,
    currentPoint,
    // Functions
    startDrawing,
    updateDrawing,
    finishDrawing,
    isDrawingTool,
    resetDrawing
  };
}
