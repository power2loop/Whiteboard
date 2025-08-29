import { useEffect, useCallback, useState } from 'react';

const useCanvasEvents = (
    canvasRef,
    selectedTool,
    shapes,
    drawing,
    selection,
    eraser,
    panning,
    onToolChange,
    isPointInElement,
    saveToHistory,
    setShapes,
    setTextInput,
    setImageToPlace,
    imageToPlace,
    selectedColor,
    strokeWidth,
    opacity,
    fileInputRef,
    handlePasteFromClipboard,
    setLoadedImages // Add this missing parameter
) => {
    const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

    // Get relative coordinates helper
    const getRelativeCoords = useCallback((e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return panning.getRelativeCoords(e, rect);
    }, [canvasRef, panning]);

    // Interpolate points helper
    const interpolatePoints = useCallback((p1, p2, spacing = 2) => {
        const points = [];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const steps = Math.floor(dist / spacing);
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            points.push({
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t,
            });
        }
        return points;
    }, []);

    // Shape intersects eraser helper
    const shapeIntersectsEraser = useCallback((shape, eraserPts) => {
        const ERASER_RADIUS = 2;
        const pointNearLine = (point, start, end, threshold) => {
            const A = point.x - start.x, B = point.y - start.y;
            const C = end.x - start.x, D = end.y - start.y;
            const dot = A * C + B * D, len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) param = dot / len_sq;
            let xx, yy;
            if (param < 0) { xx = start.x; yy = start.y; }
            else if (param > 1) { xx = end.x; yy = end.y; }
            else { xx = start.x + param * C; yy = start.y + param * D; }
            const dx = point.x - xx, dy = point.y - yy;
            return dx * dx + dy * dy <= threshold * threshold;
        };

        if (shape.tool === "pen" || shape.tool === "laser") {
            const points = shape.points;
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                for (const ep of eraserPts) {
                    if (pointNearLine(ep, p1, p2, ERASER_RADIUS)) return true;
                }
            }
            return false;
        } else if (shape.tool === "text") {
            return eraserPts.some(ep => {
                const dx = ep.x - shape.x;
                const dy = ep.y - shape.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= ERASER_RADIUS * 15;
            });
        } else if (shape.tool === "image") {
            return eraserPts.some(ep => {
                return ep.x >= shape.x && ep.x <= shape.x + shape.width &&
                    ep.y >= shape.y && ep.y <= shape.y + shape.height;
            });
        }
        return eraserPts.some(ep => isPointInElement(ep, shape));
    }, [isPointInElement]);

    // Mouse down handler
    const handleMouseDown = useCallback((e) => {
        const point = getRelativeCoords(e);

        // Handle panning with hand tool
        if (selectedTool === "hand") {
            panning.startPanning(e);
            return;
        }

        // Handle image placement
        if (selectedTool === "image") {
            if (imageToPlace) {
                saveToHistory(shapes);

                const imageId = `img_${Date.now()}_${Math.random()}`;
                const img = new Image();
                img.onload = () => {
                    setLoadedImages(prev => new Map(prev.set(imageId, img)));
                };
                img.src = imageToPlace.src;

                setShapes(prev => [...prev, {
                    tool: "image",
                    id: imageId,
                    x: point.x - imageToPlace.width / 2,
                    y: point.y - imageToPlace.height / 2,
                    width: imageToPlace.width,
                    height: imageToPlace.height,
                    src: imageToPlace.src,
                    opacity: opacity / 100
                }]);

                setImageToPlace(null);
                if (onToolChange) {
                    onToolChange("select");
                }
                return;
            } else {
                fileInputRef.current?.click();
                return;
            }
        }

        // Handle selection tool
        if (selectedTool === "select") {
            let clickedElementIndex = -1;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (isPointInElement(point, shapes[i])) {
                    clickedElementIndex = i;
                    break;
                }
            }

            if (clickedElementIndex !== -1) {
                if (selection.isElementSelected(clickedElementIndex)) {
                    return;
                }
                selection.selectElement(clickedElementIndex, e.ctrlKey || e.metaKey);
            } else {
                if (!e.ctrlKey && !e.metaKey) {
                    selection.clearSelection();
                }
                selection.startSelection(point);
            }
            return;
        }

        if (selectedTool === "text") {
            const fontSize = Math.max(strokeWidth * 8, 16);

            setTextInput({
                show: true,
                x: point.x,
                y: point.y,
                value: "",
                fontSize: fontSize
            });

            setTimeout(() => {
                const textAreaRef = document.querySelector('.whiteboard-text-input');
                if (textAreaRef) {
                    textAreaRef.focus();
                }
            }, 10);
            return;
        }

        // Clear selection when starting to draw
        if (selectedTool !== "select" && selectedTool !== "image") {
            selection.clearSelection();
        }

        // Handle drawing tools
        if (drawing.isDrawingTool()) {
            saveToHistory(shapes);
            drawing.startDrawing(point);
        } else if (selectedTool === "eraser") {
            eraser.startErasing(point);
        }
    }, [selectedTool, getRelativeCoords, panning, imageToPlace, shapes, selection, drawing, eraser, isPointInElement, saveToHistory, setShapes, setImageToPlace, onToolChange, strokeWidth, setTextInput, opacity, fileInputRef, setLoadedImages]); // Add setLoadedImages to dependency

    // Mouse move handler
    const handleMouseMove = useCallback((e) => {
        // Handle panning
        if (panning.isPanning && selectedTool === "hand") {
            panning.updatePanning(e);
            return;
        }

        const point = getRelativeCoords(e);

        // Handle selection box
        if (selection.isSelecting && selectedTool === "select") {
            selection.updateSelection(point, selection.selectionBox);
            return;
        }

        // Handle drawing
        if (drawing.isDrawingTool()) {
            drawing.updateDrawing(point);
        } else if (selectedTool === "eraser" && eraser.isErasing) {
            eraser.updateErasing(point, interpolatePoints, shapeIntersectsEraser);
        }
    }, [panning, selectedTool, getRelativeCoords, selection, drawing, eraser, interpolatePoints, shapeIntersectsEraser]);

    // Mouse up handler
    const handleMouseUp = useCallback(() => {
        // Stop panning
        panning.stopPanning();

        // Handle selection completion
        if (selection.isSelecting && selectedTool === "select") {
            selection.finishSelection();
            return;
        }

        // Handle drawing completion
        if (drawing.isDrawingTool()) {
            drawing.finishDrawing(setShapes);
        } else if (selectedTool === "eraser" && eraser.isErasing) {
            eraser.finishErasing();
        }
    }, [panning, selection, selectedTool, drawing, eraser, setShapes]);

    // Cursor move handler (tracks mouse position)
    const handleCursorMove = useCallback((e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        handleMouseMove(e);
    }, [canvasRef, handleMouseMove]);

    // Keyboard shortcuts handler
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            selection.clearSelection();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selection.selectAll();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            handlePasteFromClipboard();
        }
    }, [selection, handlePasteFromClipboard]);

    // Set up keyboard event listeners
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Cursor styles handler
    const updateCursorStyle = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (selectedTool === "pen") {
            canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"><path d=\"M15.4998 5.49994L18.3282 8.32837M3 20.9997L3.04745 20.6675C3.21536 19.4922 3.29932 18.9045 3.49029 18.3558C3.65975 17.8689 3.89124 17.4059 4.17906 16.9783C4.50341 16.4963 4.92319 16.0765 5.76274 15.237L17.4107 3.58896C18.1918 2.80791 19.4581 2.80791 20.2392 3.58896C21.0202 4.37001 21.0202 5.63634 20.2392 6.41739L8.37744 18.2791C7.61579 19.0408 7.23497 19.4216 6.8012 19.7244C6.41618 19.9932 6.00093 20.2159 5.56398 20.3879C5.07171 20.5817 4.54375 20.6882 3.48793 20.9012L3 20.9997Z\"/></svg>') 0 20, auto";
        } else if (selectedTool === "eraser") {
            canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"/></svg>') 8 8, auto";
        } else if (selectedTool === "laser") {
            canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" width=\"24\" height=\"24\" viewBox=\"0 0 6.827 6.827\" style=\"shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd\"><defs><style>.fil3{fill:%23414141;fill-rule:nonzero}</style></defs><g id=\"Layer_x0020_1\"><path d=\"m2.897 3.462-.5-.549.079-.071-.08.071a.107.107 0 0 1 .016-.157l.309-.28.071.08-.071-.08a.107.107 0 0 1 .157.016l.503.557-.482.412-.002.001z\" style=\"fill:%23959595;fill-rule:nonzero\"/><path d=\"m4.625 5.377-1.73-1.913.002-.002.484-.413L5.1 4.948l-.474.43z\" style=\"fill:%23676767;fill-rule:nonzero\"/><path d=\"m5.575 5.648-.31.279-.07-.079.07.08a.107.107 0 0 1-.156-.016l-.484-.535.474-.43.49.544-.078.071.079-.071a.107.107 0 0 1-.015.157z\" style=\"fill:%232f2f2f;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M3.27 1.342a.807.807 0 0 1-.295.293.808.808 0 0 1 .294.293.808.808 0 0 1 .294-.293.808.808 0 0 1-.294-.293z\"/><path d=\"M3.27 2.358c-.105-.352-.464-.708-.693-.708.357-.137.575-.429.692-.778.117.35.335.64.692.778-.229 0-.587.356-.692.708z\" style=\"fill:%23bcbcbc;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.788 1.858a.582.582 0 0 1-.212.21.582.582 0 0 1 .212.212A.582.582 0 0 1 2 2.069a.582.582 0 0 1-.212-.211z\"/><path d=\"M1.788 2.59c-.076-.254-.334-.51-.499-.51.257-.1.414-.31.499-.561.084.252.241.462.498.56-.165 0-.423.257-.498.51z\" style=\"fill:%23a0a0a0;fill-rule:nonzero\"/><path class=\"fil3\" d=\"M1.555 3.314a.404.404 0 0 1-.147.146.404.404 0 0 1 .147.147.404.404 0 0 1 .147-.147.404.404 0 0 1-.147-.146z\"/><path d=\"M1.555 3.822c-.052-.176-.231-.355-.346-.355a.594.594 0 0 0 .346-.389c.059.175.168.321.346.39-.114 0-.293.178-.346.354z\" style=\"fill:%23868686;fill-rule:nonzero\"/></g><path style=\"fill:none\" d=\"M0 0h6.827v6.827H0z\"/></svg>') 3 3, auto";
        } else if (selectedTool === "text") {
            canvas.style.cursor = "text";
        } else if (selectedTool === "hand") {
            canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"black\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17.2607 12.4008C19.3774 11.2626 20.4357 10.6935 20.7035 10.0084C20.9359 9.41393 20.8705 8.74423 20.5276 8.20587C20.1324 7.58551 18.984 7.23176 16.6872 6.52425L8.00612 3.85014C6.06819 3.25318 5.09923 2.95471 4.45846 3.19669C3.90068 3.40733 3.46597 3.85584 3.27285 4.41993C3.051 5.06794 3.3796 6.02711 4.03681 7.94545L6.94793 16.4429C7.75632 18.8025 8.16052 19.9824 8.80519 20.3574C9.36428 20.6826 10.0461 20.7174 10.6354 20.4507C11.3149 20.1432 11.837 19.0106 12.8813 16.7454L13.6528 15.0719C13.819 14.7113 13.9021 14.531 14.0159 14.3736C14.1168 14.2338 14.2354 14.1078 14.3686 13.9984C14.5188 13.8752 14.6936 13.7812 15.0433 13.5932L17.2607 12.4008Z\"/></svg>') 10 10, auto";
        } else if (selectedTool === "select") {
            canvas.style.cursor = "default";
        } else {
            canvas.style.cursor = "crosshair";
        }
    }, [selectedTool, canvasRef]);

    // Update cursor style when tool changes
    useEffect(() => {
        updateCursorStyle();
    }, [selectedTool, updateCursorStyle]);

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleCursorMove,
        handleKeyDown,
        getRelativeCoords,
        interpolatePoints,
        shapeIntersectsEraser,
        mousePos,
        updateCursorStyle
    };
};

export default useCanvasEvents;
