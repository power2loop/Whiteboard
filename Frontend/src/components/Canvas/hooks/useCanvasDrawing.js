import { useState, useCallback } from 'react';

const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line", "rectangle"];

export default function useCanvasDrawing(
  selectedTool, 
  selectedColor, 
  strokeWidth, 
  strokeStyle, 
  backgroundColor, 
  opacity,
  // Add collaboration callbacks
  onDrawingStart,
  onDrawingUpdate, 
  onDrawingEnd,
  isCollaborating = false
) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [penPoints, setPenPoints] = useState([]);
  const [laserPoints, setLaserPoints] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);

  // Start drawing for any tool
  const startDrawing = useCallback((point) => {
    console.log('🎨 Starting drawing:', selectedTool, point);
    setIsDrawing(true);
    
    // Emit drawing start for collaboration FIRST
    if (isCollaborating && onDrawingStart) {
      console.log('📤 Calling onDrawingStart callback');
      onDrawingStart({
        tool: selectedTool,
        point,
        color: selectedColor,
        strokeWidth,
        opacity: opacity / 100
      });
    }
    
    if (selectedTool === "pen") {
      setPenPoints([point]);
    } else if (selectedTool === "laser") {
      setLaserPoints([point]);
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      setStartPoint(point);
      setCurrentPoint(point);
    }
  }, [selectedTool, isCollaborating, onDrawingStart, selectedColor, strokeWidth, opacity]);

  // Update drawing while mouse is moving
  const updateDrawing = useCallback((point) => {
    if (!isDrawing) return;
    
    if (selectedTool === "pen") {
      setPenPoints(ps => {
        const newPoints = [...ps, point];
        // Emit drawing update for collaboration
        if (isCollaborating && onDrawingUpdate) {
          onDrawingUpdate({
            tool: selectedTool,
            point,
            points: newPoints
          });
        }
        return newPoints;
      });
    } else if (selectedTool === "laser") {
      setLaserPoints(ls => {
        const newPoints = [...ls, point];
        // Emit drawing update for collaboration
        if (isCollaborating && onDrawingUpdate) {
          onDrawingUpdate({
            tool: selectedTool,
            point,
            points: newPoints
          });
        }
        return newPoints;
      });
    } else if (SHAPE_TOOLS.includes(selectedTool)) {
      setCurrentPoint(point);
      // Emit drawing update for collaboration
      if (isCollaborating && onDrawingUpdate) {
        onDrawingUpdate({
          tool: selectedTool,
          startPoint,
          currentPoint: point
        });
      }
    }
  }, [isDrawing, selectedTool, startPoint, isCollaborating, onDrawingUpdate]);

  // Finish drawing and create shape
  const finishDrawing = useCallback((setShapes) => {
    if (!isDrawing) return;

    console.log('🎨 Finishing drawing:', selectedTool);
    setIsDrawing(false);

    let newShape = null;

    if (selectedTool === "pen" && penPoints.length > 0) {
      newShape = {
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
      newShape = {
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
      newShape = {
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

    // Emit drawing end for collaboration
    if (isCollaborating && onDrawingEnd && newShape) {
      console.log('📤 Calling onDrawingEnd callback');
      onDrawingEnd({
        tool: selectedTool,
        shape: newShape
      });
    }

    // Reset drawing states
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isDrawing, selectedTool, penPoints, laserPoints, startPoint, currentPoint, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity, isCollaborating, onDrawingEnd]);

  const isDrawingTool = useCallback(() => {
    return selectedTool === "pen" || selectedTool === "laser" || SHAPE_TOOLS.includes(selectedTool);
  }, [selectedTool]);

  const resetDrawing = useCallback(() => {
    setIsDrawing(false);
    setPenPoints([]);
    setLaserPoints([]);
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  return {
    isDrawing,
    penPoints,
    laserPoints,
    startPoint,
    currentPoint,
    startDrawing,
    updateDrawing,
    finishDrawing,
    isDrawingTool,
    resetDrawing
  };
}
