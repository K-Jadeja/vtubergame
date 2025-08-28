const SAMPLE_RATE = 24000;

/**
 * Progressive Live2D Lipsync Manager
 * Builds WAV file progressively as chunks arrive and updates Live2D lipsync
 * Does NOT handle audio playback - only visual lipsync
 */
export class ProgressiveLipsyncManager {
  constructor(live2dModel) {
    this.live2dModel = live2dModel;
    this.audioChunks = [];
    this.currentAudioUrl = null;
    this.isLipsyncActive = false;
    this.lipsyncUpdateThreshold = 0.2; // Start lipsync when 20% of audio is ready
    this.totalExpectedChunks = 0;
    this.receivedChunks = 0;
  }

  setLive2DModel(model) {
    this.live2dModel = model;
  }

  setTotalExpectedChunks(total) {
    this.totalExpectedChunks = total;
    this.receivedChunks = 0;
  }

  /**
   * Add audio chunk and potentially update lipsync
   */
  async addAudioChunk(audioData) {
    const audioData2 = new Float32Array(audioData);
    this.audioChunks.push(audioData2);
    this.receivedChunks++;

    // Check if we should start/update lipsync
    const completionRatio = this.receivedChunks / this.totalExpectedChunks;
    
    if (!this.isLipsyncActive && completionRatio >= this.lipsyncUpdateThreshold) {
      console.log(`Starting progressive lipsync at ${(completionRatio * 100).toFixed(1)}% completion`);
      await this.updateLipsync();
    } else if (this.isLipsyncActive && this.receivedChunks % 3 === 0) {
      // Update every 3rd chunk to avoid too frequent updates
      console.log(`Updating progressive lipsync at ${(completionRatio * 100).toFixed(1)}% completion`);
      await this.updateLipsync();
    }
  }

  /**
   * Build current WAV file and update Live2D lipsync
   */
  async updateLipsync() {
    if (!this.live2dModel || this.audioChunks.length === 0) {
      return;
    }

    try {
      // Clean up previous audio URL
      if (this.currentAudioUrl) {
        URL.revokeObjectURL(this.currentAudioUrl);
      }

      // Build current WAV file
      const wavBlob = this.buildProgressiveWav();
      this.currentAudioUrl = URL.createObjectURL(wavBlob);

      // Start/update Live2D lipsync with SILENT playback
      this.live2dModel.speak(this.currentAudioUrl, {
        volume: 0.0, // SILENT - audio is played by ImmediateAudioPlayer
        expression: this.getRandomExpression(),
        resetExpression: false, // Don't reset expression during updates
        crossOrigin: "anonymous",
        onFinish: () => {
          if (!this.isLipsyncActive) return; // Ignore if we've been stopped
          console.log("Progressive lipsync segment finished");
        },
        onError: (err) => {
          console.warn("Progressive lipsync warning:", err);
        },
      });

      this.isLipsyncActive = true;
      this.triggerTalkingMotion();

    } catch (error) {
      console.error("Error updating progressive lipsync:", error);
    }
  }

  /**
   * Build WAV file from current audio chunks
   */
  buildProgressiveWav() {
    // Calculate total length
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    
    // Combine all chunks into a single Float32Array
    const combinedAudio = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to WAV blob
    return this.createWavBlob(combinedAudio);
  }

  /**
   * Create WAV blob from audio data
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
   * Finalize lipsync - called when all audio chunks are received
   */
  async finalizeLipsync() {
    if (this.audioChunks.length === 0) {
      console.log("No audio chunks for final lipsync");
      return;
    }

    console.log("Finalizing lipsync with complete audio");
    await this.updateLipsync();
  }

  getRandomExpression() {
    if (!this.live2dModel || !this.live2dModel.internalModel.expressionManager) return null;

    const expressions = this.live2dModel.internalModel.expressionManager.definitions || [];
    if (expressions.length === 0) return null;

    return Math.floor(Math.random() * expressions.length);
  }

  triggerTalkingMotion() {
    if (!this.live2dModel) return false;

    // Try different motion groups for talking
    const motionGroups = ["tap_body", "idle", "Idle", "talking", "speak"];
    
    for (const groupName of motionGroups) {
      if (this.triggerRandomMotion(groupName)) {
        return true;
      }
    }
    
    return false;
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

  stop() {
    console.log("Stopping progressive lipsync");
    
    this.isLipsyncActive = false;
    
    if (this.live2dModel) {
      this.live2dModel.stopSpeaking();
      this.live2dModel.stopMotions();
    }
    
    this.cleanup();
  }

  cleanup() {
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
    
    this.audioChunks = [];
    this.receivedChunks = 0;
    this.isLipsyncActive = false;
  }

  reset() {
    this.cleanup();
    this.totalExpectedChunks = 0;
  }
}