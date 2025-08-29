import { useState, useCallback, useRef, useEffect } from 'react';

const useCursor = (selectedTool, panOffset, imageToPlace, eraserRadius = 2) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);
    const cursorRef = useRef(null);

    // Update mouse position
    const updateMousePosition = useCallback((e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePos({ x, y });
    }, []);

    // Handle mouse enter/leave for canvas
    const handleMouseEnter = useCallback(() => {
        setIsMouseInCanvas(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsMouseInCanvas(false);
    }, []);

    // Get cursor style based on selected tool
    const getCursorStyle = useCallback(() => {
        switch (selectedTool) {
            case 'pen':
            case 'laser':
                return 'crosshair';
            case 'eraser':
                return 'none'; // We'll show custom eraser cursor
            case 'select':
                return 'default';
            case 'pan':
                return 'grab';
            case 'text':
                return 'text';
            case 'image':
                return imageToPlace ? 'none' : 'default'; // Custom cursor when placing
            case 'square':
            case 'rectangle':
            case 'circle':
            case 'diamond':
            case 'line':
            case 'arrow':
                return 'crosshair';
            default:
                return 'default';
        }
    }, [selectedTool, imageToPlace]);

    // Get adjusted cursor position accounting for panning
    const getAdjustedCursorPos = useCallback(() => {
        return {
            x: mousePos.x - panOffset.x,
            y: mousePos.y - panOffset.y
        };
    }, [mousePos, panOffset]);

    // Cursor utilities
    const hideCursor = useCallback(() => {
        const canvas = cursorRef.current;
        if (canvas) {
            canvas.style.cursor = 'none';
        }
    }, []);

    const showCursor = useCallback(() => {
        const canvas = cursorRef.current;
        if (canvas) {
            canvas.style.cursor = getCursorStyle();
        }
    }, [getCursorStyle]);

    // Update cursor style when tool changes
    useEffect(() => {
        const canvas = cursorRef.current;
        if (canvas) {
            canvas.style.cursor = getCursorStyle();
        }
    }, [getCursorStyle]);

    return {
        mousePos,
        isMouseInCanvas,
        cursorRef,
        updateMousePosition,
        handleMouseEnter,
        handleMouseLeave,
        getCursorStyle,
        getAdjustedCursorPos,
        hideCursor,
        showCursor,
        // Return render functions instead of components
        renderEraserCursor: () => {
            if (selectedTool !== 'eraser' || !isMouseInCanvas) return null;

            return {
                type: 'eraser',
                style: {
                    left: mousePos.x,
                    top: mousePos.y,
                    width: eraserRadius * 2,
                    height: eraserRadius * 2,
                    position: 'absolute',
                    border: '1px solid rgba(160,160,160,0.5)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }
            };
        },
        renderImagePlacementCursor: () => {
            if (selectedTool !== 'image' || !imageToPlace || !isMouseInCanvas) return null;

            return {
                type: 'image',
                style: {
                    position: 'absolute',
                    left: mousePos.x,
                    top: mousePos.y,
                    width: imageToPlace.width,
                    height: imageToPlace.height,
                    border: '2px dashed #3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '4px',
                }
            };
        },
        renderCrosshairCursor: () => {
            const showCrosshair = ['pen', 'laser', 'square', 'rectangle', 'circle', 'diamond', 'line', 'arrow'].includes(selectedTool);

            if (!showCrosshair || !isMouseInCanvas) return null;

            return {
                type: 'crosshair',
                style: {
                    position: 'absolute',
                    left: mousePos.x,
                    top: mousePos.y,
                    width: '20px',
                    height: '20px',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    transform: 'translate(-50%, -50%)',
                }
            };
        }
    };
};

export default useCursor;
