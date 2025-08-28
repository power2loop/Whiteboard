import { useState, useCallback } from 'react';

const ERASER_RADIUS = 2;

export default function useCanvasEraser(shapes, setShapes, saveToHistory) {
    const [eraserPath, setEraserPath] = useState([]);
    const [markedIds, setMarkedIds] = useState([]);

    // Start erasing at a point
    const startErasing = useCallback((point) => {
        setEraserPath([point]);
        setMarkedIds([]);
    }, []);

    // Update eraser path and check for intersections
    const updateErasing = useCallback((point, interpolatePoints, shapeIntersectsEraser) => {
        setEraserPath(prev => {
            if (prev.length === 0) return [point];
            const lastPoint = prev[prev.length - 1];
            const newPoints = interpolatePoints(lastPoint, point);
            return [...prev, ...newPoints, point];
        });

        // Calculate which shapes intersect with current eraser path
        const eraserPointsForCheck = [...eraserPath, point];
        const newMarkedIds = shapes
            .map((shape, idx) => ({ shape, idx }))
            .filter(({ shape }) => shapeIntersectsEraser(shape, eraserPointsForCheck))
            .map(({ idx }) => idx);

        setMarkedIds(newMarkedIds);
    }, [eraserPath, shapes]);

    // Complete erasing operation
    const finishErasing = useCallback(() => {
        if (markedIds.length > 0) {
            saveToHistory(shapes);
            setShapes(shapes.filter((_, i) => !markedIds.includes(i)));
        }
        setMarkedIds([]);
        setEraserPath([]);
    }, [markedIds, shapes, saveToHistory, setShapes]);

    // Check if currently erasing
    const isErasing = eraserPath.length > 0;

    // Reset eraser states (useful for tool changes)
    const resetEraser = useCallback(() => {
        setEraserPath([]);
        setMarkedIds([]);
    }, []);

    // Get current eraser radius
    const getEraserRadius = useCallback(() => ERASER_RADIUS, []);

    return {
        // States
        eraserPath,
        markedIds,
        isErasing,

        // Functions
        startErasing,
        updateErasing,
        finishErasing,
        resetEraser,
        getEraserRadius
    };
}
