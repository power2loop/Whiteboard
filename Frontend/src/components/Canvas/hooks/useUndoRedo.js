import { useState, useCallback, useEffect } from 'react';

export default function useUndoRedo(shapes, setShapes, onUndoFunction, onRedoFunction, onCanUndo, onCanRedo) {
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Save state to history
    const saveToHistory = useCallback((currentShapes) => {
        if (!Array.isArray(currentShapes)) return;

        const newSnapshot = JSON.parse(JSON.stringify(currentShapes));

        setHistory(prev => {
            // Remove any future history beyond current index
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newSnapshot);

            // Keep only last 50 entries
            if (newHistory.length > 50) {
                return newHistory.slice(-50);
            }
            return newHistory;
        });

        setHistoryIndex(prev => prev + 1);

        console.log(`Saved state with ${currentShapes.length} shapes`);
    }, [historyIndex]);

    // Undo function
    const undo = useCallback(() => {
        if (historyIndex < 0) return;

        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);

        if (newIndex >= 0) {
            const previousState = history[newIndex];
            setShapes(previousState);
            console.log(`Undo: Restored ${previousState.length} shapes`);
        } else {
            // Go to empty state
            setShapes([]);
            console.log('Undo: Cleared canvas');
        }
    }, [history, historyIndex, setShapes]);

    // Redo function
    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);

        const nextState = history[newIndex];
        setShapes(nextState);
        console.log(`Redo: Restored ${nextState.length} shapes`);
    }, [history, historyIndex, setShapes]);

    // Clear history
    const clearHistory = useCallback(() => {
        setHistory([]);
        setHistoryIndex(-1);
    }, []);

    // Can undo/redo
    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < history.length - 1;

    // Pass functions to parent
    useEffect(() => {
        if (onUndoFunction) onUndoFunction(undo);
        if (onRedoFunction) onRedoFunction(redo);
    }, [undo, redo, onUndoFunction, onRedoFunction]);

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
