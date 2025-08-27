import { updateProgress } from "./updateProgress.js";

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
  }

  setLive2DModel(model) {
    this.live2dModel = model;
  }

  setTotalChunks(totalChunks) {
    this.totalAudioChunks = totalChunks;
    this.processedAudioChunks = 0;
  }

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
}