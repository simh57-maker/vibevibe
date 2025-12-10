class PixelStretchApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.image = null;
        this.currentImageData = null;
        this.history = [];
        this.redoHistory = [];
        this.stretchIntensity = 5;

        // Image bounds (the actual image area)
        this.imageX = 0;
        this.imageY = 0;
        this.imageWidth = 0;
        this.imageHeight = 0;

        // Zoom state
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;

        // Drag state
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;

        // UI state
        this.uiVisible = true;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.resizeCanvas();
    }

    setupCanvas() {
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.currentImageData) {
            this.drawCurrentImage();
        }
    }

    setupEventListeners() {
        // File upload
        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.loadImage(e.target.files[0]);
        });

        // Stretch intensity
        const intensitySlider = document.getElementById('stretch-intensity');
        const intensityValue = document.getElementById('intensity-value');
        intensitySlider.addEventListener('input', (e) => {
            this.stretchIntensity = parseFloat(e.target.value);
            intensityValue.textContent = this.stretchIntensity;
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetToOriginal();
        });

        // Export buttons
        document.getElementById('export-png').addEventListener('click', () => {
            this.exportImage('png');
        });

        document.getElementById('export-jpg').addEventListener('click', () => {
            this.exportImage('jpeg');
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Toggle UI with '/'
            if (e.key === '/') {
                e.preventDefault();
                this.toggleUI();
            }

            // Undo with Cmd+Z or Ctrl+Z (without Shift)
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }

            // Redo with Cmd+Shift+Z or Ctrl+Shift+Z
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    loadImage(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.saveToHistory();
                this.drawImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    drawImage() {
        if (!this.image) return;

        const canvasAspect = this.canvas.width / this.canvas.height;
        const imageAspect = this.image.width / this.image.height;

        let drawWidth, drawHeight;

        if (imageAspect > canvasAspect) {
            drawWidth = this.canvas.width;
            drawHeight = this.canvas.width / imageAspect;
        } else {
            drawHeight = this.canvas.height;
            drawWidth = this.canvas.height * imageAspect;
        }

        const x = (this.canvas.width - drawWidth) / 2;
        const y = (this.canvas.height - drawHeight) / 2;

        // Store image bounds
        this.imageX = x;
        this.imageY = y;
        this.imageWidth = drawWidth;
        this.imageHeight = drawHeight;

        // Fill with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, x, y, drawWidth, drawHeight);

        this.currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCurrentImage() {
        if (this.currentImageData) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.translate(this.translateX, this.translateY);
            this.ctx.scale(this.scale, this.scale);
            this.ctx.putImageData(this.currentImageData, 0, 0);
            this.ctx.restore();
        }
    }

    onMouseDown(e) {
        if (!this.currentImageData) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Only start dragging if mouse is within image bounds
        if (mouseX >= this.imageX && mouseX <= this.imageX + this.imageWidth &&
            mouseY >= this.imageY && mouseY <= this.imageY + this.imageHeight) {
            this.isDragging = true;
            this.startX = mouseX;
            this.startY = mouseY;
            this.endX = this.startX;
            this.endY = this.startY;
        }
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        this.endX = e.clientX - rect.left;
        this.endY = e.clientY - rect.top;

        this.drawCurrentImage();
        this.drawSelectionRect();
    }

    onMouseUp(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        const rect = this.canvas.getBoundingClientRect();
        this.endX = e.clientX - rect.left;
        this.endY = e.clientY - rect.top;

        // Clear the selection rect by redrawing the current image
        this.drawCurrentImage();

        // Apply stretch to clean image
        this.applyPixelStretch();
    }

    drawSelectionRect() {
        const x = Math.min(this.startX, this.endX);
        const y = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);

        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
    }

    applyPixelStretch() {
        const x = Math.floor(Math.min(this.startX, this.endX));
        const y = Math.floor(Math.min(this.startY, this.endY));
        const width = Math.floor(Math.abs(this.endX - this.startX));
        const height = Math.floor(Math.abs(this.endY - this.startY));

        if (width < 2 || height < 2) {
            this.drawCurrentImage();
            return;
        }

        // Save current state to history before stretching
        this.saveToHistory();

        // Get the region to stretch
        const regionData = this.ctx.getImageData(x, y, width, height);
        const stretchedData = this.stretchPixelsHorizontally(regionData, this.stretchIntensity);

        // Put stretched data back
        this.ctx.putImageData(stretchedData, x, y);

        // Update current image data
        this.currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    stretchPixelsHorizontally(imageData, intensity) {
        const { width, height, data } = imageData;
        const newData = new ImageData(width, height);

        // Calculate stretch amount based on intensity (increased multiplier for stronger effect)
        const stretchFactor = intensity * 200; // Much stronger stretch effect

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const sourceCol = Math.floor(col / (1 + stretchFactor * 0.1));

                if (sourceCol >= width) {
                    // If we're beyond the source, use the last pixel
                    const lastPixelIdx = (row * width + (width - 1)) * 4;
                    const targetIdx = (row * width + col) * 4;
                    newData.data[targetIdx] = data[lastPixelIdx];
                    newData.data[targetIdx + 1] = data[lastPixelIdx + 1];
                    newData.data[targetIdx + 2] = data[lastPixelIdx + 2];
                    newData.data[targetIdx + 3] = data[lastPixelIdx + 3];
                } else {
                    const sourceIdx = (row * width + sourceCol) * 4;
                    const targetIdx = (row * width + col) * 4;

                    // Copy pixel with blending for smoother stretch
                    const nextCol = Math.min(sourceCol + 1, width - 1);
                    const nextIdx = (row * width + nextCol) * 4;
                    const blend = (col / (1 + stretchFactor * 0.1)) - sourceCol;

                    for (let i = 0; i < 4; i++) {
                        newData.data[targetIdx + i] =
                            data[sourceIdx + i] * (1 - blend) +
                            data[nextIdx + i] * blend;
                    }
                }
            }
        }

        return newData;
    }

    saveToHistory() {
        if (this.currentImageData) {
            this.history.push(
                this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
            );

            // Clear redo history when new action is performed
            this.redoHistory = [];

            // Limit history to 50 states to prevent memory issues
            if (this.history.length > 50) {
                this.history.shift();
            }
        }
    }

    undo() {
        if (this.history.length > 0) {
            // Save current state to redo history
            this.redoHistory.push(this.currentImageData);

            this.currentImageData = this.history.pop();
            this.drawCurrentImage();

            // Limit redo history to 50 states
            if (this.redoHistory.length > 50) {
                this.redoHistory.shift();
            }
        }
    }

    redo() {
        if (this.redoHistory.length > 0) {
            // Save current state back to history
            this.history.push(this.currentImageData);

            this.currentImageData = this.redoHistory.pop();
            this.drawCurrentImage();
        }
    }

    onWheel(e) {
        e.preventDefault();

        const delta = e.deltaY;
        const zoomIntensity = 0.1;

        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom
        const zoom = delta > 0 ? 1 - zoomIntensity : 1 + zoomIntensity;
        const newScale = this.scale * zoom;

        // Limit zoom range
        if (newScale >= 0.1 && newScale <= 5) {
            // Adjust translation to zoom towards mouse position
            this.translateX = mouseX - (mouseX - this.translateX) * zoom;
            this.translateY = mouseY - (mouseY - this.translateY) * zoom;
            this.scale = newScale;

            this.drawCurrentImage();
        }
    }

    resetToOriginal() {
        if (this.image) {
            this.history = [];
            this.drawImage();
        }
    }

    toggleUI() {
        const panel = document.getElementById('ui-panel');
        this.uiVisible = !this.uiVisible;

        if (this.uiVisible) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }

    exportImage(format) {
        if (!this.currentImageData) {
            alert('Please load an image first!');
            return;
        }

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format === 'png' ? 'png' : 'jpg';

        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pixel-stretch-${Date.now()}.${extension}`;
            a.click();
            URL.revokeObjectURL(url);
        }, mimeType, 0.95);
    }
}

// Initialize the app
const app = new PixelStretchApp();
