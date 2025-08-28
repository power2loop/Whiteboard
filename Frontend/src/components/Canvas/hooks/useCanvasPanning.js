import { useState, useCallback } from 'react';

export default function useCanvasPanning() {
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

    // Start panning operation
    const startPanning = useCallback((e) => {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
    }, []);

    // Update pan position while dragging
    const updatePanning = useCallback((e) => {
        if (!isPanning) return;

        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;

        setPanOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
        }));

        setLastPanPoint({ x: e.clientX, y: e.clientY });
    }, [isPanning, lastPanPoint]);

    // Stop panning operation
    const stopPanning = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Reset pan to center
    const resetPan = useCallback(() => {
        setPanOffset({ x: 0, y: 0 });
        setIsPanning(false);
    }, []);

    // Set pan to specific coordinates
    const setPan = useCallback((x, y) => {
        setPanOffset({ x, y });
    }, []);

    // Get relative coordinates adjusted for pan offset
    const getRelativeCoords = useCallback((e, canvasRect) => {
        const x = e.clientX - canvasRect.left - panOffset.x;
        const y = e.clientY - canvasRect.top - panOffset.y;
        return { x, y };
    }, [panOffset]);

    return {
        // States
        panOffset,
        isPanning,

        // Functions
        startPanning,
        updatePanning,
        stopPanning,
        resetPan,
        setPan,
        getRelativeCoords
    };
}
