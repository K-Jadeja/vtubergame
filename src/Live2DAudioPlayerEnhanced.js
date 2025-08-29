import { updateProgress } from "./updateProgress.js";
import { KokoroStreamingManager } from "./streaming/KokoroStreamingManager.js";

const SAMPLE_RATE = 24000;

export class Live2DAudioPlayer {
  constructor(worker, live2dModel) {
    this.worker = worker;
    this.live2dModel = live2dModel;
    this.audioChunks = [];
    this.isProcessing = false;
    this.totalAudioChunks = 0;
    this.processedAudioChunks = 0;
    this.currentAudioUrl = null;
    
    // New streaming functionality
    this.streamingManager = null;
    this.useStreaming = true; // Default to streaming for better performance
    
    this.initializeStreaming();
  }

  /**
   * Initialize streaming TTS support
   */
  async initializeStreaming() {
    try {
      this.streamingManager = new KokoroStreamingManager(this.worker);
      await this.streamingManager.initialize();
      console.log("Live2DAudioPlayer: Streaming TTS initialized");
    } catch (error) {
      console.warn("Live2DAudioPlayer: Failed to initialize streaming, falling back to chunking", error);
      this.useStreaming = false;
    }
  }

  setLive2DModel(model) {
    this.live2dModel = model;
  }

  setTotalChunks(totalChunks) {
    this.totalAudioChunks = totalChunks;
    this.processedAudioChunks = 0;
  }

  /**
   * NEW: Direct text-to-speech with streaming
   * This is the new primary method for TTS
   */
  async speakText(text, options = {}) {
    if (!this.live2dModel) {
      throw new Error('No Live2D model available for speech');
    }

    // Check if streaming is available
    if (this.useStreaming && this.streamingManager) {
      return this.speakTextStreaming(text, options);
    } else {
      // Fallback to old chunking method
      console.warn("Live2DAudioPlayer: Streaming not available, using legacy chunking method");
      return this.speakTextLegacy(text, options);
    }
  }

  /**
   * New streaming text-to-speech method
   */
  async speakTextStreaming(text, options = {}) {
    const {
      voice = "af_nicole",
      volume = 0.8,
      expression = null,
      resetExpression = true,
      onFinish = null,
      onError = null
    } = options;

    try {
      // Set expression if specified
      if (expression !== null && this.live2dModel) {
        this.setExpression(expression);
      }

      // Trigger talking motion
      this.triggerRandomTalkingMotion();

      // Start streaming TTS generation
      const success = await this.streamingManager.generateSpeech(text, {
        voice,
        volume,
        onFinish: () => {
          console.log("Live2DAudioPlayer: Streaming speech completed");
          
          // Reset expression if requested
          if (resetExpression) {
            this.resetExpression();
          }
          
          if (onFinish) onFinish();
        },
        onError: (error) => {
          console.error("Live2DAudioPlayer: Streaming speech error:", error);
          
          // Reset expression on error
          if (resetExpression) {
            this.resetExpression();
          }
          
          if (onError) onError(error);
        }
      });

      // Set up lip sync if Live2D model supports it
      if (success && this.live2dModel && this.streamingManager) {
        this.setupStreamingLipSync();
      }

      return success;

    } catch (error) {
      console.error("Live2DAudioPlayer: Failed to start streaming speech:", error);
      if (onError) onError(error);
      return false;
    }
  }

  /**
   * Set up real-time lip sync for streaming audio
   */
  setupStreamingLipSync() {
    const analyser = this.streamingManager.getAnalyser();
    if (!analyser || !this.live2dModel) {
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLipSync = () => {
      if (this.streamingManager.isCurrentlyPlaying()) {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate mouth open value from audio data
        const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const normalizedVolume = Math.min(volume / 255, 1);
        const mouthOpen = normalizedVolume * 2; // Scale for better visibility
        
        // Update Live2D mouth parameters
        try {
          if (this.live2dModel.internalModel && this.live2dModel.internalModel.coreModel) {
            this.live2dModel.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthOpen);
          }
        } catch (error) {
          // Ignore parameter errors - model might not have these parameters
        }
        
        // Continue updating
        requestAnimationFrame(updateLipSync);
      } else {
        // Reset mouth when not speaking
        try {
          if (this.live2dModel.internalModel && this.live2dModel.internalModel.coreModel) {
            this.live2dModel.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0);
          }
        } catch (error) {
          // Ignore parameter errors
        }
      }
    };
    
    // Start lip sync updates
    updateLipSync();
  }

  /**
   * Legacy chunking method for backward compatibility
   */
  async speakTextLegacy(text, options = {}) {
    const { voice = "af_nicole" } = options;
    
    // Use the existing chunking workflow
    this.setTotalChunks(Math.ceil(text.length / 300));
    this.reset();

    // Send to worker for chunking
    this.worker.postMessage({
      type: "generate",
      text: text,
      voice: voice
    });

    // Wait for chunking to complete, then play
    return new Promise((resolve, reject) => {
      const checkComplete = () => {
        if (this.processedAudioChunks >= this.totalAudioChunks) {
          this.finalizeAudio()
            .then(() => this.playWithLipsync())
            .then(() => resolve(true))
            .catch(reject);
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });
  }

  // Helper methods for expressions and motions
  setExpression(expression) {
    if (!this.live2dModel || !this.live2dModel.internalModel.expressionManager) return;

    const expressions = this.live2dModel.internalModel.expressionManager.definitions || [];
    if (expressions.length === 0) return;

    let expressionIndex;
    if (typeof expression === "string") {
      // Find expression by name
      expressionIndex = expressions.findIndex(exp => exp.name === expression);
      if (expressionIndex === -1) expressionIndex = 0;
    } else {
      expressionIndex = Math.min(Math.max(0, expression), expressions.length - 1);
    }

    this.live2dModel.expression(expressionIndex);
  }

  resetExpression() {
    if (this.live2dModel) {
      this.live2dModel.expression(0); // Assume 0 is default/neutral
    }
  }

  triggerRandomTalkingMotion() {
    // Try different talking motion groups
    const talkingGroups = ["tap_body", "talk", "speaking", "idle", "Idle"];
    
    for (const group of talkingGroups) {
      if (this.triggerRandomMotion(group)) {
        break;
      }
    }
  }

  // Existing methods - kept for backward compatibility
  async queueAudio(audioData) {
    // Collect audio chunks as Float32Arrays
    const audioData2 = new Float32Array(audioData);
    this.audioChunks.push(audioData2);
    
    // Update progress tracking
    this.processedAudioChunks++;
    const percent = Math.min((this.processedAudioChunks / this.totalAudioChunks) * 100, 99);
    updateProgress(percent, "Processing audio chunks...");

    // Notify worker that buffer has been processed
    this.worker.postMessage({ type: "buffer_processed" });
  }

  async finalizeAudio() {
    if (this.audioChunks.length === 0) {
      throw new Error('No audio chunks to combine');
    }

    console.log(`Finalizing ${this.audioChunks.length} audio chunks for Live2D`);

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
    
    console.log(`Generated WAV blob: ${this.currentAudioUrl}`);
    return this.currentAudioUrl;
  }

  // Create a properly formatted WAV blob that Live2D can handle
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

  async playWithLipsync() {
    if (!this.live2dModel) {
      throw new Error('No Live2D model available for lipsync');
    }

    if (!this.currentAudioUrl) {
      throw new Error('No audio URL available for playback');
    }

    return new Promise((resolve, reject) => {
      // Use the Live2D model's speak function for lip sync
      this.live2dModel.speak(this.currentAudioUrl, {
        volume: 0.8,
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

  // Stop audio playback and clear the queue
  stop() {
    console.log("Stopping Live2D audio playback");
    
    // Stop streaming if active
    if (this.streamingManager) {
      this.streamingManager.stop();
    }
    
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
    this.isProcessing = false;
    this.processedAudioChunks = 0;
  }

  reset() {
    this.cleanup();
    this.totalAudioChunks = 0;
  }

  /**
   * Check if streaming TTS is available
   */
  hasStreamingSupport() {
    return this.useStreaming && this.streamingManager && this.streamingManager.isSystemInitialized();
  }

  /**
   * Get available voices for streaming TTS
   */
  getAvailableVoices() {
    if (this.streamingManager) {
      return this.streamingManager.getVoices();
    }
    return {};
  }
}