// hooks/useCanvasImages.js
import { useState, useCallback, useRef } from 'react';

export default function useCanvasImages(
    shapes,
    setShapes,
    saveToHistory,
    panning,
    opacity,
    canvasRef
) {
    const fileInputRef = useRef(null);
    const [loadedImages, setLoadedImages] = useState(new Map());
    const [imageToPlace, setImageToPlace] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Handle paste from clipboard
    const handlePasteFromClipboard = useCallback(async () => {
        try {
            if (!navigator.clipboard || !navigator.clipboard.read) {
                console.log('Clipboard API not supported');
                return;
            }

            const clipboardItems = await navigator.clipboard.read();

            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        const reader = new FileReader();

                        reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                                const maxSize = 300;
                                let width = img.naturalWidth;
                                let height = img.naturalHeight;

                                if (width > maxSize || height > maxSize) {
                                    const ratio = Math.min(maxSize / width, maxSize / height);
                                    width = width * ratio;
                                    height = height * ratio;
                                }

                                const canvas = canvasRef.current;
                                if (canvas) {
                                    const centerX = (canvas.width / 2 - panning.panOffset.x);
                                    const centerY = (canvas.height / 2 - panning.panOffset.y);

                                    saveToHistory(shapes);

                                    const imageId = `img_${Date.now()}_${Math.random()}`;

                                    const newImg = new Image();
                                    newImg.onload = () => {
                                        setLoadedImages(prev => new Map(prev.set(imageId, newImg)));
                                    };
                                    newImg.src = event.target.result;

                                    setShapes(prev => [...prev, {
                                        tool: "image",
                                        id: imageId,
                                        x: centerX - width / 2,
                                        y: centerY - height / 2,
                                        width,
                                        height,
                                        src: event.target.result,
                                        opacity: opacity / 100
                                    }]);
                                }
                            };
                            img.src = event.target.result;
                        };

                        reader.readAsDataURL(blob);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error pasting from clipboard:', error);
        }
    }, [shapes, saveToHistory, panning.panOffset, opacity, canvasRef]);

    // Handle click to place image
    const handleImagePlacement = useCallback((e) => {
        if (!imagePreview) return false;

        const canvas = canvasRef.current;
        if (!canvas) return false;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - panning.panOffset.x;
        const y = e.clientY - rect.top - panning.panOffset.y;

        // Place the image at clicked position
        saveToHistory(shapes);

        const imageId = `opened_img_${Date.now()}_${Math.random()}`;

        // Create image element and add to loaded images
        const newImg = new Image();
        newImg.onload = () => {
            setLoadedImages(prev => new Map(prev.set(imageId, newImg)));
        };
        newImg.src = imagePreview.src;

        // Add image shape to canvas at clicked position
        setShapes(prev => [...prev, {
            tool: "image",
            id: imageId,
            x: x - imagePreview.width / 2, // Center on click point
            y: y - imagePreview.height / 2,
            width: imagePreview.width,
            height: imagePreview.height,
            src: imagePreview.src,
            opacity: opacity / 100,
            name: imagePreview.name || 'opened-image'
        }]);

        console.log(`Image "${imagePreview.name}" placed at position (${Math.round(x)}, ${Math.round(y)})`);

        // Clear preview after placing - user needs to open again for next image
        setImagePreview(null);
        setMousePosition({ x: 0, y: 0 });

        return true;
    }, [imagePreview, shapes, saveToHistory, panning.panOffset, opacity, canvasRef, setShapes]);

    // Handle mouse move for image preview
    const handleMouseMoveWithPreview = useCallback((e) => {
        if (imagePreview) {
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left - panning.panOffset.x;
                const y = e.clientY - rect.top - panning.panOffset.y;
                setMousePosition({ x, y });
            }
        }
    }, [imagePreview, panning.panOffset, canvasRef]);

    // Add image to canvas function - now shows preview
    const addImageToCanvas = useCallback((imageSrc, imageName) => {
        const img = new Image();
        img.onload = () => {
            const maxSize = 400;
            let width = img.naturalWidth;
            let height = img.naturalHeight;

            // Resize if too large
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = width * ratio;
                height = height * ratio;
            }

            // Set image preview data
            setImagePreview({
                src: imageSrc,
                width,
                height,
                name: imageName
            });

            console.log(`Image "${imageName}" loaded. Move mouse on canvas to preview, click to place.`);
        };

        img.onerror = () => {
            console.error('Failed to load image:', imageName);
            alert('Failed to load the selected image.');
        };

        img.src = imageSrc;
    }, []);

    // Handle file selection for images
    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const maxSize = 300;
                    let width = img.naturalWidth;
                    let height = img.naturalHeight;

                    if (width > maxSize || height > maxSize) {
                        const ratio = Math.min(maxSize / width, maxSize / height);
                        width = width * ratio;
                        height = height * ratio;
                    }

                    setImageToPlace({
                        src: event.target.result,
                        width,
                        height,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }

        e.target.value = '';
    }, []);

    // Handle ESC key to cancel image preview
    const handleEscapeKey = useCallback((e) => {
        if (e.key === 'Escape' && imagePreview) {
            setImagePreview(null);
            setMousePosition({ x: 0, y: 0 });
            console.log('Image preview cancelled');
        }
    }, [imagePreview]);

    // Load images from canvas data
    const loadImagesFromCanvasData = useCallback((canvasData) => {
        const imageShapes = canvasData.shapes.filter(shape => shape.tool === 'image');
        if (imageShapes.length > 0) {
            const newLoadedImages = new Map();
            let loadedCount = 0;

            imageShapes.forEach(imageShape => {
                const img = new Image();
                img.onload = () => {
                    newLoadedImages.set(imageShape.id, img);
                    loadedCount++;

                    // Update loaded images when all images are loaded
                    if (loadedCount === imageShapes.length) {
                        setLoadedImages(prev => new Map([...prev, ...newLoadedImages]));
                    }
                };
                img.onerror = () => {
                    console.error('Failed to load image:', imageShape.src);
                    loadedCount++;
                };
                img.src = imageShape.src;
            });
        }
    }, []);

    // Reset image states
    const resetImageStates = useCallback(() => {
        setLoadedImages(new Map());
        setImageToPlace(null);
        setImagePreview(null);
        setMousePosition({ x: 0, y: 0 });
    }, []);

    return {
        fileInputRef,
        loadedImages,
        setLoadedImages,
        imageToPlace,
        setImageToPlace,
        imagePreview,
        setImagePreview,
        mousePosition,
        setMousePosition,
        handlePasteFromClipboard,
        handleImagePlacement,
        handleMouseMoveWithPreview,
        addImageToCanvas,
        handleFileSelect,
        handleEscapeKey,
        loadImagesFromCanvasData,
        resetImageStates
    };
}
