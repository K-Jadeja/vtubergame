import { updateProgress } from "./updateProgress.js";

const SAMPLE_RATE = 24000;

/**
 * Immediate Audio Player - Direct port of StreamingKokoroJS AudioPlayer
 * This handles ONLY immediate audio streaming to speakers
 * No Live2D integration - just pure streaming audio playback
 */
export class ImmediateAudioPlayer {
  constructor(worker) {
    this.audioContext = new AudioContext();
    this.audioQueue = [];
    this.isPlaying = false;
    this.worker = worker;
    this.totalAudioChunks = 0;
    this.processedAudioChunks = 0;
    this.currentSource = null;
  }

  setTotalChunks(totalChunks) {
    this.totalAudioChunks = totalChunks;
    this.processedAudioChunks = 0;
  }

  async queueAudio(audioData) {
    const audioData2 = new Float32Array(audioData);
    const audioBuffer = this.audioContext.createBuffer(1, audioData2.length, SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(audioData2);
    this.audioQueue.push(audioBuffer);
    this.playAudioQueue();
  }

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
          console.log("AudioContext resumed for immediate streaming");
        }

        console.log("Playing audio buffer immediately");
        await new Promise((resolve) => {
          source.onended = () => {
            this.currentSource = null;
            resolve();
          };
          source.start();
        });

        console.log("Audio buffer finished playing");

        // Update progress tracking
        this.processedAudioChunks++;
        const percent = Math.min((this.processedAudioChunks / this.totalAudioChunks) * 100, 99);
        updateProgress(percent, "Streaming audio...");

        this.worker.postMessage({ type: "buffer_processed" });
      }
    } catch (error) {
      console.error("Error during immediate audio streaming:", error);
    } finally {
      this.isPlaying = false;
    }
  }

  stop() {
    console.log("Stopping immediate audio playback");
    
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
    
    if (this.worker) {
      this.worker.postMessage({ type: "stop" });
    }
  }

  close() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
  }

  getAudioContext() {
    return this.audioContext;
  }
}