// TTS to Audio conversion system for Live2D lipsync
// This module converts text to audio files/streams that can be used for accurate lipsync

export class TTSAudioGenerator {
  constructor() {
    this.audioContext = null;
    this.currentSource = null;
    this.isGenerating = false;
  }

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    return this.audioContext;
  }

  /**
   * Generate audio from text using Web Speech API with MediaRecorder capture
   * This creates an audio blob that can be used for lipsync
   */
  async generateAudioFromText(text, options = {}) {
    const {
      voice = null,
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0
    } = options;

    return new Promise((resolve, reject) => {
      try {
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        if (voice) {
          utterance.voice = voice;
        } else {
          // Auto-select a suitable voice
          const voices = speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => 
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('woman') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('hazel')
          );
          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }
        }
        
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        // Set up audio capture
        this.setupAudioCapture().then(({ mediaRecorder, audioChunks }) => {
          let timeoutId;
          
          utterance.onstart = () => {
            console.log('TTS started, beginning audio capture');
            mediaRecorder.start();
            
            // Safety timeout in case onend doesn't fire
            timeoutId = setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                console.log('TTS timeout, stopping recording');
                mediaRecorder.stop();
              }
            }, (text.length * 100) + 5000); // Estimate based on text length + buffer
          };

          utterance.onend = () => {
            console.log('TTS ended, stopping recording');
            clearTimeout(timeoutId);
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          };

          utterance.onerror = (event) => {
            console.error('TTS error:', event);
            clearTimeout(timeoutId);
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            reject(new Error(`TTS Error: ${event.error}`));
          };

          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            console.log('Audio recording stopped, creating blob');
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            resolve({
              audioBlob,
              audioUrl,
              duration: this.estimateAudioDuration(text, rate),
              text
            });
          };

          // Start TTS
          speechSynthesis.cancel();
          speechSynthesis.speak(utterance);
          
        }).catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set up audio capture using MediaRecorder
   */
  async setupAudioCapture() {
    // Create a silent audio track to capture system audio
    const audioContext = await this.initAudioContext();
    
    // Create a destination for recording
    const dest = audioContext.createMediaStreamDestination();
    
    // Create a media recorder
    const mediaRecorder = new MediaRecorder(dest.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    const audioChunks = [];
    
    return { mediaRecorder, audioChunks, audioContext, dest };
  }

  /**
   * Alternative method: Generate synthetic audio with simple phoneme mapping
   * This creates basic audio tones for testing lipsync when TTS capture fails
   */
  async generateSyntheticAudio(text, options = {}) {
    const {
      rate = 1.0,
      baseFrequency = 200,
      phonemeDuration = 0.1
    } = options;

    const audioContext = await this.initAudioContext();
    
    // Simple phoneme to frequency mapping for testing
    const phonemeFrequencies = {
      'a': 200, 'e': 250, 'i': 300, 'o': 180, 'u': 160,
      'b': 120, 'c': 140, 'd': 160, 'f': 280, 'g': 140,
      'h': 100, 'j': 200, 'k': 160, 'l': 220, 'm': 140,
      'n': 180, 'p': 120, 'q': 180, 'r': 200, 's': 320,
      't': 240, 'v': 160, 'w': 140, 'x': 200, 'y': 260, 'z': 300,
      ' ': 0 // silence for spaces
    };

    const sampleRate = audioContext.sampleRate;
    const duration = text.length * phonemeDuration / rate;
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let offset = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toLowerCase();
      const frequency = phonemeFrequencies[char] || 200;
      const charDuration = phonemeDuration / rate;
      const charSamples = Math.floor(sampleRate * charDuration);

      for (let j = 0; j < charSamples && offset + j < length; j++) {
        if (frequency > 0) {
          const t = (offset + j) / sampleRate;
          data[offset + j] = 0.3 * Math.sin(2 * Math.PI * frequency * t) * 
                            Math.exp(-t * 2); // Add decay for more natural sound
        } else {
          data[offset + j] = 0; // silence
        }
      }
      offset += charSamples;
    }

    // Convert buffer to blob
    const audioBlob = await this.bufferToBlob(buffer);
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      audioBlob,
      audioUrl,
      duration,
      text,
      synthetic: true
    };
  }

  /**
   * Convert AudioBuffer to Blob
   */
  async bufferToBlob(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Estimate audio duration based on text and speech rate
   */
  estimateAudioDuration(text, rate = 1.0) {
    // Rough estimation: average reading speed is ~150 words per minute
    const words = text.split(/\s+/).length;
    const baseMinutes = words / 150;
    const seconds = (baseMinutes * 60) / rate;
    return Math.max(1, seconds); // Minimum 1 second
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return speechSynthesis.getVoices();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Utility function to create TTS audio generator
export function createTTSAudioGenerator() {
  return new TTSAudioGenerator();
}