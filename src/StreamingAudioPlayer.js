import { updateProgress } from "./updateProgress.js";

const SAMPLE_RATE = 24000;

/**
 * Hybrid Audio Player that provides immediate streaming playback
 * while simultaneously preparing audio for Live2D lipsync
 * 
 * Inspired by StreamingKokoroJS architecture for fast audio start
 */
export class StreamingAudioPlayer {
  constructor(worker, live2dModel) {
    this.worker = worker;
    this.live2dModel = live2dModel;
    
    // Immediate streaming components (like StreamingKokoroJS)
    this.audioContext = new AudioContext();
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentSource = null;
    
    // Live2D preparation components
    this.audioChunks = [];
    this.totalAudioChunks = 0;
    this.processedAudioChunks = 0;
    this.currentAudioUrl = null;
    
    // Control flags
    this.streamingEnabled = true;
    this.live2dEnabled = true;
    this.isStreamingComplete = false;
  }

  setLive2DModel(model) {
    this.live2dModel = model;
  }

  setTotalChunks(totalChunks) {
    this.totalAudioChunks = totalChunks;
    this.processedAudioChunks = 0;
  }

  /**
   * Queue audio for both immediate streaming and Live2D preparation
   * This is the key optimization - start playing immediately!
   */
  async queueAudio(audioData) {
    const audioData2 = new Float32Array(audioData);
    
    // Path 1: Immediate streaming (like StreamingKokoroJS)
    if (this.streamingEnabled) {
      const audioBuffer = this.audioContext.createBuffer(1, audioData2.length, SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(audioData2);
      this.audioQueue.push(audioBuffer);
      this.playAudioQueue(); // Start playing immediately!
    }
    
    // Path 2: Collect for Live2D lipsync (existing approach)
    if (this.live2dEnabled) {
      this.audioChunks.push(audioData2);
    }
    
    // Update progress tracking
    this.processedAudioChunks++;
    const percent = Math.min((this.processedAudioChunks / this.totalAudioChunks) * 100, 99);
    updateProgress(percent, "Streaming audio...");

    // Notify worker that buffer has been processed
    this.worker.postMessage({ type: "buffer_processed" });
  }

  /**
   * Play audio queue immediately (StreamingKokoroJS approach)
   */
  async playAudioQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    try {
      while (this.audioQueue.length > 0) {
        const source = this.audioContext.createBufferSource();
        this.currentSource = source;
        source.buffer = this.audioQueue.shift();
        source.connect(this.audioContext.destination);

        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
          console.log("AudioContext resumed for streaming");
        }

        console.log("Streaming audio buffer immediately");
        await new Promise((resolve) => {
          source.onended = () => {
            this.currentSource = null;
            resolve();
          };
          source.start();
        });
      }
    } catch (error) {
      console.error("Error during immediate audio streaming:", error);
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Prepare audio for Live2D lipsync (runs in parallel with streaming)
   */
  async prepareLive2DAudio() {
    if (this.audioChunks.length === 0) {
      throw new Error('No audio chunks to combine for Live2D');
    }

    console.log(`Preparing ${this.audioChunks.length} audio chunks for Live2D lipsync`);

    // Calculate total length
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    
    // Combine all chunks into a single Float32Array
    const combinedAudio = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert Float32Array to 16-bit PCM WAV format for Live2D compatibility
    const wavBlob = this.createWavBlob(combinedAudio);
    this.currentAudioUrl = URL.createObjectURL(wavBlob);
    
    console.log(`Generated WAV blob for Live2D: ${this.currentAudioUrl}`);
    return this.currentAudioUrl;
  }

  /**
   * Create WAV blob for Live2D compatibility
   */
  createWavBlob(audioData) {
    const sampleRate = SAMPLE_RATE;
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, audioData.length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Start Live2D lipsync (called when audio is ready)
   */
  async playWithLipsync() {
    if (!this.live2dModel) {
      throw new Error('No Live2D model available for lipsync');
    }

    if (!this.currentAudioUrl) {
      throw new Error('No audio URL available for Live2D playback');
    }

    return new Promise((resolve, reject) => {
      // Use the Live2D model's speak function for lip sync
      this.live2dModel.speak(this.currentAudioUrl, {
        volume: 0.0, // Set to 0 since we're already streaming audio
        expression: this.getRandomExpression(),
        resetExpression: true,
        crossOrigin: "anonymous",
        onFinish: () => {
          console.log("Live2D lipsync finished");
          this.cleanup();
          resolve();
        },
        onError: (err) => {
          console.error("Live2D lipsync error:", err);
          this.cleanup();
          reject(err);
        },
      });

      // Trigger a talking motion
      this.triggerRandomMotion("tap_body") ||
        this.triggerRandomMotion("idle") ||
        this.triggerRandomMotion("Idle");
    });
  }

  /**
   * Start early lipsync as soon as we have some audio chunks
   * This is an optimization for faster perceived response
   */
  async startEarlyLipsyncIfReady() {
    // Start lipsync when we have at least 20% of expected audio (reduced from 30%)
    const minChunksForEarlyStart = Math.max(1, Math.floor(this.totalAudioChunks * 0.2));
    
    if (this.audioChunks.length >= minChunksForEarlyStart && !this.currentAudioUrl) {
      try {
        console.log(`Starting early Live2D lipsync with ${this.audioChunks.length}/${this.totalAudioChunks} chunks`);
        await this.prepareLive2DAudio();
        
        // Start lipsync in parallel with continued audio generation
        this.playWithLipsync().catch(err => {
          console.warn("Early lipsync failed, will retry with complete audio:", err);
        });
      } catch (error) {
        console.warn("Early lipsync preparation failed:", error);
      }
    }
  }

  getRandomExpression() {
    if (!this.live2dModel || !this.live2dModel.internalModel.expressionManager) return null;

    const expressions = this.live2dModel.internalModel.expressionManager.definitions || [];
    if (expressions.length === 0) return null;

    return Math.floor(Math.random() * expressions.length);
  }

  triggerRandomMotion(groupName) {
    if (!this.live2dModel) return false;

    const motionManager = this.live2dModel.internalModel.motionManager;
    const motionGroups = motionManager.definitions || {};
    const motions = motionGroups[groupName];

    if (motions && Array.isArray(motions) && motions.length > 0) {
      const randomIndex = Math.floor(Math.random() * motions.length);
      console.log(`Playing random motion: ${groupName}[${randomIndex}]`);
      this.live2dModel.motion(groupName, randomIndex, 2);
      return true;
    }
    return false;
  }

  /**
   * Stop all audio playback and clear queues
   */
  stop() {
    console.log("Stopping streaming audio playback");
    
    // Stop immediate streaming
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource = null;
      } catch (error) {
        console.error("Error stopping current source:", error);
      }
    }
    
    this.audioQueue = [];
    this.isPlaying = false;
    
    // Stop Live2D
    if (this.live2dModel) {
      this.live2dModel.stopSpeaking();
      this.live2dModel.stopMotions();
    }
    
    this.cleanup();
    
    if (this.worker) {
      this.worker.postMessage({ type: "stop" });
    }
  }

  cleanup() {
    // Clean up the temporary audio URL
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    
    // Clear audio chunks
    this.audioChunks = [];
    this.processedAudioChunks = 0;
    this.isStreamingComplete = false;
  }

  reset() {
    this.cleanup();
    this.totalAudioChunks = 0;
    this.audioQueue = [];
    this.isPlaying = false;
  }

  close() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }

  /**
   * Enable/disable streaming vs Live2D modes
   */
  setStreamingMode(streaming) {
    this.streamingEnabled = streaming;
  }

  setLive2DMode(live2d) {
    this.live2dEnabled = live2d;
  }
}