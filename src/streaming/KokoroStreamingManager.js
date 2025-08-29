import { StreamingAudioSource } from "./StreamingAudioSource.js";

/**
 * Manager for Kokoro TTS streaming integration with Live2D lip sync.
 * This class handles the coordination between text-to-speech generation 
 * and the Live2D lip sync system.
 */
export class KokoroStreamingManager {
    constructor(worker, config = {}) {
        this.ttsWorker = worker;
        this.streamingAudioSource = null;
        this.isInitialized = false;
        this.isGenerating = false;
        this.config = {
            modelId: "onnx-community/Kokoro-82M-v1.0-ONNX",
            device: null,
            dtype: "fp32",
            ...config
        };
        this.voices = {};
        this.currentText = "";
        this.currentOptions = {};
    }

    /**
     * Initialize the Kokoro TTS system
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log("KokoroStreamingManager: Initializing streaming TTS system...");
            
            // Initialize streaming audio source
            this.streamingAudioSource = new StreamingAudioSource(24000);
            
            // Set up worker message handling
            this.setupWorkerHandlers();
            
            this.isInitialized = true;
            console.log("KokoroStreamingManager: Streaming TTS system initialized successfully");
            
        } catch (error) {
            console.warn("KokoroStreamingManager: Failed to initialize streaming TTS system", error);
            throw error;
        }
    }

    /**
     * Set up worker message handlers for streaming
     */
    setupWorkerHandlers() {
        if (!this.ttsWorker) {
            console.warn("KokoroStreamingManager: No TTS worker available");
            return;
        }

        // Store original handlers if they exist
        this.originalMessageHandler = this.ttsWorker.onmessage;

        // Set up our streaming handler
        this.ttsWorker.addEventListener("message", this.handleWorkerMessage.bind(this));
    }

    /**
     * Handle messages from the TTS worker
     */
    handleWorkerMessage(e) {
        const { status, audio, voices } = e.data;

        switch (status) {
            case "loading_model_ready":
                if (voices) {
                    this.voices = voices;
                }
                break;

            case "stream_audio_data":
                if (audio && this.streamingAudioSource) {
                    // Convert ArrayBuffer to Float32Array and queue for streaming playback
                    const audioData = new Float32Array(audio);
                    this.streamingAudioSource.queueAudioChunk(audioData);
                }
                break;

            case "complete":
                // Audio generation complete, streaming will continue until all chunks are played
                break;

            case "error":
                console.error("KokoroStreamingManager: Worker error:", e.data.error);
                this.isGenerating = false;
                if (this.currentOptions.onError) {
                    this.currentOptions.onError(new Error(e.data.error));
                }
                break;
        }

        // Also call original handler if it exists
        if (this.originalMessageHandler) {
            this.originalMessageHandler.call(this.ttsWorker, e);
        }
    }

    /**
     * Generate streaming audio from text
     */
    async generateSpeech(text, options = {}) {
        if (!this.isInitialized) {
            console.warn("KokoroStreamingManager: System not initialized");
            await this.initialize();
        }

        if (this.isGenerating) {
            console.warn("KokoroStreamingManager: Already generating speech");
            return false;
        }

        const {
            voice = "af_nicole",
            speed = 1,
            volume = 0.8,
            onFinish,
            onError
        } = options;

        try {
            this.isGenerating = true;
            this.currentText = text;
            this.currentOptions = options;
            
            if (!this.streamingAudioSource) {
                throw new Error("Streaming audio source not initialized");
            }

            // Set up audio source
            this.streamingAudioSource.setVolume(volume);
            this.streamingAudioSource.setCallbacks(
                () => {
                    this.isGenerating = false;
                    console.log("KokoroStreamingManager: Speech playback completed");
                    if (onFinish) onFinish();
                },
                (error) => {
                    this.isGenerating = false;
                    console.error("KokoroStreamingManager: Playback error:", error);
                    if (onError) onError(error);
                }
            );

            // Send generation request to worker
            if (this.ttsWorker) {
                this.ttsWorker.postMessage({
                    type: "generate",
                    text: text,
                    voice: voice
                });
            }
            
            return true;
            
        } catch (error) {
            this.isGenerating = false;
            console.warn("KokoroStreamingManager: Failed to generate speech", error);
            if (onError) onError(error);
            return false;
        }
    }

    /**
     * Stop current speech generation and playback
     */
    stop() {
        if (this.streamingAudioSource) {
            this.streamingAudioSource.stop();
        }
        
        if (this.ttsWorker) {
            this.ttsWorker.postMessage({ type: "stop" });
        }
        
        this.isGenerating = false;
    }

    /**
     * Get the analyser node for lip sync
     */
    getAnalyser() {
        return this.streamingAudioSource?.getAnalyser() || null;
    }

    /**
     * Get available voices
     */
    getVoices() {
        return { ...this.voices };
    }

    /**
     * Check if system is currently generating speech
     */
    isCurrentlyGenerating() {
        return this.isGenerating;
    }

    /**
     * Check if audio is currently playing
     */
    isCurrentlyPlaying() {
        return this.streamingAudioSource?.isAudioPlaying() || false;
    }

    /**
     * Check if system is initialized
     */
    isSystemInitialized() {
        return this.isInitialized;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
        if (this.streamingAudioSource) {
            this.streamingAudioSource.dispose();
            this.streamingAudioSource = null;
        }
        
        this.isInitialized = false;
    }
}