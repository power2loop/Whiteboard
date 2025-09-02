import { useState, useCallback } from 'react';

const ERASER_RADIUS = 2;

export default function useCanvasEraser(shapes, setShapes, saveToHistory, socket, roomId) {
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

    // Complete erasing operation - ENHANCED FOR COLLABORATION
    const finishErasing = useCallback(() => {
        if (markedIds.length > 0) {
            saveToHistory(shapes);

            // Get the shapes to be deleted before filtering
            const shapesToDelete = markedIds.map(idx => shapes[idx]).filter(Boolean);
            const updatedShapes = shapes.filter((_, i) => !markedIds.includes(i));

            // Update local state
            setShapes(updatedShapes);

            // Emit eraser operation to other users in the room
            if (socket && roomId) {
                socket.emit('shapes-erased', {
                    roomId,
                    deletedIndices: markedIds,
                    deletedShapes: shapesToDelete,
                    updatedShapes: updatedShapes,
                    timestamp: Date.now()
                });
            }
        }
        setMarkedIds([]);
        setEraserPath([]);
    }, [markedIds, shapes, saveToHistory, setShapes, socket, roomId]);

    // Handle incoming eraser operations from other users
    const handleRemoteErase = useCallback((data) => {
        if (data.roomId === roomId) {
            // Save current state to history before applying remote changes
            saveToHistory(shapes);

            // Apply the updated shapes from remote user
            setShapes(data.updatedShapes);
        }
    }, [roomId, shapes, saveToHistory, setShapes]);

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
        getEraserRadius,
        handleRemoteErase // New function for handling remote eraser operations
    };
}
