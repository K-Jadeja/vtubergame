// src/ui-manager.js
// UI components and interactions management

/**
 * Manages UI elements and their interactions
 */
export class UIManager {
  constructor(modelManager, ttsEngine) {
    this.modelManager = modelManager;
    this.ttsEngine = ttsEngine;
    this.elements = {};
    this.isInitialized = false;
  }

  /**
   * Initialize UI elements and event listeners
   */
  initialize() {
    if (this.isInitialized) return;

    this.cacheElements();
    this.setupEventListeners();
    this.isInitialized = true;
    
    console.log("UI Manager initialized");
  }

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    this.elements = {
      // Model controls
      loadShizuku: document.getElementById("load-shizuku"),
      loadHaru: document.getElementById("load-haru"),
      sceneButtons: document.getElementById("scene-buttons"),
      
      // TTS controls
      ttsText: document.getElementById("tts-text"),
      speakBtn: document.getElementById("speak-btn"),
      stopBtn: document.getElementById("stop-btn"),
      
      // Info displays
      motionsDiv: document.getElementById("motions"),
      expressionsDiv: document.getElementById("expressions"),
      modelInfoDiv: document.getElementById("info-content")
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Model loading buttons
    if (this.elements.loadShizuku) {
      this.elements.loadShizuku.onclick = () => {
        this.loadModel("/models/shizuku/shizuku.model.json", "Shizuku");
      };
    }

    if (this.elements.loadHaru) {
      this.elements.loadHaru.onclick = () => {
        this.loadModel("/models/haru/haru_greeter_t03.model3.json", "Haru");
      };
    }

    // TTS controls
    if (this.elements.speakBtn) {
      this.elements.speakBtn.onclick = () => this.handleSpeak();
    }

    if (this.elements.stopBtn) {
      this.elements.stopBtn.onclick = () => this.handleStop();
    }

    // Enter key in text input
    if (this.elements.ttsText) {
      this.elements.ttsText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSpeak();
        }
      });
    }
  }

  /**
   * Load model and update UI
   */
  async loadModel(modelPath, modelName) {
    try {
      this.setLoadingState(true);
      
      const model = await this.modelManager.loadModel(modelPath, modelName);
      this.updateModelUI();
      
      console.log(`UI updated for model: ${modelName}`);
    } catch (error) {
      console.error(`Failed to load model: ${error.message}`);
      this.showError(`Failed to load ${modelName}: ${error.message}`);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Handle speak button click
   */
  async handleSpeak() {
    const text = this.elements.ttsText?.value?.trim();
    
    if (!text) {
      this.showError("Please enter some text to speak");
      return;
    }

    const model = this.modelManager.getCurrentModel();
    if (!model) {
      this.showError("Please load a model first");
      return;
    }

    try {
      this.setTTSState(true);
      
      // Trigger a random motion while speaking
      this.modelManager.triggerRandomMotion("tap_body") ||
        this.modelManager.triggerRandomMotion("idle") ||
        this.modelManager.triggerRandomMotion("Idle");

      // Speak with lipsync
      await this.ttsEngine.speakWithLipsync(text, model, {
        expression: this.modelManager.getRandomExpression(),
        resetExpression: true
      });
      
      console.log("Speech completed successfully");
      
    } catch (error) {
      console.error("Speech error:", error);
      this.showError(`Speech failed: ${error.message}`);
      
      // Fallback to basic TTS
      try {
        console.log("Trying fallback TTS...");
        await this.ttsEngine.speakBasic(text);
      } catch (fallbackError) {
        console.error("Fallback TTS also failed:", fallbackError);
      }
    } finally {
      this.setTTSState(false);
    }
  }

  /**
   * Handle stop button click
   */
  handleStop() {
    this.ttsEngine.stop();
    this.setTTSState(false);
    console.log("Speech stopped");
  }

  /**
   * Update UI after model is loaded
   */
  updateModelUI() {
    const modelInfo = this.modelManager.getModelInfo();
    
    // Update motions
    this.updateMotionsUI(modelInfo.motionGroups);
    
    // Update expressions
    this.updateExpressionsUI(modelInfo.expressions);
    
    // Update model info
    this.updateModelInfoUI(modelInfo);
  }

  /**
   * Update motions display
   */
  updateMotionsUI(motionGroups) {
    if (!this.elements.motionsDiv) return;

    if (motionGroups.length === 0) {
      this.elements.motionsDiv.innerHTML = "<h3>Motions:</h3><p>No motions available</p>";
      return;
    }

    let html = "<h3>Motions:</h3>";
    for (const group of motionGroups) {
      html += `<button onclick="window.modelManager.triggerRandomMotion('${group.name}')">${group.name}</button> `;
    }
    this.elements.motionsDiv.innerHTML = html;
  }

  /**
   * Update expressions display
   */
  updateExpressionsUI(expressions) {
    if (!this.elements.expressionsDiv) return;

    if (expressions.length === 0) {
      this.elements.expressionsDiv.innerHTML = "<h3>Expressions:</h3><p>No expressions available</p>";
      return;
    }

    let html = "<h3>Expressions:</h3>";
    for (const expression of expressions) {
      html += `<button onclick="window.modelManager.setExpression('${expression}')">${expression}</button> `;
    }
    this.elements.expressionsDiv.innerHTML = html;
  }

  /**
   * Update model info display
   */
  updateModelInfoUI(modelInfo) {
    if (!this.elements.modelInfoDiv) return;

    const html = `
      <strong>Model:</strong> ${modelInfo.name}<br>
      <strong>Motion Groups:</strong> ${modelInfo.motionGroups.length}<br>
      ${modelInfo.motionGroups.map(g => `• ${g.name}: ${g.count} motions`).join('<br>')}<br>
      <strong>Expressions:</strong> ${modelInfo.expressions.length}
    `;
    
    this.elements.modelInfoDiv.innerHTML = html;
  }

  /**
   * Set loading state for UI
   */
  setLoadingState(isLoading) {
    const buttons = document.querySelectorAll('#model-selector button');
    buttons.forEach(btn => {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.textContent = btn.textContent.replace('Load ', 'Loading ');
      } else {
        btn.textContent = btn.textContent.replace('Loading ', 'Load ');
      }
    });
  }

  /**
   * Set TTS state for UI
   */
  setTTSState(isSpeaking) {
    if (this.elements.speakBtn) {
      this.elements.speakBtn.disabled = isSpeaking;
      this.elements.speakBtn.textContent = isSpeaking ? "Speaking..." : "Speak";
    }
    
    if (this.elements.stopBtn) {
      this.elements.stopBtn.disabled = !isSpeaking;
    }
    
    if (this.elements.ttsText) {
      this.elements.ttsText.disabled = isSpeaking;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    // You could implement a toast notification or status bar here
    alert(message); // Simple alert for now
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    console.log(message);
    // You could implement a toast notification here
  }

  /**
   * Get current TTS text
   */
  getTTSText() {
    return this.elements.ttsText?.value?.trim() || '';
  }

  /**
   * Set TTS text
   */
  setTTSText(text) {
    if (this.elements.ttsText) {
      this.elements.ttsText.value = text;
    }
  }
}