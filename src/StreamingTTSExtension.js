import { StreamingAudioSource } from "./streaming/StreamingAudioSource.js";

/**
 * Extension class that adds streaming TTS capability to the existing Live2DAudioPlayer
 * This works alongside the current chunking system without breaking existing functionality
 */
export class StreamingTTSExtension {
    constructor(audioPlayer, worker) {
        this.audioPlayer = audioPlayer;
        this.worker = worker;
        this.streamingSource = null;
        this.isStreamingActive = false;
        this.isInitialized = false;
        this.currentStreamingOptions = null;
        
        this.initializeStreaming();
    }

    async initializeStreaming() {
        try {
            this.streamingSource = new StreamingAudioSource(24000);
            this.setupWorkerInterception();
            this.isInitialized = true;
            console.log("StreamingTTSExtension: Initialized successfully");
        } catch (error) {
            console.warn("StreamingTTSExtension: Failed to initialize:", error);
            this.isInitialized = false;
        }
    }

    /**
     * Intercept worker messages to enable streaming playback
     */
    setupWorkerInterception() {
        if (!this.worker) return;

        // Store original onmessage handler
        const originalOnMessage = this.worker.onmessage;

        // Create new handler that can switch between modes
        this.worker.onmessage = (e) => {
            if (this.isStreamingActive) {
                // In streaming mode, only handle streaming messages
                this.handleStreamingMessage(e);
            } else {
                // In non-streaming mode, use original handler
                if (originalOnMessage) {
                    originalOnMessage.call(this.worker, e);
                }
            }
        };
    }

    /**
     * Handle worker messages for streaming mode
     */
    handleStreamingMessage(e) {
        const { status, audio } = e.data;

        switch (status) {
            case "stream_audio_data":
                if (audio && this.streamingSource) {
                    // Convert ArrayBuffer to Float32Array and stream immediately
                    const audioData = new Float32Array(audio);
                    this.streamingSource.queueAudioChunk(audioData);
                    
                    // Immediately notify worker that buffer is processed for streaming
                    this.worker.postMessage({ type: "buffer_processed" });
                    
                    // Start lip sync if model is available
                    if (this.audioPlayer.live2dModel && !this.lipSyncActive) {
                        this.startStreamingLipSync();
                    }
                }
                break;

            case "complete":
                // Streaming generation is complete
                console.log("StreamingTTSExtension: Audio generation complete");
                break;

            case "error":
                this.stopStreaming();
                if (this.currentStreamingOptions?.onError) {
                    this.currentStreamingOptions.onError(new Error(e.data.error));
                }
                break;
        }
    }

    /**
     * Start streaming text-to-speech
     */
    async startStreamingTTS(text, options = {}) {
        if (!this.isInitialized) {
            console.warn("StreamingTTSExtension: Not initialized");
            return false;
        }

        if (this.isStreamingActive) {
            console.warn("StreamingTTSExtension: Already streaming");
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
            this.currentStreamingOptions = options;
            this.lipSyncActive = false;

            // Set up streaming audio source
            this.streamingSource.setVolume(volume);
            this.streamingSource.setCallbacks(
                () => {
                    console.log("StreamingTTSExtension: Playback finished");
                    this.stopStreamingLipSync();
                    this.isStreamingActive = false;
                    
                    // Reset expression if requested
                    if (resetExpression && this.audioPlayer.live2dModel) {
                        this.resetExpression();
                    }
                    
                    if (onFinish) onFinish();
                },
                (error) => {
                    console.error("StreamingTTSExtension: Playback error:", error);
                    this.stopStreamingLipSync();
                    this.isStreamingActive = false;
                    
                    if (resetExpression && this.audioPlayer.live2dModel) {
                        this.resetExpression();
                    }
                    
                    if (onError) onError(error);
                }
            );

            // Set expression if specified
            if (expression !== null && this.audioPlayer.live2dModel) {
                this.setExpression(expression);
            }

            // Trigger talking motion
            this.triggerTalkingMotion();

            // Send generation request to worker
            this.worker.postMessage({
                type: "generate",
                text: text,
                voice: voice
            });

            return true;

        } catch (error) {
            console.error("StreamingTTSExtension: Failed to start streaming:", error);
            this.isStreamingActive = false;
            if (onError) onError(error);
            return false;
        }
    }

    /**
     * Start real-time lip sync for streaming audio
     */
    startStreamingLipSync() {
        if (!this.audioPlayer.live2dModel || !this.streamingSource) {
            return;
        }

        this.lipSyncActive = true;
        const analyser = this.streamingSource.getAnalyser();
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateLipSync = () => {
            if (this.lipSyncActive && this.streamingSource.isAudioPlaying()) {
                analyser.getByteFrequencyData(dataArray);
                
                // Calculate mouth parameters from audio data
                const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
                const normalizedVolume = Math.min(volume / 255, 1);
                
                // Extract frequency information for more realistic lip sync
                const lowFreq = dataArray.slice(0, 32).reduce((sum, val) => sum + val, 0) / 32;
                const midFreq = dataArray.slice(32, 64).reduce((sum, val) => sum + val, 0) / 32;
                
                // Calculate mouth open and form parameters
                const mouthOpen = Math.min(normalizedVolume * 3, 1); // Scale for visibility
                const mouthForm = Math.max(-1, Math.min(1, (midFreq - lowFreq) / 128));
                
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
                    // Ignore parameter errors - model might not have these parameters
                }
                
                // Continue updating
                requestAnimationFrame(updateLipSync);
            } else {
                // Reset mouth when not speaking
                this.resetMouthParameters();
            }
        };
        
        // Start lip sync updates
        updateLipSync();
    }

    /**
     * Stop streaming lip sync
     */
    stopStreamingLipSync() {
        this.lipSyncActive = false;
        this.resetMouthParameters();
    }

    /**
     * Reset mouth parameters to neutral position
     */
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

    /**
     * Stop streaming playback
     */
    stopStreaming() {
        if (this.streamingSource) {
            this.streamingSource.stop();
        }
        this.stopStreamingLipSync();
        this.isStreamingActive = false;
        
        if (this.worker) {
            this.worker.postMessage({ type: "stop" });
        }
    }

    /**
     * Helper methods for expressions and motions
     */
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

    resetExpression() {
        if (this.audioPlayer.live2dModel) {
            this.audioPlayer.live2dModel.expression(0);
        }
    }

    triggerTalkingMotion() {
        const talkingGroups = ["tap_body", "talk", "speaking", "idle", "Idle"];
        
        for (const group of talkingGroups) {
            if (this.audioPlayer.triggerRandomMotion?.(group)) {
                break;
            }
        }
    }

    /**
     * Check if streaming is available and active
     */
    isStreamingSupported() {
        return this.isInitialized;
    }

    isCurrentlyStreaming() {
        return this.isStreamingActive;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.stopStreaming();
        
        if (this.streamingSource) {
            this.streamingSource.dispose();
            this.streamingSource = null;
        }
        
        this.isInitialized = false;
    }
}