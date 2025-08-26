// src/web-tts.js
// Web-based TTS implementations

/**
 * Web TTS using browser APIs and external services
 */
export class WebTTS {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  /**
   * Try to capture actual browser TTS output using screen recording API
   */
  async generateTTSWithCapture(text) {
    try {
      // Try to use the Web Audio API to capture system audio
      // This is experimental and may not work in all browsers
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
          sampleRate: 48000
        }
      });

      return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        this.recordedChunks = [];
        
        // Configure voice
        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => 
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("woman") ||
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("samantha")
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;

        // Set up recording
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
          
          if (this.recordedChunks.length > 0) {
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(blob);
            resolve(audioUrl);
          } else {
            reject(new Error('No audio recorded'));
          }
        };

        utterance.onstart = () => {
          this.mediaRecorder.start();
        };

        utterance.onend = () => {
          setTimeout(() => {
            if (this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop();
            }
          }, 500); // Small delay to ensure we capture the end
        };

        utterance.onerror = (event) => {
          if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
          reject(event);
        };

        // Start speaking
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      });

    } catch (error) {
      console.warn('Screen recording not available:', error);
      throw error;
    }
  }

  /**
   * Generate TTS using Google Translate's TTS (unofficial)
   */
  async generateGoogleTTS(text) {
    try {
      // Use Google Translate's unofficial TTS API
      const encodedText = encodeURIComponent(text);
      const lang = 'en';
      const speed = '0.8'; // Slightly slower for better clarity
      
      // Google Translate TTS URL (unofficial)
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}&ttsspeed=${speed}`;
      
      // Fetch audio
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google TTS failed: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
      
    } catch (error) {
      console.warn('Google TTS failed:', error);
      throw error;
    }
  }

  /**
   * Try ResponsiveVoice (if available)
   */
  async generateResponsiveVoiceTTS(text) {
    return new Promise((resolve, reject) => {
      // Check if ResponsiveVoice is available
      if (typeof responsiveVoice === 'undefined') {
        reject(new Error('ResponsiveVoice not available'));
        return;
      }

      // Try to get audio URL from ResponsiveVoice
      // This is a hypothetical implementation - ResponsiveVoice may not support this
      try {
        responsiveVoice.speak(text, "UK English Female", {
          rate: 0.9,
          pitch: 1.1,
          volume: 1,
          onstart: () => {
            console.log('ResponsiveVoice started');
          },
          onend: () => {
            console.log('ResponsiveVoice ended');
            // ResponsiveVoice doesn't provide direct audio URLs
            reject(new Error('ResponsiveVoice does not provide audio URLs'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create an improved synthetic speech that sounds less distorted
   */
  async generateImprovedSynthetic(text) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Calculate realistic duration based on speaking rate
    const wordsPerMinute = 150;
    const words = text.trim().split(/\s+/).length;
    const duration = Math.max(1.5, (words / wordsPerMinute) * 60);
    
    const sampleRate = audioContext.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Generate more realistic speech patterns
    await this.generateRealisticSpeech(channelData, sampleRate, duration, text);

    // Convert to WAV
    const wavBlob = this.audioBufferToWave(audioBuffer);
    return URL.createObjectURL(wavBlob);
  }

  /**
   * Generate more realistic speech patterns
   */
  async generateRealisticSpeech(channelData, sampleRate, duration, text) {
    const frameCount = channelData.length;
    
    // Analyze text for phonetic patterns
    const phonemes = this.textToPhonemes(text);
    const syllables = this.textToSyllables(text);
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / sampleRate;
      const progress = time / duration;
      
      // Get current phoneme/syllable
      const currentPhoneme = this.getCurrentPhoneme(phonemes, progress);
      const syllablePhase = this.getSyllablePhase(syllables, progress);
      
      // Generate formant frequencies based on phoneme
      const formants = this.getFormantFrequencies(currentPhoneme);
      
      // Create base frequency with natural variation
      const pitch = this.getPitchAtTime(time, duration) + this.getIntonation(progress);
      
      // Generate voiced/unvoiced sounds
      const voicing = this.getVoicing(currentPhoneme, syllablePhase);
      
      // Create sound
      let sample = 0;
      
      if (voicing > 0.5) {
        // Voiced sound - use formants
        sample = this.generateVoicedSound(formants, pitch, time, voicing);
      } else {
        // Unvoiced sound - use noise
        sample = this.generateUnvoicedSound(currentPhoneme, time);
      }
      
      // Apply envelope
      const envelope = this.getEnvelope(time, duration, syllablePhase);
      channelData[i] = sample * envelope * 0.3;
    }
  }

  /**
   * Simple text to phonemes conversion (very basic)
   */
  textToPhonemes(text) {
    // This is a very simplified phoneme mapping
    const phoneticMap = {
      'a': 'ah', 'e': 'eh', 'i': 'ih', 'o': 'oh', 'u': 'uh',
      'b': 'b', 'p': 'p', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g',
      'f': 'f', 'v': 'v', 's': 's', 'z': 'z', 'h': 'h',
      'l': 'l', 'r': 'r', 'm': 'm', 'n': 'n'
    };
    
    return text.toLowerCase().split('').map(char => 
      phoneticMap[char] || 'silence'
    );
  }

  /**
   * Simple syllable detection
   */
  textToSyllables(text) {
    const vowels = text.toLowerCase().match(/[aeiouy]+/g) || [];
    return vowels.map((vowel, index) => ({
      vowel,
      start: index / vowels.length,
      end: (index + 1) / vowels.length
    }));
  }

  /**
   * Get current phoneme at progress point
   */
  getCurrentPhoneme(phonemes, progress) {
    const index = Math.floor(progress * phonemes.length);
    return phonemes[Math.min(index, phonemes.length - 1)] || 'silence';
  }

  /**
   * Get syllable phase
   */
  getSyllablePhase(syllables, progress) {
    for (const syllable of syllables) {
      if (progress >= syllable.start && progress <= syllable.end) {
        return (progress - syllable.start) / (syllable.end - syllable.start);
      }
    }
    return 0;
  }

  /**
   * Get formant frequencies for phoneme
   */
  getFormantFrequencies(phoneme) {
    const formantMap = {
      'ah': [730, 1090, 2440],
      'eh': [530, 1840, 2480],
      'ih': [390, 1990, 2550],
      'oh': [570, 840, 2410],
      'uh': [440, 1020, 2240],
      'silence': [0, 0, 0]
    };
    
    return formantMap[phoneme] || [500, 1500, 2500];
  }

  /**
   * Get pitch at specific time
   */
  getPitchAtTime(time, duration) {
    const basePitch = 200; // Female voice
    const vibrato = Math.sin(time * 2 * Math.PI * 5) * 3;
    return basePitch + vibrato;
  }

  /**
   * Get intonation pattern
   */
  getIntonation(progress) {
    // Simple falling intonation for statements
    return Math.sin(progress * Math.PI) * 20;
  }

  /**
   * Get voicing level for phoneme
   */
  getVoicing(phoneme, syllablePhase) {
    const voicedPhonemes = ['ah', 'eh', 'ih', 'oh', 'uh', 'l', 'r', 'm', 'n', 'v', 'z'];
    if (voicedPhonemes.includes(phoneme)) {
      return 0.8 + 0.2 * Math.sin(syllablePhase * Math.PI);
    }
    return 0.1;
  }

  /**
   * Generate voiced sound with formants
   */
  generateVoicedSound(formants, pitch, time, voicing) {
    let sample = 0;
    const fundamental = Math.sin(2 * Math.PI * pitch * time) * 0.4;
    
    // Add formants
    for (let i = 0; i < formants.length; i++) {
      if (formants[i] > 0) {
        const amplitude = [0.6, 0.3, 0.1][i] || 0.05;
        sample += Math.sin(2 * Math.PI * formants[i] * time) * amplitude;
      }
    }
    
    return (fundamental + sample) * voicing;
  }

  /**
   * Generate unvoiced sound (noise-based)
   */
  generateUnvoicedSound(phoneme, time) {
    // Different noise patterns for different unvoiced sounds
    const noiseIntensity = phoneme === 's' ? 0.8 : 0.4;
    return (Math.random() - 0.5) * noiseIntensity;
  }

  /**
   * Get envelope for natural amplitude variation
   */
  getEnvelope(time, duration, syllablePhase) {
    // Overall envelope
    const overall = Math.min(1, time * 5) * Math.min(1, (duration - time) * 2);
    
    // Syllable envelope
    const syllable = 0.3 + 0.7 * Math.sin(syllablePhase * Math.PI);
    
    return overall * syllable;
  }

  /**
   * Convert AudioBuffer to WAV
   */
  audioBufferToWave(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // Write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // Write interleaved data
    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
  }
}

export const webTTS = new WebTTS();