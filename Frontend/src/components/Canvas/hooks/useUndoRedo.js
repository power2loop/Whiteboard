import { useState, useCallback } from 'react';

export default function useUndoRedo() {
    const [undoHistory, setUndoHistory] = useState([]);
    const [redoHistory, setRedoHistory] = useState([]);

    // Save current state to history
    const saveToHistory = useCallback((currentState) => {
        setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(currentState))]);
        setRedoHistory([]); // Clear redo history when new action is performed
    }, []);

    // Undo function
    const undo = useCallback((currentState, setState) => {
        if (undoHistory.length === 0) return;

        const previousState = undoHistory[undoHistory.length - 1];
        setRedoHistory(prev => [...prev, JSON.parse(JSON.stringify(currentState))]);
        setState(previousState);
        setUndoHistory(prev => prev.slice(0, -1));
    }, [undoHistory]);

    // Redo function
    const redo = useCallback((currentState, setState) => {
        if (redoHistory.length === 0) return;

        const nextState = redoHistory[redoHistory.length - 1];
        setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(currentState))]);
        setState(nextState);
        setRedoHistory(prev => prev.slice(0, -1));
    }, [redoHistory]);

    // Clear all history (useful for complete canvas clear)
    const clearHistory = useCallback(() => {
        setUndoHistory([]);
        setRedoHistory([]);
    }, []);

    // Check if undo/redo is available
    const canUndo = undoHistory.length > 0;
    const canRedo = redoHistory.length > 0;

    return {
        saveToHistory,
        undo,
        redo,
        clearHistory,
        canUndo,
        canRedo
    };
}
