// tts.js - Kokoro.js TTS implementation with fallback
// import { Kokoro } from 'kokoro-js';

/**
 * TTS Engine using Kokoro.js for high-quality text-to-speech
 */
class KokoroTTSEngine {
  constructor() {
    this.kokoro = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the Kokoro TTS engine
   */
  async initialize() {
    try {
      console.log('Attempting to initialize Kokoro TTS engine...');
      
      // Try to import and initialize Kokoro
      try {
        const { Kokoro } = await import('kokoro-js');
        
        // Initialize Kokoro with default settings
        this.kokoro = new Kokoro({
          // Configure for web usage
          webWorker: true,
          // Use a female voice that would work well with Live2D
          voiceId: 'af_sarah', // or another suitable voice
        });

        await this.kokoro.initialize();
        this.isInitialized = true;
        
        console.log('Kokoro TTS engine initialized successfully');
        return true;
      } catch (importError) {
        console.warn('Kokoro.js not available:', importError.message);
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize Kokoro TTS engine:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Generate speech audio from text using Kokoro.js
   * @param {string} text - Text to convert to speech
   * @returns {Promise<string>} - Audio blob URL
   */
  async generateSpeech(text) {
    if (!this.isInitialized || !this.kokoro) {
      throw new Error('Kokoro TTS engine not initialized');
    }

    try {
      console.log(`Generating speech for: "${text}"`);
      
      // Generate audio using Kokoro
      const audioBuffer = await this.kokoro.generate(text, {
        // Configure speech parameters for natural sound
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });

      // Convert AudioBuffer to Blob
      const audioBlob = await this.audioBufferToWave(audioBuffer);
      
      // Create blob URL
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log('Speech generated successfully');
      return audioUrl;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Convert AudioBuffer to WAV blob - use fallback implementation
   */
  async audioBufferToWave(buffer) {
    // Reuse fallback engine's implementation
    const fallback = new FallbackTTSEngine();
    return fallback.audioBufferToWave(buffer);
  }

  /**
   * Check if the engine is ready
   */
  isReady() {
    return this.isInitialized && this.kokoro !== null;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.kokoro) {
      // Cleanup Kokoro resources if available
      if (typeof this.kokoro.destroy === 'function') {
        this.kokoro.destroy();
      }
      this.kokoro = null;
    }
    this.isInitialized = false;
  }
}

// Fallback TTS using Web Speech API with audio synthesis
class FallbackTTSEngine {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    this.isInitialized = true;
    return true;
  }

  async generateSpeech(text) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Using fallback synthetic speech generation...');
        
        // Create an audio context for generating synthetic speech-like audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Generate speech-like audio based on text
        this.generateSyntheticSpeech(audioContext, text).then(audioBlob => {
          const audioUrl = URL.createObjectURL(audioBlob);
          resolve(audioUrl);
        }).catch(reject);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate synthetic speech-like audio
   */
  async generateSyntheticSpeech(audioContext, text) {
    return new Promise((resolve, reject) => {
      try {
        // Calculate duration based on text length (average speaking rate)
        const wordsPerMinute = 150;
        const wordCount = text.split(' ').length;
        const baseDuration = (wordCount / wordsPerMinute) * 60;
        const duration = Math.max(1, baseDuration); // At least 1 second
        
        const sampleRate = audioContext.sampleRate;
        const frameCount = Math.floor(sampleRate * duration);
        
        // Create audio buffer
        const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Generate speech-like waveform with phonemes and pauses
        let currentFrame = 0;
        const words = text.split(' ');
        
        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
          const word = words[wordIndex];
          const wordDuration = (word.length * 0.08) + 0.2; // Base time per word
          const wordFrames = Math.floor(sampleRate * wordDuration);
          
          // Generate word audio
          this.generateWordAudio(channelData, currentFrame, wordFrames, word, sampleRate);
          currentFrame += wordFrames;
          
          // Add pause between words
          const pauseFrames = Math.floor(sampleRate * 0.1);
          for (let i = 0; i < pauseFrames && currentFrame < frameCount; i++, currentFrame++) {
            channelData[currentFrame] = 0;
          }
        }
        
        // Convert to WAV blob
        const wavBlob = this.audioBufferToWave(audioBuffer);
        resolve(wavBlob);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate audio for a single word
   */
  generateWordAudio(channelData, startFrame, wordFrames, word, sampleRate) {
    const baseFreq = 150; // Fundamental frequency for female voice
    
    for (let i = 0; i < wordFrames && (startFrame + i) < channelData.length; i++) {
      const time = i / sampleRate;
      const progress = i / wordFrames;
      
      // Create formants (resonant frequencies that define vowel sounds)
      const f1 = baseFreq + Math.sin(progress * Math.PI * 2) * 50; // First formant
      const f2 = baseFreq * 2.5 + Math.sin(progress * Math.PI * 4) * 100; // Second formant
      const f3 = baseFreq * 4 + Math.sin(progress * Math.PI * 6) * 150; // Third formant
      
      // Generate the waveform
      const vibrato = 1 + 0.05 * Math.sin(2 * Math.PI * 5 * time); // Natural vibrato
      const envelope = this.getEnvelope(progress); // Volume envelope
      
      const wave1 = Math.sin(2 * Math.PI * f1 * time * vibrato) * 0.5;
      const wave2 = Math.sin(2 * Math.PI * f2 * time * vibrato) * 0.3;
      const wave3 = Math.sin(2 * Math.PI * f3 * time * vibrato) * 0.2;
      
      // Add noise for consonant-like sounds
      const noise = (Math.random() - 0.5) * 0.1;
      
      // Combine and apply envelope
      const sample = (wave1 + wave2 + wave3 + noise) * envelope * 0.3;
      channelData[startFrame + i] = sample;
    }
  }

  /**
   * Get volume envelope for natural speech pattern
   */
  getEnvelope(progress) {
    // Create an envelope that simulates natural speech volume changes
    const attack = 0.1;
    const decay = 0.3;
    const sustain = 0.7;
    const release = 0.9;
    
    if (progress < attack) {
      return progress / attack;
    } else if (progress < decay) {
      return 1 - ((progress - attack) / (decay - attack)) * 0.3;
    } else if (progress < sustain) {
      return 0.7;
    } else if (progress < release) {
      return 0.7;
    } else {
      return 0.7 * (1 - (progress - release) / (1 - release));
    }
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  audioBufferToWave(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  isReady() {
    return this.isInitialized;
  }

  destroy() {
    speechSynthesis.cancel();
  }
}

// Main TTS manager that handles both Kokoro and fallback
export class TTSEngine {
  constructor() {
    this.kokoroEngine = new KokoroTTSEngine();
    this.fallbackEngine = new FallbackTTSEngine();
    this.currentEngine = null;
  }

  async initialize() {
    console.log('Initializing TTS system...');
    
    // Try to initialize Kokoro first
    const kokoroInitialized = await this.kokoroEngine.initialize();
    
    if (kokoroInitialized) {
      this.currentEngine = this.kokoroEngine;
      console.log('Using Kokoro TTS engine');
    } else {
      // Fall back to Web Speech API
      await this.fallbackEngine.initialize();
      this.currentEngine = this.fallbackEngine;
      console.log('Using fallback TTS engine');
    }

    return true;
  }

  async generateSpeech(text) {
    if (!this.currentEngine) {
      throw new Error('TTS engine not initialized');
    }

    try {
      return await this.currentEngine.generateSpeech(text);
    } catch (error) {
      console.warn('Primary TTS engine failed, trying fallback...');
      
      // If using Kokoro failed, try fallback
      if (this.currentEngine === this.kokoroEngine) {
        try {
          return await this.fallbackEngine.generateSpeech(text);
        } catch (fallbackError) {
          console.error('Both TTS engines failed:', error, fallbackError);
          throw new Error('All TTS engines failed');
        }
      } else {
        throw error;
      }
    }
  }

  isReady() {
    return this.currentEngine && this.currentEngine.isReady();
  }

  destroy() {
    if (this.kokoroEngine) {
      this.kokoroEngine.destroy();
    }
    if (this.fallbackEngine) {
      this.fallbackEngine.destroy();
    }
    this.currentEngine = null;
  }
}

// Export singleton instance
export const ttsEngine = new TTSEngine();