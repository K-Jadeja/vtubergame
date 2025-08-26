// src/tts.js
// Text-to-Speech functionality for Live2D models

/**
 * TTS Engine that handles text to speech conversion with lipsync support
 */
export class TTSEngine {
  constructor() {
    this.isInitialized = false;
    this.availableVoices = [];
    this.currentUtterance = null;
  }

  /**
   * Initialize the TTS engine
   */
  async initialize() {
    if (this.isInitialized) return;

    // Wait for voices to be loaded
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.availableVoices = speechSynthesis.getVoices();
        this.isInitialized = true;
        resolve();
      };

      if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
        // Timeout fallback
        setTimeout(loadVoices, 1000);
      }
    });
  }

  /**
   * Get the best available female voice
   */
  getBestVoice() {
    if (!this.isInitialized) {
      console.warn('TTS not initialized, using default voice');
      return null;
    }

    // Try to find a good female voice
    const femaleVoice = this.availableVoices.find(
      (voice) =>
        voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("woman") ||
        voice.name.toLowerCase().includes("zira") ||
        voice.name.toLowerCase().includes("hazel") ||
        voice.name.toLowerCase().includes("samantha")
    );

    return femaleVoice || this.availableVoices[0] || null;
  }

  /**
   * Generate audio from text using a more reliable method
   */
  async generateAudio(text) {
    try {
      // Try multiple TTS approaches in order of preference
      return await this.tryMultipleTTSMethods(text);
    } catch (error) {
      console.warn('All TTS methods failed, using basic synthetic audio:', error);
      return this.generateSyntheticAudio(text);
    }
  }

  /**
   * Try multiple TTS methods in order of preference
   */
  async tryMultipleTTSMethods(text) {
    const { webTTS } = await import('./web-tts.js');
    
    // Method 1: Try Google TTS (most reliable)
    try {
      console.log('Trying Google TTS...');
      const audioUrl = await webTTS.generateGoogleTTS(text);
      console.log('Google TTS succeeded');
      return audioUrl;
    } catch (error) {
      console.warn('Google TTS failed:', error.message);
    }

    // Method 2: Try improved synthetic speech
    try {
      console.log('Trying improved synthetic speech...');
      const audioUrl = await webTTS.generateImprovedSynthetic(text);
      console.log('Improved synthetic speech succeeded');
      return audioUrl;
    } catch (error) {
      console.warn('Improved synthetic failed:', error.message);
    }

    // Method 3: Try audio capture (experimental)
    try {
      console.log('Trying audio capture method...');
      const audioUrl = await webTTS.generateTTSWithCapture(text);
      console.log('Audio capture succeeded');
      return audioUrl;
    } catch (error) {
      console.warn('Audio capture failed:', error.message);
    }

    throw new Error('All TTS methods failed');
  }

  /**
   * Fallback synthetic audio generation (simplified)
   */
  async generateSyntheticAudio(text) {
    const { webTTS } = await import('./web-tts.js');
    return webTTS.generateImprovedSynthetic(text);
  }



  /**
   * Speak text with lipsync support
   */
  async speakWithLipsync(text, model, options = {}) {
    if (!model) {
      throw new Error('Model is required for lipsync');
    }

    console.log(`Speaking text with lipsync: "${text}"`);
    
    try {
      // Generate audio
      const audioUrl = await this.generateAudio(text);
      
      if (!audioUrl) {
        throw new Error('Failed to generate audio');
      }

      console.log(`Generated audio URL: ${audioUrl}`);

      // Use the model's speak function for lipsync
      return new Promise((resolve, reject) => {
        model.speak(audioUrl, {
          volume: options.volume || 0.8,
          expression: options.expression,
          resetExpression: options.resetExpression !== false,
          crossOrigin: "anonymous",
          onFinish: () => {
            console.log("TTS lipsync finished");
            URL.revokeObjectURL(audioUrl); // Clean up
            resolve();
          },
          onError: (err) => {
            console.error("TTS lipsync error:", err);
            URL.revokeObjectURL(audioUrl); // Clean up
            reject(err);
          },
        });
      });

    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }

  /**
   * Basic TTS without lipsync (fallback)
   */
  async speakBasic(text, options = {}) {
    await this.initialize();
    
    // Cancel any existing speech
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getBestVoice();
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.1;
    utterance.volume = options.volume || 1.0;

    return new Promise((resolve, reject) => {
      utterance.onend = () => {
        console.log("Basic TTS finished");
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error("Basic TTS error:", event);
        reject(event);
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop() {
    speechSynthesis.cancel();
    this.currentUtterance = null;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return speechSynthesis.speaking || this.currentUtterance !== null;
  }
}

// Export singleton instance
export const ttsEngine = new TTSEngine();