class ASCIIVideoConverter {
    constructor() {
        this.video = document.getElementById('originalVideo');
        this.canvas = document.getElementById('asciiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isPlaying = false;
        this.animationId = null;

        this.settings = {
            chars: ['!', '@', '#', '$'],
            enabled: [true, true, true, true],
            textColor: { h: 0, s: 0, b: 100 },
            bgColor: { h: 0, s: 0, b: 0 },
            textSize: 10,
            brightness: 0,
            contrast: 0
        };

        this.initializeEventListeners();
        this.updateColorPreviews();
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === '/') {
                e.preventDefault();
                const uiOverlay = document.getElementById('uiOverlay');
                uiOverlay.classList.toggle('hidden');
            }
        });
    }

    initializeEventListeners() {
        document.getElementById('videoUpload').addEventListener('change', (e) => this.handleVideoUpload(e));

        document.getElementById('textSize').addEventListener('input', (e) => {
            this.settings.textSize = parseInt(e.target.value);
            document.getElementById('textSizeValue').textContent = e.target.value;
        });

        document.getElementById('brightness').addEventListener('input', (e) => {
            this.settings.brightness = parseInt(e.target.value);
            document.getElementById('brightnessValue').textContent = e.target.value;
        });

        document.getElementById('contrast').addEventListener('input', (e) => {
            this.settings.contrast = parseInt(e.target.value);
            document.getElementById('contrastValue').textContent = e.target.value;
        });

        for (let i = 1; i <= 4; i++) {
            document.getElementById(`char${i}`).addEventListener('input', (e) => {
                this.settings.chars[i - 1] = e.target.value || ' ';
            });

            document.getElementById(`level${i}`).addEventListener('change', (e) => {
                this.settings.enabled[i - 1] = e.target.checked;
            });
        }

        ['textH', 'textS', 'textB'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('input', (e) => this.handleColorChange(e, 'text'));
        });

        ['bgH', 'bgS', 'bgB'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('input', (e) => this.handleColorChange(e, 'bg'));
        });

        document.getElementById('exportBtn').addEventListener('click', () => this.exportVideo());
    }

    handleVideoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        this.video.src = url;

        this.video.addEventListener('loadedmetadata', () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.video.loop = true;
            this.video.play();
            this.isPlaying = true;
            this.renderASCII();

            // Hide upload section
            document.querySelector('.upload-section').style.display = 'none';
        });
    }

    handleColorChange(e, type) {
        const id = e.target.id;
        const value = parseInt(e.target.value);
        const component = id.slice(-1).toLowerCase();

        if (type === 'text') {
            this.settings.textColor[component] = value;
            document.getElementById(`${id}Value`).textContent = component === 'h' ? value : `${value}%`;
        } else {
            this.settings.bgColor[component] = value;
            document.getElementById(`${id}Value`).textContent = component === 'h' ? value : `${value}%`;
        }

        this.updateColorPreviews();
    }

    hsbToRgb(h, s, b) {
        s = s / 100;
        b = b / 100;
        const k = (n) => (n + h / 60) % 6;
        const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
        return {
            r: Math.round(255 * f(5)),
            g: Math.round(255 * f(3)),
            b: Math.round(255 * f(1))
        };
    }

    updateColorPreviews() {
        const textRgb = this.hsbToRgb(
            this.settings.textColor.h,
            this.settings.textColor.s,
            this.settings.textColor.b
        );
        const bgRgb = this.hsbToRgb(
            this.settings.bgColor.h,
            this.settings.bgColor.s,
            this.settings.bgColor.b
        );

        document.getElementById('textColorPreview').style.backgroundColor =
            `rgb(${textRgb.r}, ${textRgb.g}, ${textRgb.b})`;
        document.getElementById('bgColorPreview').style.backgroundColor =
            `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`;
    }

    renderASCII() {
        if (!this.isPlaying || this.video.paused || this.video.ended) {
            return;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;

        tempCtx.drawImage(this.video, 0, 0, width, height);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        const bgRgb = this.hsbToRgb(
            this.settings.bgColor.h,
            this.settings.bgColor.s,
            this.settings.bgColor.b
        );
        this.ctx.fillStyle = `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`;
        this.ctx.fillRect(0, 0, width, height);

        const textRgb = this.hsbToRgb(
            this.settings.textColor.h,
            this.settings.textColor.s,
            this.settings.textColor.b
        );
        this.ctx.fillStyle = `rgb(${textRgb.r}, ${textRgb.g}, ${textRgb.b})`;
        this.ctx.font = `${this.settings.textSize}px "Roboto Mono"`;

        const charWidth = this.settings.textSize * 0.6;
        const charHeight = this.settings.textSize * 1.2;

        for (let y = 0; y < height; y += charHeight) {
            for (let x = 0; x < width; x += charWidth) {
                const i = (y * width + x) * 4;
                let r = pixels[i];
                let g = pixels[i + 1];
                let b = pixels[i + 2];

                // Apply brightness
                r = Math.max(0, Math.min(255, r + this.settings.brightness));
                g = Math.max(0, Math.min(255, g + this.settings.brightness));
                b = Math.max(0, Math.min(255, b + this.settings.brightness));

                // Apply contrast
                const contrast = (this.settings.contrast + 100) / 100;
                r = Math.max(0, Math.min(255, ((r - 128) * contrast) + 128));
                g = Math.max(0, Math.min(255, ((g - 128) * contrast) + 128));
                b = Math.max(0, Math.min(255, ((b - 128) * contrast) + 128));

                const gray = 0.299 * r + 0.587 * g + 0.114 * b;

                let charIndex;
                if (gray < 64) charIndex = 0;
                else if (gray < 128) charIndex = 1;
                else if (gray < 192) charIndex = 2;
                else charIndex = 3;

                if (this.settings.enabled[charIndex]) {
                    const char = this.settings.chars[charIndex] || ' ';
                    this.ctx.fillText(char, x, y + this.settings.textSize);
                }
            }
        }

        this.animationId = requestAnimationFrame(() => this.renderASCII());
    }

    async exportVideo() {
        if (!this.video.src) {
            alert('Please upload a video first!');
            return;
        }

        const exportBtn = document.getElementById('exportBtn');
        const progressDiv = document.getElementById('exportProgress');

        exportBtn.disabled = true;
        progressDiv.classList.add('active');
        progressDiv.textContent = 'Preparing export...';

        try {
            // Stop current playback
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }

            // Disable loop for export
            const wasLooping = this.video.loop;
            this.video.loop = false;
            this.video.pause();
            this.video.currentTime = 0;

            await new Promise(resolve => {
                this.video.onseeked = resolve;
            });

            const stream = this.canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 5000000
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ascii_video.webm';
                a.click();
                URL.revokeObjectURL(url);

                // Restore loop
                this.video.loop = wasLooping;
                this.video.currentTime = 0;
                this.video.play();
                this.isPlaying = true;
                this.renderASCII();

                progressDiv.textContent = 'Export completed!';
                setTimeout(() => {
                    progressDiv.classList.remove('active');
                    exportBtn.disabled = false;
                }, 2000);
            };

            mediaRecorder.start();
            progressDiv.textContent = 'Recording...';

            this.video.play();
            this.isPlaying = true;
            this.renderASCII();

            this.video.onended = () => {
                mediaRecorder.stop();
                this.isPlaying = false;
            };

        } catch (error) {
            console.error('Export error:', error);
            progressDiv.textContent = 'Export failed: ' + error.message;
            exportBtn.disabled = false;
            this.video.loop = true;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ASCIIVideoConverter();
});
