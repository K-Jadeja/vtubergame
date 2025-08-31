import { updateProgress } from "./updateProgress.js";

const SAMPLE_RATE = 24000;

export class StreamingLive2DAudioPlayer {
  constructor(worker, live2dModel) {
    this.worker = worker;
    this.live2dModel = live2dModel;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioQueue = [];
    this.isPlaying = false;
    this.totalAudioChunks = 0;
    this.processedAudioChunks = 0;
    this.currentSource = null; // Track current audio source for stopping
    this.isStreamingSpeech = false; // Track if we're in streaming speech mode
    this.currentMotionPromise = null; // Track talking motion
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
    
    // Start streaming immediately if not already playing
    if (!this.isPlaying) {
      this.startStreamingPlayback();
    }
    
    // Update progress tracking
    this.processedAudioChunks++;
    const percent = Math.min((this.processedAudioChunks / this.totalAudioChunks) * 100, 99);
    updateProgress(percent, "Streaming audio...");

    // Notify worker that buffer has been processed
    this.worker.postMessage({ type: "buffer_processed" });
  }

  async startStreamingPlayback() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.isStreamingSpeech = true;
    
    // Start talking motion when we begin streaming
    this.startTalkingMotion();
    
    try {
      while (this.audioQueue.length > 0 || this.isStreamingSpeech) {
        // Wait for audio chunks if queue is empty but streaming is active
        if (this.audioQueue.length === 0 && this.isStreamingSpeech) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        if (this.audioQueue.length === 0) break;
        
        const source = this.audioContext.createBufferSource();
        this.currentSource = source;
        source.buffer = this.audioQueue.shift();
        source.connect(this.audioContext.destination);

        // Resume audio context if suspended
        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
          console.log("AudioContext resumed for streaming.");
        }

        console.log("Playing audio chunk");
        await new Promise((resolve) => {
          source.onended = () => {
            this.currentSource = null;
            resolve();
          };
          source.start();
        });
      }
    } catch (error) {
      console.error("Error during streaming audio playback:", error);
    } finally {
      this.isPlaying = false;
      this.isStreamingSpeech = false;
      this.stopTalkingMotion();
    }
  }

  startTalkingMotion() {
    if (!this.live2dModel) return;
    
    // Trigger a talking motion and set random expression
    const expression = this.getRandomExpression();
    if (expression !== null) {
      console.log(`Setting expression: ${expression}`);
      this.live2dModel.expression(expression);
    }
    
    // Trigger talking motion
    const motionStarted = this.triggerRandomMotion("tap_body") ||
                         this.triggerRandomMotion("idle") ||
                         this.triggerRandomMotion("Idle");
    
    if (!motionStarted) {
      console.log("No talking motion found, continuing without motion");
    }
  }

  stopTalkingMotion() {
    if (!this.live2dModel) return;
    
    // Reset expression after speech
    console.log("Resetting expression after speech");
    this.live2dModel.expression(0); // Reset to neutral
  }

  finishStreaming() {
    this.isStreamingSpeech = false;
    console.log("Streaming finished, waiting for remaining audio to complete");
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
    
    this.audioQueue = [];
    this.isPlaying = false;
    this.isStreamingSpeech = false;
    
    // Stop Live2D motions and reset expression
    if (this.live2dModel) {
      this.live2dModel.stopMotions();
      this.live2dModel.expression(0); // Reset to neutral expression
    }
    
    if (this.worker) {
      this.worker.postMessage({ type: "stop" });
    }
  }

  cleanup() {
    this.audioQueue = [];
    this.isPlaying = false;
    this.isStreamingSpeech = false;
    this.processedAudioChunks = 0;
    this.currentSource = null;
  }

  reset() {
    this.cleanup();
    this.totalAudioChunks = 0;
  }

  close() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }
}