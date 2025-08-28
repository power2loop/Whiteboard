import { useState, useCallback, useEffect } from 'react';

export default function useUndoRedo(shapes, setShapes, onUndoFunction, onRedoFunction, onCanUndo, onCanRedo) {
    const [undoHistory, setUndoHistory] = useState([]);
    const [redoHistory, setRedoHistory] = useState([]);

    // Save current state to history
    const saveToHistory = useCallback((currentState) => {
        setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(currentState))]);
        setRedoHistory([]); // Clear redo history when new action is performed
    }, []);

    // Undo function with selection clearing callback
    const undo = useCallback((clearSelectionCallback) => {
        if (undoHistory.length === 0) return;

        const previousState = undoHistory[undoHistory.length - 1];
        setRedoHistory(prev => [...prev, JSON.parse(JSON.stringify(shapes))]);
        setShapes(previousState);
        setUndoHistory(prev => prev.slice(0, -1));

        // Clear selection when undoing
        if (clearSelectionCallback) {
            clearSelectionCallback();
        }
    }, [undoHistory, shapes, setShapes]);

    // Redo function with selection clearing callback
    const redo = useCallback((clearSelectionCallback) => {
        if (redoHistory.length === 0) return;

        const nextState = redoHistory[redoHistory.length - 1];
        setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(shapes))]);
        setShapes(nextState);
        setRedoHistory(prev => prev.slice(0, -1));

        // Clear selection when redoing
        if (clearSelectionCallback) {
            clearSelectionCallback();
        }
    }, [redoHistory, shapes, setShapes]);

    // Clear all history (useful for complete canvas clear)
    const clearHistory = useCallback(() => {
        setUndoHistory([]);
        setRedoHistory([]);
    }, []);

    // Check if undo/redo is available
    const canUndo = undoHistory.length > 0;
    const canRedo = redoHistory.length > 0;

    // Expose undo/redo functions to parent component
    useEffect(() => {
        if (onUndoFunction) {
            onUndoFunction(undo);
        }
        if (onRedoFunction) {
            onRedoFunction(redo);
        }
    }, [undo, redo, onUndoFunction, onRedoFunction]);

    // Provide undo/redo availability to parent
    useEffect(() => {
        if (onCanUndo) onCanUndo(canUndo);
        if (onCanRedo) onCanRedo(canRedo);
    }, [canUndo, canRedo, onCanUndo, onCanRedo]);

    return {
        saveToHistory,
        undo,
        redo,
        clearHistory,
        canUndo,
        canRedo
    };
}
