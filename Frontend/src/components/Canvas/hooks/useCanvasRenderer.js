import { useCallback } from 'react';

// In your useCanvasRenderer.js, update the selection rendering
const renderSelection = (ctx, shapes, selectedElements, selectionBox) => {
    // Draw selection box if actively selecting
    if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
        ctx.save();
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
        ctx.restore();
    }

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

    // Draw selection indicators around selected elements
    selectedElements.forEach(index => {
        const shape = shapes[index];
        if (!shape) return;

        let bounds;
        
        if (shape.tool === "image") {
            bounds = {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height
            };
        } else if (shape.tool === "text") {
            const textWidth = shape.text.length * (shape.fontSize || 16) * 0.6;
            const textHeight = (shape.fontSize || 16) * 1.2;
            bounds = {
                x: shape.x,
                y: shape.y,
                width: textWidth,
                height: textHeight
            };
        } else if (shape.tool === "pen" || shape.tool === "laser") {
            const points = shape.points;
            if (points.length === 0) return;
            
            let minX = points[0].x, maxX = points[0].x;
            let minY = points[0].y, maxY = points[0].y;
            
            points.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });
            
            bounds = {
                x: minX - 5,
                y: minY - 5,
                width: maxX - minX + 10,
                height: maxY - minY + 10
            };
        } else if (shape.tool === "square") {
            // Use the same logic as square drawing
            bounds = calculateSquareBounds(shape.start, shape.end);
            bounds.x -= 3;
            bounds.y -= 3;
            bounds.width += 6;
            bounds.height += 6;
        } else {
            // Other shape tools
            const minX = Math.min(shape.start.x, shape.end.x);
            const maxX = Math.max(shape.start.x, shape.end.x);
            const minY = Math.min(shape.start.y, shape.end.y);
            const maxY = Math.max(shape.start.y, shape.end.y);
            
            bounds = {
                x: minX - 3,
                y: minY - 3,
                width: maxX - minX + 6,
                height: maxY - minY + 6
            };
        }

        // Draw selection border
        ctx.save();
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // Draw corner handles
        const handleSize = 8;
        ctx.fillStyle = '#0066cc';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        const corners = [
            [bounds.x - handleSize/2, bounds.y - handleSize/2],
            [bounds.x + bounds.width - handleSize/2, bounds.y - handleSize/2],
            [bounds.x - handleSize/2, bounds.y + bounds.height - handleSize/2],
            [bounds.x + bounds.width - handleSize/2, bounds.y + bounds.height - handleSize/2]
        ];
        
        corners.forEach(([x, y]) => {
            ctx.fillRect(x, y, handleSize, handleSize);
            ctx.strokeRect(x, y, handleSize, handleSize);
        });
        
        ctx.restore();
    });
};


const useCanvasRenderer = () => {
    const applyStrokeStyle = useCallback((ctx, sStyle) => {
        switch (sStyle) {
            case 'dashed':
                ctx.setLineDash([8, 4]);
                break;
            case 'dotted':
                ctx.setLineDash([2, 4]);
                break;
            case 'wavy':
                ctx.setLineDash([6, 3, 2, 3]);
                break;
            default:
                ctx.setLineDash([]);
        }
    }, []);

    const drawArrowHead = useCallback((ctx, from, to, headlen = 16) => {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6),
            to.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6),
            to.y - headlen * Math.sin(angle + Math.PI / 6));
    }, []);

    const drawSelectionBox = useCallback((ctx, box) => {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.fillRect(box.x, box.y, box.width, box.height);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.restore();
    }, []);

    const drawSelectionHighlight = useCallback((ctx, shape, isSelected) => {
        if (!isSelected) return;

        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);

        if (shape.tool === "text") {
            const textWidth = shape.text.length * (shape.fontSize || 16) * 0.6;
            const textHeight = (shape.fontSize || 16) * 1.2;
            ctx.strokeRect(shape.x - 2, shape.y - 2, textWidth + 4, textHeight + 4);
        } else if (shape.tool === "image") {
            ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
        } else if (shape.start && shape.end) {
            const minX = Math.min(shape.start.x, shape.end.x) - 5;
            const minY = Math.min(shape.start.y, shape.end.y) - 5;
            const maxX = Math.max(shape.start.x, shape.end.x) + 5;
            const maxY = Math.max(shape.start.y, shape.end.y) + 5;
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        }

        ctx.restore();
    }, []);

    const drawImage = useCallback((ctx, shape, faded = false, isSelected = false, loadedImages) => {
        const img = loadedImages.get(shape.id);
        if (!img) {
            ctx.save();
            ctx.globalAlpha = faded ? 0.2 : 0.5;
            ctx.fillStyle = "#e5e7eb";
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            ctx.strokeStyle = "#9ca3af";
            ctx.lineWidth = 2;
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);

            ctx.fillStyle = "#6b7280";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Loading...", shape.x + shape.width / 2, shape.y + shape.height / 2);
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.globalAlpha = faded ? 0.35 : (shape.opacity || 1);

        try {
            ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
        } catch (error) {
            console.error("Error drawing image:", error);
            ctx.fillStyle = "#fca5a5";
            ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }

        ctx.restore();
        drawSelectionHighlight(ctx, shape, isSelected);
    }, [drawSelectionHighlight]);

    const drawText = useCallback((ctx, shape, faded = false, isSelected = false) => {
        ctx.save();
        ctx.globalAlpha = faded ? 0.35 : (shape.opacity || 1);
        ctx.fillStyle = shape.color || "#000000";
        ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || "Arial"}`;
        ctx.textBaseline = "top";

        const lines = shape.text.split('\n');
        const lineHeight = (shape.fontSize || 16) * 1.2;

        lines.forEach((line, index) => {
            ctx.fillText(line, shape.x, shape.y + (index * lineHeight));
        });

        ctx.restore();
        drawSelectionHighlight(ctx, shape, isSelected);
    }, [drawSelectionHighlight]);

    const drawPenStroke = useCallback((ctx, points, isPreview = false, faded = false, shape = {}, isSelected = false, selectedColor, strokeWidth, opacity) => {
        const color = shape.color || selectedColor;
        const sWidth = shape.strokeWidth || strokeWidth;
        const sStyle = shape.strokeStyle || 'solid';
        const sOpacity = shape.opacity !== undefined ? shape.opacity : (opacity / 100);

        ctx.save();
        ctx.globalAlpha = faded ? 0.35 : sOpacity;
        applyStrokeStyle(ctx, sStyle);
        ctx.beginPath();
        points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = isPreview ? selectedColor : color;
        ctx.lineWidth = isPreview ? strokeWidth : sWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();

        if (isSelected && points.length > 0) {
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = sWidth + 4;
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            points.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.restore();
        }
    }, [applyStrokeStyle]);

    const drawLaserStroke = useCallback((ctx, points, laserOpacity = 1, shape = {}, isSelected = false, selectedColor) => {
        const color = shape.color || selectedColor;
        const sWidth = shape.strokeWidth || 3;
        const sStyle = shape.strokeStyle || 'solid';

        ctx.save();
        ctx.globalAlpha = laserOpacity;
        applyStrokeStyle(ctx, sStyle);
        ctx.beginPath();
        points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = sWidth;
        ctx.shadowColor = color;
        ctx.shadowBlur = 50;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();

        if (isSelected && points.length > 0) {
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = sWidth + 4;
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            points.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.restore();
        }
    }, [applyStrokeStyle]);

    const drawShape = useCallback((ctx, start, end, tool, isPreview = false, faded = false, shape = {}, isSelected = false, selectedColor, strokeWidth, opacity) => {
        const color = shape.color || selectedColor;
        const bgColor = shape.backgroundColor;
        const sWidth = shape.strokeWidth || strokeWidth;
        const sStyle = shape.strokeStyle || 'solid';
        const sOpacity = shape.opacity !== undefined ? shape.opacity : (opacity / 100);

        ctx.save();
        ctx.globalAlpha = faded ? 0.35 : sOpacity;
        applyStrokeStyle(ctx, sStyle);
        ctx.beginPath();
        switch (tool) {
            case "square":
                const size = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
                ctx.rect(start.x, start.y, size * Math.sign(end.x - start.x), size * Math.sign(end.y - start.y));
                break;
            case "rectangle":
                ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
                break;
            case "diamond":
                const cx = (start.x + end.x) / 2;
                const cy = (start.y + end.y) / 2;
                const w = Math.abs(end.x - start.x) / 2;
                const h = Math.abs(end.y - start.y) / 2;
                ctx.moveTo(cx, cy - h);
                ctx.lineTo(cx + w, cy);
                ctx.lineTo(cx, cy + h);
                ctx.lineTo(cx - w, cy);
                ctx.closePath();
                break;
            case "circle":
                const centerX = (start.x + end.x) / 2;
                const centerY = (start.y + end.y) / 2;
                const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2) / 2;
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                break;
            case "arrow":
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                drawArrowHead(ctx, start, end, 16);
                break;
            case "line":
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                break;
            default:
                break;
        }
        if (bgColor && bgColor !== "#ffffff") {
            ctx.fillStyle = bgColor;
            ctx.fill();
        }
        ctx.strokeStyle = isPreview ? selectedColor : color;
        ctx.lineWidth = isPreview ? strokeWidth : sWidth;
        ctx.stroke();
        ctx.restore();

        drawSelectionHighlight(ctx, shape, isSelected);
    }, [applyStrokeStyle, drawArrowHead, drawSelectionHighlight]);

    const drawEraserPath = useCallback((ctx, points, eraserRadius) => {
        ctx.save();
        ctx.beginPath();
        points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = "rgba(160,160,160,0.5)";
        ctx.lineWidth = eraserRadius * 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
    }, []);

    const redraw = useCallback((canvasRef, shapes, loadedImages, panOffset, selectedElements, selectionBox, isSelecting, drawing, eraser, selectedTool, selectedColor, strokeWidth, opacity, eraserRadius) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply pan transformation
        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);

        shapes.forEach((shape, idx) => {
            const fade = eraser.markedIds.includes(idx);
            const isSelected = selectedElements.includes(idx);

            if (shape.tool === "pen") {
                drawPenStroke(ctx, shape.points, false, fade, shape, isSelected, selectedColor, strokeWidth, opacity);
            } else if (shape.tool === "laser") {
                drawLaserStroke(ctx, shape.points, shape.opacity, shape, isSelected, selectedColor);
            } else if (shape.tool === "text") {
                drawText(ctx, shape, fade, isSelected);
            } else if (shape.tool === "image") {
                drawImage(ctx, shape, fade, isSelected, loadedImages);
            } else {
                drawShape(ctx, shape.start, shape.end, shape.tool, false, fade, shape, isSelected, selectedColor, strokeWidth, opacity);
            }
        });

        // Draw current drawing
        if (drawing.isDrawing && selectedTool === "pen" && drawing.penPoints.length) {
            drawPenStroke(ctx, drawing.penPoints, true, false, { color: selectedColor, strokeWidth, opacity: opacity / 100 }, false, selectedColor, strokeWidth, opacity);
        }
        if (drawing.isDrawing && selectedTool === "laser" && drawing.laserPoints.length) {
            drawLaserStroke(ctx, drawing.laserPoints, opacity / 100, { color: selectedColor, strokeWidth }, false, selectedColor);
        }
        if (drawing.isDrawing && ["square", "diamond", "circle", "arrow", "line", "rectangle"].includes(selectedTool) && drawing.startPoint && drawing.currentPoint) {
            drawShape(ctx, drawing.startPoint, drawing.currentPoint, selectedTool, true, false, {
                color: selectedColor,
                backgroundColor: "#ffffff",
                strokeWidth,
                opacity: opacity / 100
            }, false, selectedColor, strokeWidth, opacity);
        }

        // Draw eraser path
        if (selectedTool === "eraser" && eraser.eraserPath.length > 0) {
            drawEraserPath(ctx, eraser.eraserPath, eraserRadius);
        }

        // Draw selection box
        if (selectionBox && isSelecting) {
            drawSelectionBox(ctx, selectionBox);
        }

        ctx.restore();
    }, [drawPenStroke, drawLaserStroke, drawText, drawImage, drawShape, drawEraserPath, drawSelectionBox]);

    return {
        redraw,
        drawPenStroke,
        drawLaserStroke,
        drawShape,
        drawText,
        drawImage,
        drawEraserPath,
        drawSelectionBox,
        drawSelectionHighlight,
        applyStrokeStyle,
        renderSelection
    };
};

export default useCanvasRenderer;
