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

    // Update eraser path and check for intersections - FIXED VERSION
    const updateErasing = useCallback((point, interpolatePoints, shapeIntersectsEraser) => {
        // Use functional state update to get latest eraserPath
        setEraserPath(prev => {
            if (prev.length === 0) return [point];
            const lastPoint = prev[prev.length - 1];
            const newPoints = interpolatePoints(lastPoint, point);
            const newPath = [...prev, ...newPoints, point];

            // Calculate intersections with the most up-to-date path
            const newMarkedIds = shapes
                .map((shape, idx) => ({ shape, idx }))
                .filter(({ shape }) => shapeIntersectsEraser(shape, newPath))
                .map(({ idx }) => idx);

            // Update marked IDs immediately with the new path
            setMarkedIds(newMarkedIds);

            return newPath;
        });
    }, [shapes]); // Removed eraserPath from dependencies to avoid stale closures

    // Complete erasing operation
    const finishErasing = useCallback(() => {
        if (markedIds.length > 0) {
            saveToHistory(shapes);
            setShapes(prevShapes => prevShapes.filter((_, i) => !markedIds.includes(i)));
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
