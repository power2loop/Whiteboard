import { useState, useCallback, useRef } from 'react';

const SHAPE_TOOLS = ["square", "diamond", "circle", "arrow", "line", "rectangle"];

export default function useCanvasDrawing(selectedTool, selectedColor, strokeWidth, strokeStyle, backgroundColor, opacity) {
    const [isDrawing, setIsDrawing] = useState(false);
    const [penPoints, setPenPoints] = useState([]);
    const [laserPoints, setLaserPoints] = useState([]);
    const [startPoint, setStartPoint] = useState(null);
    const [currentPoint, setCurrentPoint] = useState(null);
    const currentStrokeId = useRef(null);

    const startDrawing = useCallback((point) => {
        setIsDrawing(true);

        if (selectedTool === "pen") {
            currentStrokeId.current = Date.now() + Math.random();
            setPenPoints([point]);
        } else if (selectedTool === "laser") {
            setLaserPoints([point]);
        } else if (SHAPE_TOOLS.includes(selectedTool)) {
            setStartPoint(point);
            setCurrentPoint(point);
        }
    }, [selectedTool]);

    const addPoint = useCallback((point) => {
        if (selectedTool === "pen") {
            setPenPoints(ps => [...ps, point]);
        }
    }, [selectedTool]);

    const updateDrawing = useCallback((point) => {
        if (!isDrawing) return;

        if (selectedTool === "pen") {
            // Don't add to penPoints here - let the canvas handler do it
            // This prevents double updates
        } else if (selectedTool === "laser") {
            setLaserPoints(ls => [...ls, point]);
        } else if (SHAPE_TOOLS.includes(selectedTool)) {
            setCurrentPoint(point);
        }
    }, [isDrawing, selectedTool]);

    const resetPenPoints = useCallback(() => {
        setPenPoints([]);
        currentStrokeId.current = null;
    }, []);

    const resetDrawing = useCallback(() => {
        setIsDrawing(false);
        setPenPoints([]);
        setLaserPoints([]);
        setStartPoint(null);
        setCurrentPoint(null);
        currentStrokeId.current = null;
    }, []);

    const isDrawingTool = useCallback(() => {
        return selectedTool === "pen" || selectedTool === "laser" || SHAPE_TOOLS.includes(selectedTool);
    }, [selectedTool]);

    return {
        isDrawing,
        penPoints,
        laserPoints,
        startPoint,
        currentPoint,
        currentStrokeId: currentStrokeId.current,
        startDrawing,
        addPoint,
        updateDrawing,
        resetPenPoints,
        resetDrawing,
        isDrawingTool,
        setIsDrawing,
        setPenPoints,
        setLaserPoints,
        setStartPoint,
        setCurrentPoint
    };
}
