/**
 * Optimized Streaming TTS Extension inspired by StreamingKokoroJS architecture
 * This implementation focuses on immediate audio streaming with minimal latency
 */
export class StreamingTTSOptimized {
    constructor(audioPlayer, worker) {
        this.audioPlayer = audioPlayer;
        this.worker = worker;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isStreamingActive = false;
        this.isInitialized = false;
        this.currentSource = null;
        this.analyserNode = null;
        this.gainNode = null;
        this.lipSyncActive = false;
        this.volume = 0.8;
        this.callbacks = {};
        
        this.initializeStreaming();
    }

    async initializeStreaming() {
        try {
            // Set up audio nodes for immediate playback
            this.setupAudioNodes();
            
            // Set up optimized worker handling
            this.setupOptimizedWorkerHandling();
            
            this.isInitialized = true;
            console.log("StreamingTTSOptimized: Initialized successfully");
        } catch (error) {
            console.warn("StreamingTTSOptimized: Failed to initialize:", error);
            this.isInitialized = false;
        }
    }

    setupAudioNodes() {
        // Create analyzer node for real-time lip sync
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 256;
        this.analyserNode.minDecibels = -90;
        this.analyserNode.maxDecibels = -10;
        this.analyserNode.smoothingTimeConstant = 0.85;

        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;

        // Connect nodes: source -> gain -> analyzer -> destination
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
    }

    setupOptimizedWorkerHandling() {
        if (!this.worker) return;

        // Store original handler
        this.originalMessageHandler = this.worker.onmessage;

        // Set up streamlined message handling
        this.worker.onmessage = (e) => {
            if (this.isStreamingActive) {
                this.handleStreamingMessage(e);
            } else if (this.originalMessageHandler) {
                this.originalMessageHandler.call(this.worker, e);
            }
        };
    }

    handleStreamingMessage(e) {
        const { status, audio } = e.data;

        switch (status) {
            case "stream_audio_data":
                if (audio) {
                    // Immediate audio playback - no queuing delay
                    this.playAudioImmediately(new Float32Array(audio));
                    
                    // Immediately signal buffer processed for continuous streaming
                    this.worker.postMessage({ type: "buffer_processed" });
                    
                    // Start lip sync on first audio data
                    if (this.audioPlayer.live2dModel && !this.lipSyncActive) {
                        this.startOptimizedLipSync();
                    }
                }
                break;

            case "complete":
                console.log("StreamingTTSOptimized: Audio generation complete");
                // Keep playing until all audio is finished
                break;

            case "error":
                console.error("StreamingTTSOptimized: Worker error, falling back to mock");
                this.stopStreaming();
                // Automatically fall back to mock streaming on worker error
                this.fallbackToMockStreaming();
                break;
        }
    }

    async fallbackToMockStreaming() {
        try {
            const { MockStreamingTTS } = await import("./MockStreamingTTS.js");
            const mockStreaming = new MockStreamingTTS(this.audioPlayer);
            
            // Get the text from the input (assuming it's still there)
            const text = document.getElementById("tts-text")?.value || "Hello! I'm a Live2D model!";
            
            const success = await mockStreaming.startStreamingTTS(text, this.callbacks);
            if (success) {
                console.log("Successfully switched to mock streaming");
            }
        } catch (error) {
            console.error("Mock streaming fallback failed:", error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }

    async playAudioImmediately(audioData) {
        try {
            // Resume audio context if needed
            if (this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }

            // Create and play buffer immediately
            const audioBuffer = this.audioContext.createBuffer(1, audioData.length, 24000);
            audioBuffer.getChannelData(0).set(audioData);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // Connect to our audio chain
            source.connect(this.gainNode);

            // Track current source for stopping
            if (this.currentSource) {
                try {
                    this.currentSource.stop();
                } catch (e) {
                    // Ignore errors when stopping previous source
                }
            }
            this.currentSource = source;

            // Set up completion handling
            source.onended = () => {
                this.currentSource = null;
                if (!this.isStreamingActive && this.callbacks.onFinish) {
                    this.stopOptimizedLipSync();
                    this.callbacks.onFinish();
                }
            };

            // Start immediate playback
            source.start();

        } catch (error) {
            console.warn("StreamingTTSOptimized: Error playing audio immediately:", error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }
    }

    async startStreamingTTS(text, options = {}) {
        if (!this.isInitialized) {
            console.warn("StreamingTTSOptimized: Not initialized, switching to mock mode");
            // Switch to mock streaming if real streaming fails
            const mockStreaming = new (await import("./MockStreamingTTS.js")).MockStreamingTTS(this.audioPlayer);
            return await mockStreaming.startStreamingTTS(text, options);
        }

        if (this.isStreamingActive) {
            console.warn("StreamingTTSOptimized: Already streaming");
            return false;
        }

        const {
            voice = "af_nicole",
            volume = 0.8,
            expression = null,
            resetExpression = true,
            onFinish,
            onError
        } = options;

        try {
            this.isStreamingActive = true;
            this.callbacks = { onFinish, onError };
            this.lipSyncActive = false;

            // Set volume
            this.volume = volume;
            if (this.gainNode) {
                this.gainNode.gain.value = volume;
            }

            // Set expression if specified
            if (expression !== null && this.audioPlayer.live2dModel) {
                this.setExpression(expression);
            }

            // Trigger talking motion
            this.triggerTalkingMotion();

            // Start streaming generation immediately
            this.worker.postMessage({
                type: "generate",
                text: text,
                voice: voice
            });

            return true;

        } catch (error) {
            console.error("StreamingTTSOptimized: Failed to start streaming:", error);
            this.isStreamingActive = false;
            
            // Fallback to mock streaming on error
            try {
                const mockStreaming = new (await import("./MockStreamingTTS.js")).MockStreamingTTS(this.audioPlayer);
                return await mockStreaming.startStreamingTTS(text, options);
            } catch (mockError) {
                console.error("Mock streaming also failed:", mockError);
                if (onError) onError(error);
                return false;
            }
        }
    }

    startOptimizedLipSync() {
        if (!this.audioPlayer.live2dModel || !this.analyserNode) {
            return;
        }

        this.lipSyncActive = true;
        const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        
        const updateLipSync = () => {
            if (this.lipSyncActive) {
                this.analyserNode.getByteFrequencyData(dataArray);
                
                // Calculate mouth parameters from real-time audio
                const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
                const normalizedVolume = Math.min(volume / 255, 1);
                
                // Advanced frequency analysis for realistic lip sync
                const lowFreq = dataArray.slice(0, 32).reduce((sum, val) => sum + val, 0) / 32;
                const midFreq = dataArray.slice(32, 64).reduce((sum, val) => sum + val, 0) / 32;
                const highFreq = dataArray.slice(64, 96).reduce((sum, val) => sum + val, 0) / 32;
                
                // Calculate mouth parameters
                const mouthOpen = Math.min(normalizedVolume * 3.5, 1); // More responsive
                const mouthForm = Math.max(-1, Math.min(1, (midFreq - lowFreq) / 100));
                
                // Update Live2D parameters
                try {
                    const coreModel = this.audioPlayer.live2dModel.internalModel?.coreModel;
                    if (coreModel) {
                        coreModel.setParameterValueById('ParamMouthOpenY', mouthOpen);
                        if (coreModel.getParameterIndex('ParamMouthForm') !== -1) {
                            coreModel.setParameterValueById('ParamMouthForm', mouthForm);
                        }
                    }
                } catch (error) {
                    // Ignore parameter errors
                }
                
                // Continue updating at high frequency for smooth animation
                requestAnimationFrame(updateLipSync);
            } else {
                // Reset mouth when not speaking
                this.resetMouthParameters();
            }
        };
        
        // Start immediate lip sync updates
        updateLipSync();
    }

    stopOptimizedLipSync() {
        this.lipSyncActive = false;
        this.resetMouthParameters();
    }

    resetMouthParameters() {
        try {
            const coreModel = this.audioPlayer.live2dModel?.internalModel?.coreModel;
            if (coreModel) {
                coreModel.setParameterValueById('ParamMouthOpenY', 0);
                if (coreModel.getParameterIndex('ParamMouthForm') !== -1) {
                    coreModel.setParameterValueById('ParamMouthForm', 0);
                }
            }
        } catch (error) {
            // Ignore parameter errors
        }
    }

    stopStreaming() {
        // Stop current audio source
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource = null;
            } catch (error) {
                console.warn("StreamingTTSOptimized: Error stopping current source", error);
            }
        }

        // Stop lip sync
        this.stopOptimizedLipSync();
        this.isStreamingActive = false;
        
        // Signal worker to stop
        if (this.worker) {
            this.worker.postMessage({ type: "stop" });
        }
    }

    // Helper methods
    setExpression(expression) {
        if (!this.audioPlayer.live2dModel?.internalModel?.expressionManager) return;

        const expressions = this.audioPlayer.live2dModel.internalModel.expressionManager.definitions || [];
        if (expressions.length === 0) return;

        let expressionIndex;
        if (typeof expression === "string") {
            expressionIndex = expressions.findIndex(exp => exp.name === expression);
            if (expressionIndex === -1) expressionIndex = 0;
        } else {
            expressionIndex = Math.min(Math.max(0, expression), expressions.length - 1);
        }

        this.audioPlayer.live2dModel.expression(expressionIndex);
    }

    triggerTalkingMotion() {
        const talkingGroups = ["tap_body", "talk", "speaking", "idle", "Idle"];
        
        for (const group of talkingGroups) {
            if (this.audioPlayer.triggerRandomMotion?.(group)) {
                break;
            }
        }
    }

    // Public interface
    isStreamingSupported() {
        return this.isInitialized;
    }

    isCurrentlyStreaming() {
        return this.isStreamingActive;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }

    dispose() {
        this.stopStreaming();
        
        if (this.analyserNode) {
            this.analyserNode.disconnect();
            this.analyserNode = null;
        }
        
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }

        if (this.audioContext && this.audioContext.state !== "closed") {
            this.audioContext.close();
        }
        
        this.isInitialized = false;
    }
}