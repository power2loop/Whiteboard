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
            return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"><path d=\"M15.4998 5.49994L18.3282 8.32837M3 20.9997L3.04745 20.6675C3.21536 19.4922 3.29932 18.9045 3.49029 18.3558C3.65975 17.8689 3.89124 17.4059 4.17906 16.9783C4.50341 16.4963 4.92319 16.0765 5.76274 15.237L17.4107 3.58896C18.1918 2.80791 19.4581 2.80791 20.2392 3.58896C21.0202 4.37001 21.0202 5.63634 20.2392 6.41739L8.37744 18.2791C7.61579 19.0408 7.23497 19.4216 6.8012 19.7244C6.41618 19.9932 6.00093 20.2159 5.56398 20.3879C5.07171 20.5817 4.54375 20.6882 3.48793 20.9012L3 20.9997Z\"/></svg>') 0 20, auto";
            
        case 'eraser':
            return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"/></svg>') 8 8, auto";
            
        case 'laser':
            return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" width=\"24\" height=\"24\" viewBox=\"0 0 6.827 6.827\" style=\"shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd\"><defs><style>.fil3{fill:%23414141;fill-rule:nonzero}</style></defs><g id=\"Layer_x0020_1\"><path d=\"m2.897 3.462-.5-.549.079-.071-.08.071a.107.107 0 0 1 .016-.157l.309-.28.071.08-.071-.08a.107.107 0 0 1 .157.016l.503.557-.482.412-.002.001z\" style=\"fill:%23959595;fill-rule:nonzero\"/><path d=\"m4.625 5.377-1.73-1.913.002-.002.484-.413L5.1 4.948l-.474.43z\" style=\"fill:%23676767;fill-rule:nonzero\"/><path d=\"m5.575 5.648-.31.279-.07-.079.07.08a.107.107 0 0 1-.156-.016l-.484-.535.474-.43.49.544-.078.071.079-.071a.107.107 0 0 1-.015.157z\" style=\"fill:%232f2f2f;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M3.27 1.342a.807.807 0 0 1-.295.293.808.808 0 0 1 .294.293.808.808 0 0 1 .294-.293.808.808 0 0 1-.294-.293z\"/><path d=\"M3.27 2.358c-.105-.352-.464-.708-.693-.708.357-.137.575-.429.692-.778.117.35.335.64.692.778-.229 0-.587.356-.692.708z\" style=\"fill:%23bcbcbc;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.788 1.858a.582.582 0 0 1-.212.21.582.582 0 0 1 .212.212A.582.582 0 0 1 2 2.069a.582.582 0 0 1-.212-.211z\"/><path d=\"M1.788 2.59c-.076-.254-.334-.51-.499-.51.257-.1.414-.31.499-.561.084.252.241.462.498.56-.165 0-.423.257-.498.51z\" style=\"fill:%23a0a0a0;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.555 3.314a.404.404 0 0 1-.147.146.404.404 0 0 1 .147.147.404.404 0 0 1 .147-.147.404.404 0 0 1-.147-.146z\"/><path d=\"M1.555 3.822c-.052-.176-.231-.355-.346-.355a.594.594 0 0 0 .346-.389c.059.175.168.321.346.39-.114 0-.293.178-.346.354z\" style=\"fill:%23868686;fill-rule:nonzero\"/></g><path style=\"fill:none\" d=\"M0 0h6.827v6.827H0z\"/></svg>') 3 3, auto";
            
        case 'text':
            return 'text';
            
        case 'hand':
            return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z\"/></svg>') 10 10, auto";
            
        case 'select':
        case 'pan':
            return 'default';
            
        case 'image':
            return imageToPlace ? 'none' : 'default';
            
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
