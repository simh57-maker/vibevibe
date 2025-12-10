class SoundInteractiveMedia {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isListening = false;
        this.sensitivity = 5;
        this.currentMedia = null;
        this.filterColor = '#ffffff';
        this.filterOpacity = 0;
        this.uiVisible = true;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.mediaUpload = document.getElementById('media-upload');
        this.clearMediaBtn = document.getElementById('clear-media');
        this.micToggle = document.getElementById('mic-toggle');
        this.volumeValue = document.getElementById('volume-value');
        this.rmsValue = document.getElementById('rms-value');
        this.peakValue = document.getElementById('peak-value');
        this.freqValue = document.getElementById('freq-value');
        this.audioLevelBar = document.getElementById('audio-level-bar');
        this.sensitivitySlider = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivity-value');
        this.filterColorInput = document.getElementById('filter-color');
        this.filterOpacitySlider = document.getElementById('filter-opacity');
        this.opacityValue = document.getElementById('opacity-value');
        this.mediaWrapper = document.getElementById('media-wrapper');
        this.colorFilter = document.getElementById('color-filter');
        this.controlsPanel = document.getElementById('controls-panel');
    }

    attachEventListeners() {
        this.mediaUpload.addEventListener('change', (e) => this.handleMediaUpload(e));
        this.clearMediaBtn.addEventListener('click', () => this.clearMedia());
        this.micToggle.addEventListener('click', () => this.toggleMicrophone());
        this.sensitivitySlider.addEventListener('input', (e) => this.updateSensitivity(e));
        this.filterColorInput.addEventListener('input', (e) => this.updateFilterColor(e));
        this.filterOpacitySlider.addEventListener('input', (e) => this.updateFilterOpacity(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === '/') {
                e.preventDefault();
                this.toggleUI();
            }
        });
    }

    handleMediaUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.clearMedia();

        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            const video = document.createElement('video');
            video.src = url;
            video.autoplay = true;
            video.loop = true;
            video.muted = false;
            this.mediaWrapper.appendChild(video);
            this.currentMedia = video;
        } else {
            const img = document.createElement('img');
            img.src = url;
            this.mediaWrapper.appendChild(img);
            this.currentMedia = img;
        }
    }

    clearMedia() {
        if (this.currentMedia) {
            if (this.currentMedia.tagName === 'VIDEO') {
                this.currentMedia.pause();
                this.currentMedia.src = '';
            }
            URL.revokeObjectURL(this.currentMedia.src);
            this.currentMedia.remove();
            this.currentMedia = null;
        }
        this.mediaUpload.value = '';
    }

    async toggleMicrophone() {
        if (!this.isListening) {
            try {
                await this.startMicrophone();
                // startMicrophone 내부에서 이미 this.isListening = true 로 변경했으므로
                // 여기서는 별도의 코드가 필요 없습니다.
            } catch (error) {
                console.error('마이크 접근 오류:', error);
                alert('마이크에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.');
            }
        } else {
            this.stopMicrophone();
            this.micToggle.textContent = '마이크 시작';
            this.micToggle.classList.remove('active');
            this.isListening = false;
        }
    }

    async startMicrophone() {
        try {
            // 1. sampleRate 제약 제거 (호환성 향상)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                    // sampleRate: 48000  <-- 삭제 권장
                }
            });

            this.stream = stream;

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 2. AudioContext Resume 추가 (크롬 정책 대응)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;
            this.analyser.smoothingTimeConstant = 0.2;
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;

            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            this.timeDomainData = new Uint8Array(this.analyser.fftSize);
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

            console.log('마이크 시작됨 - 샘플레이트:', this.audioContext.sampleRate);
            
            // 3. [핵심 수정] 루프 시작 전에 플래그를 먼저 켭니다!
            this.isListening = true; 
            this.micToggle.textContent = '마이크 중지'; // UI도 여기서 미리 업데이트하면 좋습니다
            this.micToggle.classList.add('active');

            this.analyzeAudio(); // 이제 isListening이 true이므로 루프가 정상 작동합니다.

        } catch (error) {
            console.error('마이크 초기화 오류:', error);
            // 에러 발생 시 플래그 원복
            this.isListening = false;
            throw error;
        }
    }

    stopMicrophone() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
        this.timeDomainData = null;
        this.frequencyData = null;

        this.volumeValue.textContent = '0';
        this.rmsValue.textContent = '0';
        this.peakValue.textContent = '0';
        this.freqValue.textContent = '0';
        this.audioLevelBar.style.width = '0%';

        if (this.currentMedia) {
            this.currentMedia.style.filter = 'brightness(1)';
        }

        console.log('마이크 중지됨');
    }

    analyzeAudio() {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteTimeDomainData(this.timeDomainData);
        this.analyser.getByteFrequencyData(this.frequencyData);

        if (!this.debugCounter) this.debugCounter = 0;
        this.debugCounter++;

        if (this.debugCounter % 300 === 1) {
            console.log('=== 마이크 데이터 샘플 (5초마다) ===');
            console.log('Time Domain 처음 10개:', Array.from(this.timeDomainData.slice(0, 10)));
            console.log('Frequency 처음 10개:', Array.from(this.frequencyData.slice(0, 10)));
        }

        let sumSquares = 0;
        let peak = 0;
        let min = 1;
        let max = 0;

        for (let i = 0; i < this.timeDomainData.length; i++) {
            const normalized = (this.timeDomainData[i] - 128) / 128;
            const absValue = Math.abs(normalized);

            sumSquares += normalized * normalized;

            if (absValue > peak) {
                peak = absValue;
            }
            if (absValue < min) {
                min = absValue;
            }
            if (absValue > max) {
                max = absValue;
            }
        }

        const rms = Math.sqrt(sumSquares / this.timeDomainData.length);

        let frequencySum = 0;
        let maxFreq = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            frequencySum += this.frequencyData[i];
            if (this.frequencyData[i] > maxFreq) {
                maxFreq = this.frequencyData[i];
            }
        }
        const frequencyAverage = frequencySum / this.frequencyData.length;
        const frequencyNormalized = frequencyAverage / 255;
        const maxFreqNormalized = maxFreq / 255;

        const combinedVolume = Math.max(
            rms * 0.2,
            peak * 0.7,
            frequencyNormalized * 0.2,
            maxFreqNormalized * 0.1
        );

        const volumePercent = Math.min(100, combinedVolume * 100 * 8);

        this.volumeValue.textContent = Math.round(volumePercent);
        this.rmsValue.textContent = (rms * 100).toFixed(1);
        this.peakValue.textContent = (peak * 100).toFixed(1);
        this.freqValue.textContent = (frequencyNormalized * 100).toFixed(1);
        this.audioLevelBar.style.width = `${volumePercent}%`;

        if (this.debugCounter % 300 === 1) {
            console.log('계산된 값 - RMS:', (rms * 100).toFixed(2), '| Peak:', (peak * 100).toFixed(2), '| Freq Avg:', (frequencyNormalized * 100).toFixed(2), '| Freq Max:', (maxFreqNormalized * 100).toFixed(2));
            console.log('최종 볼륨:', volumePercent.toFixed(1), '%');
            console.log('=============================');
        }

        if (this.currentMedia) {
            this.applyBrightnessEffect(combinedVolume);
        }

        requestAnimationFrame(() => this.analyzeAudio());
    }

    applyBrightnessEffect(volume) {
        const normalizedSensitivity = this.sensitivity / 10;

        const baseMultiplier = 5;
        const sensitivityBoost = normalizedSensitivity * 15;
        const totalMultiplier = baseMultiplier + sensitivityBoost;

        const amplifiedVolume = Math.pow(volume * totalMultiplier, 0.75);

        const minBrightness = 1.0;
        const maxBrightness = 3.5;

        let brightness = minBrightness + (amplifiedVolume * (maxBrightness - minBrightness));
        brightness = Math.min(maxBrightness, Math.max(minBrightness, brightness));

        this.currentMedia.style.filter = `brightness(${brightness})`;

        if (!this.brightnessDebugCounter) this.brightnessDebugCounter = 0;
        this.brightnessDebugCounter++;

        if (this.brightnessDebugCounter % 60 === 1 || brightness > 1.5) {
            console.log('💡 밝기 적용:', brightness.toFixed(2), '| 원본 볼륨:', (volume * 100).toFixed(2), '| 민감도:', this.sensitivity, '| 배율:', totalMultiplier.toFixed(1));
        }
    }

    updateSensitivity(event) {
        this.sensitivity = parseInt(event.target.value);
        this.sensitivityValue.textContent = this.sensitivity;
    }

    updateFilterColor(event) {
        this.filterColor = event.target.value;
        this.applyColorFilter();
    }

    updateFilterOpacity(event) {
        this.filterOpacity = parseInt(event.target.value);
        this.opacityValue.textContent = `${this.filterOpacity}%`;
        this.applyColorFilter();
    }

    applyColorFilter() {
        this.colorFilter.style.backgroundColor = this.filterColor;
        this.colorFilter.style.opacity = this.filterOpacity / 100;
    }

    toggleUI() {
        this.uiVisible = !this.uiVisible;
        if (this.uiVisible) {
            this.controlsPanel.classList.remove('hidden');
        } else {
            this.controlsPanel.classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoundInteractiveMedia();
});
