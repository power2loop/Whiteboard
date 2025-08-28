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
            setSelectedElements(prev => [...prev, index]);
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
        if (selectionBox) {
            const elementsInBox = getElementsInSelectionBox(selectionBox);
            if (elementsInBox.length > 0) {
                setSelectedElements(prev => {
                    const newSelection = [...new Set([...prev, ...elementsInBox])];
                    return newSelection;
                });
            }
        }
        setIsSelecting(false);
        setSelectionBox(null);
    }, [selectionBox]);

    // Get all elements within selection box
    const getElementsInSelectionBox = useCallback((box) => {
        if (!box) return [];

        const selectedIndices = [];

        shapes.forEach((shape, index) => {
            let isSelected = false;

            if (shape.tool === "pen" || shape.tool === "laser") {
                // Check if any point of the stroke is within selection box
                isSelected = shape.points.some(point =>
                    point.x >= box.x && point.x <= box.x + box.width &&
                    point.y >= box.y && point.y <= box.y + box.height
                );
            } else if (shape.tool === "text") {
                isSelected = shape.x >= box.x && shape.x <= box.x + box.width &&
                    shape.y >= box.y && shape.y <= box.y + box.height;
            } else if (shape.tool === "image") {
                isSelected = !(shape.x + shape.width < box.x || shape.x > box.x + box.width ||
                    shape.y + shape.height < box.y || shape.y > box.y + box.height);
            } else {
                // Shape tools - check if start or end point is within selection
                isSelected = (shape.start.x >= box.x && shape.start.x <= box.x + box.width &&
                    shape.start.y >= box.y && shape.start.y <= box.y + box.height) ||
                    (shape.end.x >= box.x && shape.end.x <= box.x + box.width &&
                        shape.end.y >= box.y && shape.end.y <= box.y + box.height);
            }

            if (isSelected) {
                selectedIndices.push(index);
            }
        });

        return selectedIndices;
    }, [shapes]);

    // Select all elements
    const selectAll = useCallback(() => {
        setSelectedElements(shapes.map((_, index) => index));
    }, [shapes]);

    // Reset all selection states (useful for tool changes)
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
        setSelectedElements
    };
}
