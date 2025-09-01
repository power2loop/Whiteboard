import { useCallback } from 'react';

const useCanvasRenderer = () => {
    const drawShape = useCallback((ctx, shape, faded = false) => {
        if (!shape) return;

        ctx.save();
        ctx.globalAlpha = faded ? 0.3 : (shape.opacity || 1);

        if (shape.tool === 'pen' || shape.tool === 'laser') {
            if (!shape.points || shape.points.length < 2) {
                ctx.restore();
                return;
            }

            ctx.strokeStyle = shape.color || '#000000';
            ctx.lineWidth = shape.strokeWidth || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (shape.tool === 'laser') {
                ctx.shadowColor = shape.color;
                ctx.shadowBlur = 10;
            }

            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
                ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();

        } else if (shape.tool === 'text') {
            ctx.fillStyle = shape.color || '#000000';
            ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || 'Arial'}`;
            ctx.textBaseline = 'top';
            const lines = shape.text.split('\n');
            const lineHeight = (shape.fontSize || 16) * 1.2;
            lines.forEach((line, index) => {
                ctx.fillText(line, shape.x, shape.y + (index * lineHeight));
            });

        } else if (shape.tool === 'image') {
            // Handle image drawing - you'll need to pass loadedImages to this function
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            ctx.strokeStyle = '#9ca3af';
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);

        } else if (['rectangle', 'square', 'circle', 'line', 'arrow', 'diamond'].includes(shape.tool)) {
            ctx.strokeStyle = shape.color || '#000000';
            ctx.lineWidth = shape.strokeWidth || 2;

            if (shape.backgroundColor && shape.backgroundColor !== '#ffffff') {
                ctx.fillStyle = shape.backgroundColor;
            }

            ctx.beginPath();

            switch (shape.tool) {
                case 'rectangle':
                    const width = shape.end.x - shape.start.x;
                    const height = shape.end.y - shape.start.y;
                    ctx.rect(shape.start.x, shape.start.y, width, height);
                    break;

                case 'square':
                    const size = Math.max(Math.abs(shape.end.x - shape.start.x), Math.abs(shape.end.y - shape.start.y));
                    ctx.rect(shape.start.x, shape.start.y, size * Math.sign(shape.end.x - shape.start.x), size * Math.sign(shape.end.y - shape.start.y));
                    break;

                case 'circle':
                    const centerX = (shape.start.x + shape.end.x) / 2;
                    const centerY = (shape.start.y + shape.end.y) / 2;
                    const radius = Math.sqrt(Math.pow(shape.end.x - shape.start.x, 2) + Math.pow(shape.end.y - shape.start.y, 2)) / 2;
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    break;

                case 'line':
                    ctx.moveTo(shape.start.x, shape.start.y);
                    ctx.lineTo(shape.end.x, shape.end.y);
                    break;

                case 'arrow':
                    ctx.moveTo(shape.start.x, shape.start.y);
                    ctx.lineTo(shape.end.x, shape.end.y);

                    // Arrow head
                    const angle = Math.atan2(shape.end.y - shape.start.y, shape.end.x - shape.start.x);
                    const headlen = 15;
                    ctx.moveTo(shape.end.x, shape.end.y);
                    ctx.lineTo(
                        shape.end.x - headlen * Math.cos(angle - Math.PI / 6),
                        shape.end.y - headlen * Math.sin(angle - Math.PI / 6)
                    );
                    ctx.moveTo(shape.end.x, shape.end.y);
                    ctx.lineTo(
                        shape.end.x - headlen * Math.cos(angle + Math.PI / 6),
                        shape.end.y - headlen * Math.sin(angle + Math.PI / 6)
                    );
                    break;

                case 'diamond':
                    const cx = (shape.start.x + shape.end.x) / 2;
                    const cy = (shape.start.y + shape.end.y) / 2;
                    const w = Math.abs(shape.end.x - shape.start.x) / 2;
                    const h = Math.abs(shape.end.y - shape.start.y) / 2;
                    ctx.moveTo(cx, cy - h);
                    ctx.lineTo(cx + w, cy);
                    ctx.lineTo(cx, cy + h);
                    ctx.lineTo(cx - w, cy);
                    ctx.closePath();
                    break;
            }

            if (shape.backgroundColor && shape.backgroundColor !== '#ffffff') {
                ctx.fill();
            }
            ctx.stroke();
        }

        ctx.restore();
    }, []);

    const drawShapePreview = useCallback((ctx, shape) => {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([5, 5]);
        drawShape(ctx, shape);
        ctx.restore();
    }, [drawShape]);

    const drawEraserPath = useCallback((ctx, points, radius) => {
        if (!points || points.length === 0) return;

        ctx.save();
        ctx.strokeStyle = "rgba(160,160,160,0.5)";
        ctx.lineWidth = radius * 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }, []);

    const drawSelection = useCallback((ctx, selectionBox) => {
        if (!selectionBox) return;

        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
        ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
        ctx.restore();
    }, []);

    // Main redraw function that renders everything
    const redraw = useCallback((canvasRef, shapes, loadedImages, panOffset, selectedElements, selectionBox, isSelecting, drawing, eraser, selectedTool, selectedColor, strokeWidth, opacity, eraserRadius, canvasBackgroundColor) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas with background color
        if (canvasBackgroundColor && canvasBackgroundColor !== 'transparent') {
            ctx.fillStyle = canvasBackgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();

        // Draw all shapes
        shapes.forEach((shape, idx) => {
            const isSelected = selectedElements && selectedElements.includes(idx);
            const isFaded = eraser && eraser.markedIds && eraser.markedIds.includes(idx);

            if (shape.tool === 'image' && loadedImages) {
                const img = loadedImages.get(shape.id);
                if (img) {
                    ctx.save();
                    ctx.globalAlpha = isFaded ? 0.3 : (shape.opacity || 1);
                    try {
                        ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
                    } catch (error) {
                        console.warn('Error drawing image:', error);
                        // Fallback to placeholder
                        ctx.fillStyle = '#e5e7eb';
                        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                        ctx.strokeStyle = '#9ca3af';
                        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                    }
                    ctx.restore();
                }
            } else {
                drawShape(ctx, shape, isFaded);
            }

            // Draw selection indicator if selected
            if (isSelected) {
                ctx.save();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);

                let bounds;
                if (shape.tool === 'pen' || shape.tool === 'laser') {
                    const points = shape.points;
                    if (points && points.length > 0) {
                        let minX = points[0].x, maxX = points[0].x;
                        let minY = points[0].y, maxY = points[0].y;
                        points.forEach(point => {
                            minX = Math.min(minX, point.x);
                            maxX = Math.max(maxX, point.x);
                            minY = Math.min(minY, point.y);
                            maxY = Math.max(maxY, point.y);
                        });
                        bounds = { x: minX - 5, y: minY - 5, width: maxX - minX + 10, height: maxY - minY + 10 };
                    }
                } else if (shape.tool === 'text') {
                    const textWidth = shape.text.length * (shape.fontSize || 16) * 0.6;
                    const textHeight = (shape.fontSize || 16) * 1.2;
                    bounds = { x: shape.x - 2, y: shape.y - 2, width: textWidth + 4, height: textHeight + 4 };
                } else if (shape.tool === 'image') {
                    bounds = { x: shape.x - 2, y: shape.y - 2, width: shape.width + 4, height: shape.height + 4 };
                } else if (shape.start && shape.end) {
                    const minX = Math.min(shape.start.x, shape.end.x) - 5;
                    const minY = Math.min(shape.start.y, shape.end.y) - 5;
                    const maxX = Math.max(shape.start.x, shape.end.x) + 5;
                    const maxY = Math.max(shape.start.y, shape.end.y) + 5;
                    bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                }

                if (bounds) {
                    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                }
                ctx.restore();
            }
        });

        // Draw current drawing preview
        if (drawing && drawing.isDrawing) {
            if (selectedTool === "pen" && drawing.penPoints && drawing.penPoints.length > 0) {
                const previewShape = {
                    tool: 'pen',
                    points: drawing.penPoints,
                    color: selectedColor,
                    strokeWidth,
                    opacity: opacity / 100
                };
                drawShape(ctx, previewShape);
            } else if (selectedTool === "laser" && drawing.laserPoints && drawing.laserPoints.length > 0) {
                const previewShape = {
                    tool: 'laser',
                    points: drawing.laserPoints,
                    color: selectedColor,
                    strokeWidth,
                    opacity: opacity / 100
                };
                drawShape(ctx, previewShape);
            } else if (['square', 'rectangle', 'circle', 'line', 'arrow', 'diamond'].includes(selectedTool) && drawing.startPoint && drawing.currentPoint) {
                const previewShape = {
                    tool: selectedTool,
                    start: drawing.startPoint,
                    end: drawing.currentPoint,
                    color: selectedColor,
                    strokeWidth,
                    opacity: opacity / 100
                };
                drawShapePreview(ctx, previewShape);
            }
        }

        // Draw eraser path
        if (eraser && eraser.eraserPath && eraser.eraserPath.length > 0) {
            drawEraserPath(ctx, eraser.eraserPath, eraserRadius);
        }

        // Draw selection box
        if (isSelecting && selectionBox) {
            drawSelection(ctx, selectionBox);
        }

        ctx.restore();
    }, [drawShape, drawShapePreview, drawEraserPath, drawSelection]);

    return {
        drawShape,
        drawShapePreview,
        drawEraserPath,
        drawSelection,
        redraw
    };
};

export default useCanvasRenderer;
