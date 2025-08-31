import { updateProgress } from "./updateProgress.js";

const SAMPLE_RATE = 24000;

export class StreamingLive2DAudioPlayer {
  constructor(worker, live2dModel) {
    this.worker = worker;
    this.live2dModel = live2dModel;
    this.audioContext = new AudioContext();
    this.audioQueue = [];
    this.isPlaying = false;
    this.totalAudioChunks = 0;
    this.processedAudioChunks = 0;
    this.currentSource = null;
    this.analyser = null;
    this.dataArray = null;
    this.lipSyncActive = false;
    this.lipSyncAnimationId = null;
    
    // Initialize audio analysis for lip sync
    this.initializeAudioAnalysis();
  }

  initializeAudioAnalysis() {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  setLive2DModel(model) {
    this.live2dModel = model;
  }

  setTotalChunks(totalChunks) {
    this.totalAudioChunks = totalChunks;
    this.processedAudioChunks = 0;
  }

  async queueAudio(audioData) {
    // Convert audio data to AudioBuffer for immediate playback
    const audioData2 = new Float32Array(audioData);
    const audioBuffer = this.audioContext.createBuffer(1, audioData2.length, SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(audioData2);
    
    this.audioQueue.push(audioBuffer);
    
    // Start playing immediately if not already playing
    this.playAudioQueue();
    
    // Update progress tracking
    this.processedAudioChunks++;
    const percent = Math.min((this.processedAudioChunks / this.totalAudioChunks) * 100, 99);
    updateProgress(percent, "Streaming audio with Live2D lip sync...");

    // Notify worker that buffer has been processed
    this.worker.postMessage({ type: "buffer_processed" });
  }

  async playAudioQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    this.startLipSync();

    try {
      while (this.audioQueue.length > 0) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        this.currentSource = source;
        source.buffer = this.audioQueue.shift();
        
        // Connect audio graph: source -> analyser -> gain -> destination
        source.connect(this.analyser);
        this.analyser.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
          console.log("AudioContext resumed for streaming playback.");
        }

        console.log("Streaming audio buffer with Live2D lip sync");
        
        await new Promise((resolve) => {
          source.onended = () => {
            this.currentSource = null;
            resolve();
          };
          source.start();
        });

        console.log("Audio chunk completed, continuing stream...");
      }
    } catch (error) {
      console.error("Error during streaming audio playback:", error);
    } finally {
      this.isPlaying = false;
      this.stopLipSync();
    }
  }

  startLipSync() {
    if (!this.live2dModel || this.lipSyncActive) return;
    
    this.lipSyncActive = true;
    console.log("Starting Live2D lip sync for streaming audio");
    
    // Start lip sync animation loop
    const updateLipSync = () => {
      if (!this.lipSyncActive) return;
      
      if (this.analyser && this.dataArray) {
        // Get audio frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate average volume for mouth opening
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;
        
        // Map volume to mouth opening (0.0 to 1.0)
        const mouthOpening = Math.min(average / 128, 1.0);
        
        // Apply mouth parameter to Live2D model
        if (this.live2dModel && this.live2dModel.internalModel) {
          try {
            // Use Live2D parameter control for mouth movement
            const parameterStore = this.live2dModel.internalModel.coreModel;
            if (parameterStore) {
              // Common Live2D mouth parameters
              const mouthParams = ['ParamMouthOpenY', 'PARAM_MOUTH_OPEN_Y', 'MouthOpen'];
              
              for (const paramName of mouthParams) {
                try {
                  const paramIndex = parameterStore.getParameterIndex(paramName);
                  if (paramIndex >= 0) {
                    parameterStore.setParameterValueByIndex(paramIndex, mouthOpening);
                    break;
                  }
                } catch (e) {
                  // Parameter doesn't exist, try next one
                }
              }
            }
          } catch (error) {
            console.warn("Could not apply lip sync parameter:", error);
          }
        }
      }
      
      this.lipSyncAnimationId = requestAnimationFrame(updateLipSync);
    };
    
    updateLipSync();
  }

  stopLipSync() {
    this.lipSyncActive = false;
    if (this.lipSyncAnimationId) {
      cancelAnimationFrame(this.lipSyncAnimationId);
      this.lipSyncAnimationId = null;
    }
    
    // Reset mouth to closed position
    if (this.live2dModel && this.live2dModel.internalModel) {
      try {
        const parameterStore = this.live2dModel.internalModel.coreModel;
        if (parameterStore) {
          const mouthParams = ['ParamMouthOpenY', 'PARAM_MOUTH_OPEN_Y', 'MouthOpen'];
          for (const paramName of mouthParams) {
            try {
              const paramIndex = parameterStore.getParameterIndex(paramName);
              if (paramIndex >= 0) {
                parameterStore.setParameterValueByIndex(paramIndex, 0);
                break;
              }
            } catch (e) {
              // Parameter doesn't exist, try next one
            }
          }
        }
      } catch (error) {
        console.warn("Could not reset mouth parameter:", error);
      }
    }
    
    console.log("Stopped Live2D lip sync");
  }

  // Fallback method for final audio playback (keeps existing functionality)
  async finalizeAudio() {
    // This method is kept for compatibility but won't be used in streaming mode
    console.log("Streaming audio complete - no finalization needed");
    return null;
  }

  async playWithLipsync() {
    // This method is kept for compatibility but won't be used in streaming mode
    console.log("Already playing with lip sync in streaming mode");
  }

  // Get random expression (inherited from original)
  getRandomExpression() {
    if (!this.live2dModel?.internalModel?.expressionManager?.definitions) {
      return null;
    }
    
    const expressions = this.live2dModel.internalModel.expressionManager.definitions;
    if (expressions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * expressions.length);
    return randomIndex;
  }

  // Trigger random motion (inherited from original)  
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
    console.log("Stopping streaming audio playback");
    
    // Stop the currently playing source if any
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource = null;
      } catch (error) {
        console.error("Error stopping current source:", error);
      }
    }
    
    // Stop lip sync
    this.stopLipSync();
    
    this.audioQueue = [];
    this.isPlaying = false;
    
    if (this.worker) {
      this.worker.postMessage({
        type: "stop"
      });
    }
  }

  cleanup() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }

  reset() {
    this.stop();
    this.audioQueue = [];
    this.processedAudioChunks = 0;
    this.totalAudioChunks = 0;
  }
}