// useCanvasSelection.js - Fixed version with proper function ordering
import { useState, useCallback } from 'react';

export default function useCanvasSelection(shapes) {
    const [selectionStartPoint, setSelectionStartPoint] = useState(null);
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

    // Improved element bounds checking
const getElementBounds = useCallback((shape) => {
    // Helper function to calculate square bounds
    const calculateSquareBounds = (start, end) => {
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        const side = Math.max(Math.abs(deltaX), Math.abs(deltaY));
        
        const width = side * Math.sign(deltaX || 1);
        const height = side * Math.sign(deltaY || 1);
        
        const x = width >= 0 ? start.x : start.x + width;
        const y = height >= 0 ? start.y : start.y + height;
        
        return { x, y, width: Math.abs(width), height: Math.abs(height) };
    };

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
    } else if (shape.tool === "square") {
        return calculateSquareBounds(shape.start, shape.end);
    } else {
        return {
            x: Math.min(shape.start.x, shape.end.x),
            y: Math.min(shape.start.y, shape.end.y),
            width: Math.abs(shape.end.x - shape.start.x),
            height: Math.abs(shape.end.y - shape.start.y)
        };
    }
}, []);


// Update the getElementsInSelectionBox function
const getElementsInSelectionBox = useCallback((box) => {
    if (!box || box.width < 1 || box.height < 1) return [];

    // Helper function to calculate square bounds
    const calculateSquareBounds = (start, end) => {
        const deltaX = end.x - start.x;
        const deltaY = end.y - start.y;
        const side = Math.max(Math.abs(deltaX), Math.abs(deltaY));
        
        const width = side * Math.sign(deltaX || 1);
        const height = side * Math.sign(deltaY || 1);
        
        const x = width >= 0 ? start.x : start.x + width;
        const y = height >= 0 ? start.y : start.y + height;
        
        return { x, y, width: Math.abs(width), height: Math.abs(height) };
    };

    const selectedIndices = [];

    shapes.forEach((shape, index) => {
        let isSelected = false;

        if (shape.tool === "pen" || shape.tool === "laser") {
            isSelected = shape.points.some(point =>
                point.x >= box.x && point.x <= box.x + box.width &&
                point.y >= box.y && point.y <= box.y + box.height
            );
        } else if (shape.tool === "text") {
            const textWidth = shape.text.length * (shape.fontSize || 16) * 0.6;
            const textHeight = (shape.fontSize || 16) * 1.2;
            
            isSelected = !(
                shape.x + textWidth < box.x || 
                shape.x > box.x + box.width ||
                shape.y + textHeight < box.y || 
                shape.y > box.y + box.height
            );
        } else if (shape.tool === "image") {
            isSelected = !(
                shape.x + shape.width < box.x || 
                shape.x > box.x + box.width ||
                shape.y + shape.height < box.y || 
                shape.y > box.y + box.height
            );
        } else if (shape.tool === "square") {
            const shapeBounds = calculateSquareBounds(shape.start, shape.end);
            isSelected = !(
                shapeBounds.x + shapeBounds.width < box.x || 
                shapeBounds.x > box.x + box.width ||
                shapeBounds.y + shapeBounds.height < box.y || 
                shapeBounds.y > box.y + box.height
            );
        } else {
            const shapeBounds = {
                x: Math.min(shape.start.x, shape.end.x),
                y: Math.min(shape.start.y, shape.end.y),
                width: Math.abs(shape.end.x - shape.start.x),
                height: Math.abs(shape.end.y - shape.start.y)
            };

            isSelected = !(
                shapeBounds.x + shapeBounds.width < box.x || 
                shapeBounds.x > box.x + box.width ||
                shapeBounds.y + shapeBounds.height < box.y || 
                shapeBounds.y > box.y + box.height
            );
        }

        if (isSelected) {
            selectedIndices.push(index);
        }
    });

    return selectedIndices;
}, [shapes]);



    // Start selection box drawing
    const startSelection = useCallback((point) => {
        setIsSelecting(true);
        setSelectionStartPoint(point);
        setSelectionBox({ x: point.x, y: point.y, width: 0, height: 0 });
    }, []);

    // Update the updateSelection function
    const updateSelection = useCallback((point, startPoint) => {
        if (!isSelecting || !startPoint) return;

        // Always create selection box from top-left to bottom-right
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
        setSelectionStartPoint(null);
    }, [selectionBox, getElementsInSelectionBox]);

    // Select all elements
    const selectAll = useCallback(() => {
        setSelectedElements(shapes.map((_, index) => index));
    }, [shapes]);

    // Reset all selection states
    const resetSelection = useCallback(() => {
        setSelectedElements([]);
        setSelectionBox(null);
        setIsSelecting(false);
        setSelectionStartPoint(null);
    }, []);

    return {
        // States
        selectedElements,
        selectionBox,
        isSelecting,
        selectionStartPoint,

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
