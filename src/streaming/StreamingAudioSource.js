/**
 * A streaming audio source that can accept audio chunks and provide analysis for lip sync.
 * This class bridges the gap between streaming audio generation (like Kokoro TTS) and 
 * the existing Live2D lip sync system.
 */
export class StreamingAudioSource {
    constructor(sampleRate = 24000) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioQueue = [];
        this.isPlaying = false;
        this.currentSource = null;
        this.analyserNode = null;
        this.gainNode = null;
        this.volume = 0.5;
        this.onFinish = null;
        this.onError = null;
        this.sampleRate = sampleRate;
        this.setupAudioNodes();
    }

    setupAudioNodes() {
        // Create analyzer node for lip sync
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

    /**
     * Set volume for playback
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }

    /**
     * Set callbacks for finish and error events
     */
    setCallbacks(onFinish, onError) {
        this.onFinish = onFinish;
        this.onError = onError;
    }

    /**
     * Add an audio chunk to the playback queue
     * @param {Float32Array} audioData - Float32Array containing audio samples
     */
    async queueAudioChunk(audioData) {
        try {
            // Create audio buffer from the chunk
            const audioBuffer = this.audioContext.createBuffer(1, audioData.length, this.sampleRate);
            audioBuffer.getChannelData(0).set(audioData);
            
            this.audioQueue.push(audioBuffer);
            
            // Start playback if not already playing
            this.playAudioQueue();
        } catch (error) {
            console.warn("StreamingAudioSource: Failed to queue audio chunk", error);
            if (this.onError) this.onError(error);
        }
    }

    /**
     * Process the audio queue and play buffers sequentially
     */
    async playAudioQueue() {
        if (this.isPlaying || this.audioQueue.length === 0) {
            return;
        }

        this.isPlaying = true;

        try {
            while (this.audioQueue.length > 0) {
                const buffer = this.audioQueue.shift();
                await this.playBuffer(buffer);
            }
        } catch (error) {
            console.warn("StreamingAudioSource: Error during audio playback", error);
            if (this.onError) this.onError(error);
        } finally {
            this.isPlaying = false;
            if (this.onFinish) this.onFinish();
        }
    }

    /**
     * Play a single audio buffer
     */
    async playBuffer(buffer) {
        return new Promise((resolve, reject) => {
            try {
                // Resume audio context if suspended
                if (this.audioContext.state === "suspended") {
                    this.audioContext.resume();
                }

                // Create buffer source
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                this.currentSource = source;

                // Connect to our audio chain
                source.connect(this.gainNode);

                // Set up event handlers
                source.onended = () => {
                    this.currentSource = null;
                    resolve();
                };

                // Start playback
                source.start();
            } catch (error) {
                this.currentSource = null;
                reject(error);
            }
        });
    }

    /**
     * Stop current playback and clear queue
     */
    stop() {
        // Stop current source
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource = null;
            } catch (error) {
                console.warn("StreamingAudioSource: Error stopping current source", error);
            }
        }

        // Clear queue
        this.audioQueue = [];
        this.isPlaying = false;
    }

    /**
     * Get the analyser node for lip sync analysis
     */
    getAnalyser() {
        return this.analyserNode;
    }

    /**
     * Get the audio context
     */
    getAudioContext() {
        return this.audioContext;
    }

    /**
     * Check if audio is currently playing
     */
    isAudioPlaying() {
        return this.isPlaying;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
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
    }
}