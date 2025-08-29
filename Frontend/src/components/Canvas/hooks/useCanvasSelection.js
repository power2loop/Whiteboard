// useCanvasSelection.js - Updated version with better bounds checking
import { useState, useCallback } from 'react';

export default function useCanvasSelection(shapes) {
    const [selectedElements, setSelectedElements] = useState([]);
    const [selectionBox, setSelectionBox] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);

    // Clear all selections
    const clearSelection = useCallback(() => {
        setSelectedElements([]);
        setSelectionBox(null);
    }, []);

    // Select a single element or add to multi-selection
    const selectElement = useCallback((index, multiSelect = false) => {
        if (multiSelect) {
            setSelectedElements(prev => 
                prev.includes(index) ? prev : [...prev, index]
            );
        } else {
            setSelectedElements([index]);
        }
    }, []);

    // Check if an element is selected
    const isElementSelected = useCallback((index) => {
        return selectedElements.includes(index);
    }, [selectedElements]);

    // Start selection box drawing
    const startSelection = useCallback((point) => {
        setIsSelecting(true);
        setSelectionBox({ x: point.x, y: point.y, width: 0, height: 0 });
    }, []);

    // Update selection box while dragging
    const updateSelection = useCallback((point, startPoint) => {
        if (!isSelecting || !startPoint) return;

        const newSelectionBox = {
            x: Math.min(startPoint.x, point.x),
            y: Math.min(startPoint.y, point.y),
            width: Math.abs(point.x - startPoint.x),
            height: Math.abs(point.y - startPoint.y)
        };
        setSelectionBox(newSelectionBox);
    }, [isSelecting]);

    // Finish selection and select elements in box
    const finishSelection = useCallback(() => {
        if (selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
            const elementsInBox = getElementsInSelectionBox(selectionBox);
            if (elementsInBox.length > 0) {
                setSelectedElements(elementsInBox);
            }
        }
        setIsSelecting(false);
        setSelectionBox(null);
    }, [selectionBox]);

    // Improved element bounds checking
    const getElementBounds = useCallback((shape) => {
        if (shape.tool === "pen" || shape.tool === "laser") {
            const points = shape.points;
            if (points.length === 0) return null;
            
            let minX = points[0].x, maxX = points[0].x;
            let minY = points[0].y, maxY = points[0].y;
            
            points.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });
            
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        } else if (shape.tool === "text") {
            const textWidth = shape.text.length * (shape.fontSize || 16) * 0.6;
            const textHeight = (shape.fontSize || 16) * 1.2;
            return { x: shape.x, y: shape.y, width: textWidth, height: textHeight };
        } else if (shape.tool === "image") {
            return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        } else {
            // Shape tools
            return {
                x: Math.min(shape.start.x, shape.end.x),
                y: Math.min(shape.start.y, shape.end.y),
                width: Math.abs(shape.end.x - shape.start.x),
                height: Math.abs(shape.end.y - shape.start.y)
            };
        }
    }, []);

    // Get all elements within selection box with improved bounds checking
    const getElementsInSelectionBox = useCallback((box) => {
        if (!box) return [];

        const selectedIndices = [];

        shapes.forEach((shape, index) => {
            const bounds = getElementBounds(shape);
            if (!bounds) return;

            // Check if shape bounds intersect with selection box
            const intersects = !(
                bounds.x + bounds.width < box.x || 
                bounds.x > box.x + box.width ||
                bounds.y + bounds.height < box.y || 
                bounds.y > box.y + box.height
            );

            if (intersects) {
                selectedIndices.push(index);
            }
        });

        return selectedIndices;
    }, [shapes, getElementBounds]);

    // Select all elements
    const selectAll = useCallback(() => {
        setSelectedElements(shapes.map((_, index) => index));
    }, [shapes]);

    // Reset all selection states
    const resetSelection = useCallback(() => {
        setSelectedElements([]);
        setSelectionBox(null);
        setIsSelecting(false);
    }, []);

    return {
        // States
        selectedElements,
        selectionBox,
        isSelecting,

        // Functions
        clearSelection,
        selectElement,
        isElementSelected,
        startSelection,
        updateSelection,
        finishSelection,
        getElementsInSelectionBox,
        selectAll,
        resetSelection,
        setSelectedElements,
        getElementBounds
    };
}
