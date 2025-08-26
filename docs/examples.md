---
layout: default
title: Examples
permalink: /examples/
---

# Examples and Tutorials

This section provides practical examples and step-by-step tutorials for implementing various features of the VTuber Game framework.

## 📚 Table of Contents

- [Basic Model Loading](#basic-model-loading)
- [Advanced Lipsync Implementation](#advanced-lipsync-implementation)
- [Custom Motion Controls](#custom-motion-controls)
- [Expression Management](#expression-management)
- [Audio Integration](#audio-integration)
- [Custom Model Integration](#custom-model-integration)
- [Performance Optimization](#performance-optimization)
- [Debug and Monitoring](#debug-and-monitoring)

## 🎭 Basic Model Loading

### Simple Model Loader

```javascript
import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

// Register ticker
Live2DModel.registerTicker(Ticker);

// Create application
const app = new Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});

document.body.appendChild(app.view);

// Load and display model
async function loadBasicModel() {
  try {
    const model = await Live2DModel.from('/models/shizuku/shizuku.model.json');
    
    // Basic positioning
    model.scale.set(0.3);
    model.x = app.screen.width / 2;
    model.y = app.screen.height * 0.9;
    model.anchor.set(0.5, 1);
    
    app.stage.addChild(model);
    console.log('Model loaded successfully!');
    
    return model;
  } catch (error) {
    console.error('Failed to load model:', error);
  }
}

loadBasicModel();
```

### Model with Error Handling

```javascript
async function robustModelLoader(modelPath, options = {}) {
  const {
    scale = 0.3,
    position = { x: 0.5, y: 0.9 },
    anchor = { x: 0.5, y: 1 },
    timeout = 10000
  } = options;
  
  try {
    // Create loading timeout
    const loadPromise = Live2DModel.from(modelPath);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Load timeout')), timeout)
    );
    
    const model = await Promise.race([loadPromise, timeoutPromise]);
    
    // Apply positioning
    model.scale.set(scale);
    model.x = app.screen.width * position.x;
    model.y = app.screen.height * position.y;
    model.anchor.set(anchor.x, anchor.y);
    
    // Verify model is valid
    if (!model.internalModel) {
      throw new Error('Invalid model structure');
    }
    
    app.stage.addChild(model);
    
    console.log('Model loaded:', {
      name: model.internalModel.settings?.name || 'Unknown',
      version: model.internalModel.settings?.version || 'Unknown',
      motions: Object.keys(model.internalModel.motionManager?.definitions || {}),
      expressions: model.internalModel.expressionManager?.definitions?.length || 0
    });
    
    return model;
    
  } catch (error) {
    console.error('Model loading failed:', error);
    
    // Show user-friendly error
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="color: red; padding: 10px; border: 1px solid red; margin: 10px;">
        Failed to load model: ${error.message}
      </div>
    `;
    document.body.appendChild(errorDiv);
    
    return null;
  }
}

// Usage
robustModelLoader('/models/haru/haru_greeter_t03.model3.json', {
  scale: 0.25,
  position: { x: 0.3, y: 0.8 }
});
```

## 🎵 Advanced Lipsync Implementation

### Custom Lipsync with Audio Analysis

```javascript
class AdvancedLipsync {
  constructor(model) {
    this.model = model;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.isActive = false;
    this.animationFrame = null;
  }
  
  async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }
  
  async speakWithAdvancedLipsync(audioSource, options = {}) {
    const {
      volume = 1.0,
      expression,
      resetExpression = true,
      lipSensitivity = 1.5,
      mouthSmoothing = 0.3
    } = options;
    
    if (!this.audioContext) {
      await this.initAudioContext();
    }
    
    // Create audio element
    const audio = new Audio(audioSource);
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    
    // Connect to analyser
    const source = this.audioContext.createMediaElementSource(audio);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    // Store original expression
    const originalExpression = this.getCurrentExpression();
    
    // Set expression if specified
    if (expression !== undefined) {
      this.model.expression(expression);
    }
    
    // Start audio and analysis
    audio.play();
    this.startLipsyncAnalysis(lipSensitivity, mouthSmoothing);
    
    // Handle audio end
    audio.onended = () => {
      this.stopLipsyncAnalysis();
      if (resetExpression && originalExpression !== null) {
        this.model.expression(originalExpression);
      }
    };
    
    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      this.stopLipsyncAnalysis();
    };
  }
  
  startLipsyncAnalysis(sensitivity = 1.5, smoothing = 0.3) {
    this.isActive = true;
    let previousMouthValue = 0;
    
    const update = () => {
      if (!this.isActive) return;
      
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Analyze different frequency ranges
      const lowFreq = this.getFrequencyRange(0, 32);    // 0-2kHz (vowels)
      const midFreq = this.getFrequencyRange(32, 64);   // 2-4kHz (consonants)
      const highFreq = this.getFrequencyRange(64, 96);  // 4-6kHz (sibilants)
      
      // Calculate mouth opening based on volume
      const volume = (lowFreq + midFreq) / 2;
      let mouthOpen = Math.min(1, volume * sensitivity);
      
      // Apply smoothing to reduce jitter
      mouthOpen = previousMouthValue * smoothing + mouthOpen * (1 - smoothing);
      previousMouthValue = mouthOpen;
      
      // Calculate mouth form based on frequency balance
      const mouthForm = Math.max(-1, Math.min(1, (midFreq - lowFreq) * 2));
      
      // Update Live2D parameters
      this.updateMouthParameters(mouthOpen, mouthForm);
      
      this.animationFrame = requestAnimationFrame(update);
    };
    
    update();
  }
  
  getFrequencyRange(startIndex, endIndex) {
    let sum = 0;
    for (let i = startIndex; i < endIndex && i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return sum / (endIndex - startIndex) / 255;
  }
  
  updateMouthParameters(openValue, formValue) {
    if (!this.model.internalModel?.coreModel) return;
    
    try {
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', openValue);
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthForm', formValue);
    } catch (error) {
      console.warn('Could not update mouth parameters:', error);
    }
  }
  
  stopLipsyncAnalysis() {
    this.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Reset mouth parameters
    this.updateMouthParameters(0, 0);
  }
  
  getCurrentExpression() {
    // Implementation depends on model structure
    return this.model.internalModel?.expressionManager?.currentExpression?.index || null;
  }
}

// Usage example
async function setupAdvancedLipsync() {
  const model = await Live2DModel.from('/models/shizuku/shizuku.model.json');
  app.stage.addChild(model);
  
  const lipsync = new AdvancedLipsync(model);
  
  // Create UI controls
  const controls = document.createElement('div');
  controls.innerHTML = `
    <button onclick="testAdvancedLipsync()">Test Advanced Lipsync</button>
    <input type="range" id="sensitivity" min="0.5" max="3" step="0.1" value="1.5">
    <label for="sensitivity">Lip Sensitivity</label>
  `;
  document.body.appendChild(controls);
  
  window.testAdvancedLipsync = () => {
    const sensitivity = parseFloat(document.getElementById('sensitivity').value);
    lipsync.speakWithAdvancedLipsync('/models/shizuku/sounds/tapBody_00.mp3', {
      lipSensitivity: sensitivity,
      expression: 2
    });
  };
}
```

### TTS with Phoneme Analysis

```javascript
class TTSLipsync {
  constructor(model) {
    this.model = model;
    this.phonemeMap = {
      // Vowels - wide mouth opening
      'a': { mouth: 0.8, form: 0.3 },
      'e': { mouth: 0.6, form: 0.1 },
      'i': { mouth: 0.3, form: -0.3 },
      'o': { mouth: 0.7, form: 0.5 },
      'u': { mouth: 0.4, form: 0.7 },
      
      // Consonants - various mouth shapes
      'p': { mouth: 0.0, form: 0.0 },  // Closed
      'b': { mouth: 0.0, form: 0.0 },  // Closed
      'm': { mouth: 0.0, form: 0.0 },  // Closed
      'f': { mouth: 0.2, form: -0.2 }, // Narrow
      'v': { mouth: 0.2, form: -0.2 }, // Narrow
      's': { mouth: 0.1, form: -0.4 }, // Sibilant
      'z': { mouth: 0.1, form: -0.4 }, // Sibilant
      'th': { mouth: 0.1, form: -0.1 },// Dental
      
      // Default for unknown phonemes
      'default': { mouth: 0.3, form: 0.0 }
    };
  }
  
  async speakWithPhonemes(text, options = {}) {
    const {
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      voice = null
    } = options;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    if (voice) {
      utterance.voice = voice;
    }
    
    // Estimate phonemes from text (simplified)
    const phonemeSequence = this.textToPhonemes(text);
    const duration = text.length * (60 / 150) / rate; // Rough estimation
    
    // Start mouth animation
    this.animatePhonemes(phonemeSequence, duration);
    
    // Start TTS
    speechSynthesis.speak(utterance);
    
    utterance.onend = () => {
      this.resetMouth();
    };
  }
  
  textToPhonemes(text) {
    // Simplified phoneme extraction
    // In a real implementation, you'd use a phonetic library
    const words = text.toLowerCase().split(/\s+/);
    const phonemes = [];
    
    words.forEach(word => {
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if ('aeiou'.includes(char)) {
          phonemes.push({ phoneme: char, duration: 0.15 });
        } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
          phonemes.push({ phoneme: char, duration: 0.1 });
        }
      }
      phonemes.push({ phoneme: 'pause', duration: 0.1 });
    });
    
    return phonemes;
  }
  
  animatePhonemes(phonemeSequence, totalDuration) {
    let currentTime = 0;
    
    phonemeSequence.forEach(({ phoneme, duration }) => {
      setTimeout(() => {
        if (phoneme === 'pause') {
          this.updateMouth(0, 0);
        } else {
          const mouthData = this.phonemeMap[phoneme] || this.phonemeMap.default;
          this.updateMouth(mouthData.mouth, mouthData.form);
        }
      }, currentTime * 1000);
      
      currentTime += duration;
    });
  }
  
  updateMouth(openValue, formValue) {
    if (!this.model.internalModel?.coreModel) return;
    
    try {
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', openValue);
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthForm', formValue);
    } catch (error) {
      console.warn('Could not update mouth parameters:', error);
    }
  }
  
  resetMouth() {
    this.updateMouth(0, 0);
  }
}

// Usage
const ttsLipsync = new TTSLipsync(model);
ttsLipsync.speakWithPhonemes('Hello, I am a Live2D character!', {
  rate: 0.9,
  pitch: 1.1
});
```

## 🎮 Custom Motion Controls

### Advanced Motion Manager

```javascript
class MotionController {
  constructor(model) {
    this.model = model;
    this.motionQueue = [];
    this.isPlaying = false;
    this.currentMotion = null;
  }
  
  // Get all available motion groups
  getMotionGroups() {
    if (!this.model.internalModel?.motionManager) return {};
    return this.model.internalModel.motionManager.definitions;
  }
  
  // Play motion with priority queue
  async playMotion(group, index = null, priority = 2) {
    const motionGroups = this.getMotionGroups();
    const motions = motionGroups[group];
    
    if (!motions || motions.length === 0) {
      console.warn(`Motion group '${group}' not found`);
      return false;
    }
    
    const motionIndex = index !== null ? index : Math.floor(Math.random() * motions.length);
    const motion = motions[motionIndex];
    
    if (!motion) {
      console.warn(`Motion index ${motionIndex} not found in group '${group}'`);
      return false;
    }
    
    // Add to queue with priority
    this.motionQueue.push({
      group,
      index: motionIndex,
      priority,
      motion,
      timestamp: Date.now()
    });
    
    // Sort queue by priority (higher priority first)
    this.motionQueue.sort((a, b) => b.priority - a.priority);
    
    // Process queue
    if (!this.isPlaying) {
      this.processMotionQueue();
    }
    
    return true;
  }
  
  async processMotionQueue() {
    if (this.motionQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const nextMotion = this.motionQueue.shift();
    this.currentMotion = nextMotion;
    
    try {
      console.log(`Playing motion: ${nextMotion.group}[${nextMotion.index}]`);
      
      // Play the motion
      await this.model.motion(nextMotion.group, nextMotion.index, nextMotion.priority);
      
      // Wait for motion to complete (estimated duration)
      const duration = this.estimateMotionDuration(nextMotion.motion);
      await this.sleep(duration);
      
    } catch (error) {
      console.error('Motion playback error:', error);
    }
    
    this.currentMotion = null;
    
    // Process next motion in queue
    setTimeout(() => this.processMotionQueue(), 100);
  }
  
  estimateMotionDuration(motion) {
    // Use motion file data if available, otherwise estimate
    return motion.duration || 3000; // Default 3 seconds
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Create interactive motion zones
  setupInteractiveZones() {
    const canvas = this.model.parent.renderer.view;
    
    // Define interaction zones
    const zones = [
      {
        name: 'head',
        bounds: { x: 0.3, y: 0.1, width: 0.4, height: 0.3 },
        motions: ['tapHead', 'pinchIn', 'shake']
      },
      {
        name: 'body',
        bounds: { x: 0.2, y: 0.3, width: 0.6, height: 0.5 },
        motions: ['tapBody', 'idle']
      }
    ];
    
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      
      // Find clicked zone
      const clickedZone = zones.find(zone => {
        return x >= zone.bounds.x && x <= zone.bounds.x + zone.bounds.width &&
               y >= zone.bounds.y && y <= zone.bounds.y + zone.bounds.height;
      });
      
      if (clickedZone) {
        // Play random motion from zone
        const randomMotion = clickedZone.motions[
          Math.floor(Math.random() * clickedZone.motions.length)
        ];
        this.playMotion(randomMotion, null, 3);
        
        console.log(`Clicked on ${clickedZone.name}, playing ${randomMotion}`);
      }
    });
  }
  
  // Stop all motions
  stopAllMotions() {
    this.motionQueue = [];
    this.isPlaying = false;
    this.currentMotion = null;
    this.model.stopMotions();
  }
}

// Usage example
function setupAdvancedMotions(model) {
  const motionController = new MotionController(model);
  
  // Setup interactive zones
  motionController.setupInteractiveZones();
  
  // Create motion sequence
  async function playMotionSequence() {
    await motionController.playMotion('idle', 0, 1);
    await motionController.playMotion('tapBody', null, 2);
    await motionController.playMotion('idle', 1, 1);
  }
  
  // Create UI controls
  const controls = document.createElement('div');
  controls.innerHTML = `
    <div>
      <h3>Advanced Motion Controls</h3>
      <button onclick="playMotionSequence()">Play Sequence</button>
      <button onclick="motionController.stopAllMotions()">Stop All</button>
      <div id="motion-status">Ready</div>
    </div>
  `;
  document.body.appendChild(controls);
  
  // Update status
  setInterval(() => {
    const status = document.getElementById('motion-status');
    if (status) {
      status.textContent = motionController.isPlaying ? 
        `Playing: ${motionController.currentMotion?.group || 'None'}` : 
        `Queue: ${motionController.motionQueue.length} motions`;
    }
  }, 500);
  
  // Expose to global scope
  window.motionController = motionController;
  window.playMotionSequence = playMotionSequence;
}
```

## 😊 Expression Management

### Dynamic Expression System

```javascript
class ExpressionManager {
  constructor(model) {
    this.model = model;
    this.expressions = this.getAvailableExpressions();
    this.currentExpression = null;
    this.expressionTimer = null;
  }
  
  getAvailableExpressions() {
    if (!this.model.internalModel?.expressionManager) return [];
    
    return this.model.internalModel.expressionManager.definitions.map((expr, index) => ({
      index,
      name: expr.name || `Expression ${index}`,
      id: expr.id || `expr_${index}`
    }));
  }
  
  // Set expression with transition
  async setExpression(index, options = {}) {
    const {
      duration = 1000,
      fade = true,
      autoReset = false,
      resetDelay = 5000
    } = options;
    
    if (index < 0 || index >= this.expressions.length) {
      console.warn(`Expression index ${index} out of range`);
      return false;
    }
    
    // Clear any existing timer
    if (this.expressionTimer) {
      clearTimeout(this.expressionTimer);
      this.expressionTimer = null;
    }
    
    // Apply expression
    this.model.expression(index);
    this.currentExpression = index;
    
    console.log(`Set expression: ${this.expressions[index].name}`);
    
    // Auto-reset if specified
    if (autoReset) {
      this.expressionTimer = setTimeout(() => {
        this.resetExpression();
      }, resetDelay);
    }
    
    return true;
  }
  
  // Reset to default expression
  resetExpression() {
    this.model.expression();
    this.currentExpression = null;
    
    if (this.expressionTimer) {
      clearTimeout(this.expressionTimer);
      this.expressionTimer = null;
    }
  }
  
  // Random expression
  randomExpression(options = {}) {
    if (this.expressions.length === 0) return false;
    
    const randomIndex = Math.floor(Math.random() * this.expressions.length);
    return this.setExpression(randomIndex, options);
  }
  
  // Expression sequence
  async playExpressionSequence(sequence, options = {}) {
    const { interval = 2000, loop = false } = options;
    
    for (const step of sequence) {
      const { expression, duration = interval } = step;
      
      if (typeof expression === 'number') {
        await this.setExpression(expression);
      } else if (expression === 'random') {
        this.randomExpression();
      } else if (expression === 'reset') {
        this.resetExpression();
      }
      
      await this.sleep(duration);
    }
    
    if (loop) {
      setTimeout(() => this.playExpressionSequence(sequence, options), 1000);
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Create expression wheel UI
  createExpressionWheel() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: 2px solid #ccc;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      padding: 10px;
      box-sizing: border-box;
    `;
    
    // Create expression buttons in circle
    this.expressions.forEach((expr, index) => {
      const button = document.createElement('button');
      button.textContent = expr.name.substring(0, 3);
      button.title = expr.name;
      button.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid #666;
        background: #f0f0f0;
        margin: 2px;
        cursor: pointer;
        font-size: 10px;
      `;
      
      button.onclick = () => {
        this.setExpression(index, { autoReset: true });
        button.style.background = '#4CAF50';
        setTimeout(() => {
          button.style.background = '#f0f0f0';
        }, 1000);
      };
      
      container.appendChild(button);
    });
    
    // Add reset button in center
    const resetButton = document.createElement('button');
    resetButton.textContent = '↺';
    resetButton.title = 'Reset Expression';
    resetButton.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #333;
      background: #fff;
      cursor: pointer;
      font-size: 16px;
    `;
    
    resetButton.onclick = () => this.resetExpression();
    container.appendChild(resetButton);
    
    document.body.appendChild(container);
    return container;
  }
}

// Usage example
function setupExpressionSystem(model) {
  const expressionManager = new ExpressionManager(model);
  
  // Create expression wheel
  expressionManager.createExpressionWheel();
  
  // Example expression sequence
  const emotionSequence = [
    { expression: 1, duration: 2000 },  // Happy
    { expression: 2, duration: 2000 },  // Surprised
    { expression: 'reset', duration: 1000 },
    { expression: 3, duration: 2000 },  // Sad
    { expression: 'reset', duration: 1000 }
  ];
  
  // Create sequence controls
  const controls = document.createElement('div');
  controls.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: white; padding: 10px; border-radius: 5px;">
      <h4>Expression Controls</h4>
      <button onclick="expressionManager.randomExpression({ autoReset: true })">Random</button>
      <button onclick="expressionManager.playExpressionSequence(emotionSequence)">Play Sequence</button>
      <button onclick="expressionManager.resetExpression()">Reset</button>
    </div>
  `;
  document.body.appendChild(controls);
  
  // Expose to global scope
  window.expressionManager = expressionManager;
  window.emotionSequence = emotionSequence;
}
```

## 🔧 Performance Optimization

### Efficient Model Management

```javascript
class OptimizedModelManager {
  constructor(app) {
    this.app = app;
    this.models = new Map();
    this.activeModel = null;
    this.preloadedModels = new Set();
    this.performanceMonitor = new PerformanceMonitor();
  }
  
  // Preload models for faster switching
  async preloadModel(modelPath, identifier) {
    if (this.preloadedModels.has(identifier)) {
      console.log(`Model ${identifier} already preloaded`);
      return;
    }
    
    try {
      console.log(`Preloading model: ${identifier}`);
      const startTime = performance.now();
      
      const model = await Live2DModel.from(modelPath);
      
      // Configure but don't add to stage
      model.scale.set(0.3);
      model.anchor.set(0.5, 1);
      model.visible = false;
      
      this.models.set(identifier, {
        model,
        path: modelPath,
        loadTime: performance.now() - startTime,
        lastUsed: Date.now()
      });
      
      this.preloadedModels.add(identifier);
      console.log(`Model ${identifier} preloaded in ${model.loadTime}ms`);
      
    } catch (error) {
      console.error(`Failed to preload model ${identifier}:`, error);
    }
  }
  
  // Fast model switching
  async switchToModel(identifier) {
    const startTime = performance.now();
    
    // Hide current model
    if (this.activeModel) {
      this.activeModel.visible = false;
      this.app.stage.removeChild(this.activeModel);
    }
    
    // Get target model
    const modelData = this.models.get(identifier);
    if (!modelData) {
      console.error(`Model ${identifier} not found`);
      return false;
    }
    
    const { model } = modelData;
    
    // Position and show new model
    model.x = this.app.screen.width / 2;
    model.y = this.app.screen.height * 0.8;
    model.visible = true;
    
    this.app.stage.addChild(model);
    this.activeModel = model;
    modelData.lastUsed = Date.now();
    
    const switchTime = performance.now() - startTime;
    console.log(`Switched to ${identifier} in ${switchTime.toFixed(2)}ms`);
    
    this.performanceMonitor.recordSwitch(switchTime);
    return true;
  }
  
  // Memory management
  cleanupUnusedModels(maxAge = 300000) { // 5 minutes
    const now = Date.now();
    const toDelete = [];
    
    this.models.forEach((modelData, identifier) => {
      if (now - modelData.lastUsed > maxAge && modelData.model !== this.activeModel) {
        toDelete.push(identifier);
      }
    });
    
    toDelete.forEach(identifier => {
      const modelData = this.models.get(identifier);
      console.log(`Cleaning up unused model: ${identifier}`);
      
      modelData.model.destroy();
      this.models.delete(identifier);
      this.preloadedModels.delete(identifier);
    });
    
    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} unused models`);
    }
  }
  
  // Get performance statistics
  getStats() {
    return {
      modelsLoaded: this.models.size,
      preloadedModels: this.preloadedModels.size,
      activeModel: this.activeModel ? 'loaded' : 'none',
      performance: this.performanceMonitor.getStats()
    };
  }
}

class PerformanceMonitor {
  constructor() {
    this.switchTimes = [];
    this.frameRates = [];
    this.startTime = performance.now();
    this.frameCount = 0;
    
    // Monitor frame rate
    this.monitorFrameRate();
  }
  
  recordSwitch(time) {
    this.switchTimes.push(time);
    if (this.switchTimes.length > 50) {
      this.switchTimes.shift(); // Keep only recent data
    }
  }
  
  monitorFrameRate() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measure = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount / ((currentTime - lastTime) / 1000);
        this.frameRates.push(fps);
        
        if (this.frameRates.length > 60) {
          this.frameRates.shift();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }
  
  getStats() {
    const avgSwitchTime = this.switchTimes.length > 0 ?
      this.switchTimes.reduce((a, b) => a + b) / this.switchTimes.length : 0;
    
    const avgFrameRate = this.frameRates.length > 0 ?
      this.frameRates.reduce((a, b) => a + b) / this.frameRates.length : 0;
    
    return {
      averageSwitchTime: avgSwitchTime.toFixed(2) + 'ms',
      averageFrameRate: avgFrameRate.toFixed(1) + 'fps',
      totalSwitches: this.switchTimes.length,
      uptime: ((performance.now() - this.startTime) / 1000 / 60).toFixed(1) + 'min'
    };
  }
}

// Usage example
async function setupOptimizedSystem() {
  const modelManager = new OptimizedModelManager(app);
  
  // Preload models
  await Promise.all([
    modelManager.preloadModel('/models/shizuku/shizuku.model.json', 'shizuku'),
    modelManager.preloadModel('/models/haru/haru_greeter_t03.model3.json', 'haru')
  ]);
  
  // Start with first model
  await modelManager.switchToModel('shizuku');
  
  // Create performance dashboard
  const dashboard = document.createElement('div');
  dashboard.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
  `;
  
  function updateDashboard() {
    const stats = modelManager.getStats();
    dashboard.innerHTML = `
      <div>Models: ${stats.modelsLoaded} | Preloaded: ${stats.preloadedModels}</div>
      <div>Active: ${stats.activeModel}</div>
      <div>Avg Switch: ${stats.performance.averageSwitchTime}</div>
      <div>FPS: ${stats.performance.averageFrameRate}</div>
      <div>Uptime: ${stats.performance.uptime}</div>
    `;
  }
  
  setInterval(updateDashboard, 1000);
  document.body.appendChild(dashboard);
  
  // Cleanup every 5 minutes
  setInterval(() => {
    modelManager.cleanupUnusedModels();
  }, 300000);
  
  // Model switching controls
  const controls = document.createElement('div');
  controls.innerHTML = `
    <div style="position: fixed; bottom: 10px; left: 10px;">
      <button onclick="modelManager.switchToModel('shizuku')">Shizuku</button>
      <button onclick="modelManager.switchToModel('haru')">Haru</button>
      <button onclick="console.log(modelManager.getStats())">Show Stats</button>
    </div>
  `;
  document.body.appendChild(controls);
  
  window.modelManager = modelManager;
}
```

## 🐛 Debug and Monitoring

### Comprehensive Debug System

```javascript
class Live2DDebugger {
  constructor(model, app) {
    this.model = model;
    this.app = app;
    this.debugPanel = null;
    this.isActive = false;
    this.logs = [];
    this.maxLogs = 100;
  }
  
  createDebugPanel() {
    this.debugPanel = document.createElement('div');
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      width: 300px;
      height: 400px;
      background: rgba(0,0,0,0.9);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 10px;
      border-radius: 5px;
      overflow-y: auto;
      z-index: 1000;
      border: 1px solid #333;
    `;
    
    document.body.appendChild(this.debugPanel);
    this.isActive = true;
    
    this.updatePanel();
    setInterval(() => this.updatePanel(), 1000);
  }
  
  updatePanel() {
    if (!this.debugPanel || !this.isActive) return;
    
    const modelInfo = this.getModelInfo();
    const systemInfo = this.getSystemInfo();
    const recentLogs = this.logs.slice(-10);
    
    this.debugPanel.innerHTML = `
      <div style="border-bottom: 1px solid #333; margin-bottom: 10px; padding-bottom: 5px;">
        <strong>LIVE2D DEBUGGER</strong>
        <button onclick="debugger.close()" style="float: right; background: #ff4444; border: none; color: white; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong>MODEL INFO:</strong><br>
        Loaded: ${modelInfo.loaded ? '✓' : '✗'}<br>
        Visible: ${modelInfo.visible ? '✓' : '✗'}<br>
        Position: (${modelInfo.x}, ${modelInfo.y})<br>
        Scale: ${modelInfo.scale}<br>
        Bounds: ${modelInfo.bounds}<br>
        Motions: ${modelInfo.motionGroups}<br>
        Expressions: ${modelInfo.expressions}<br>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong>SYSTEM INFO:</strong><br>
        FPS: ${systemInfo.fps}<br>
        Memory: ${systemInfo.memory}<br>
        Canvas: ${systemInfo.canvas}<br>
        Audio: ${systemInfo.audioContext}<br>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong>QUICK ACTIONS:</strong><br>
        <button onclick="debugger.centerModel()" style="margin: 2px; padding: 2px 6px; background: #444; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">Center</button>
        <button onclick="debugger.testMotions()" style="margin: 2px; padding: 2px 6px; background: #444; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">Test Motions</button>
        <button onclick="debugger.testExpressions()" style="margin: 2px; padding: 2px 6px; background: #444; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">Test Expr</button>
        <button onclick="debugger.exportInfo()" style="margin: 2px; padding: 2px 6px; background: #444; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">Export</button>
      </div>
      
      <div>
        <strong>LOGS:</strong><br>
        <div style="font-size: 10px; max-height: 120px; overflow-y: auto; background: #111; padding: 5px; border-radius: 3px;">
          ${recentLogs.map(log => `<div style="color: ${log.color};">[${log.time}] ${log.message}</div>`).join('')}
        </div>
      </div>
    `;
  }
  
  getModelInfo() {
    if (!this.model) {
      return {
        loaded: false,
        visible: false,
        x: 0,
        y: 0,
        scale: 0,
        bounds: 'N/A',
        motionGroups: 0,
        expressions: 0
      };
    }
    
    const bounds = this.model.getBounds();
    const motionGroups = this.model.internalModel?.motionManager?.definitions ? 
      Object.keys(this.model.internalModel.motionManager.definitions).length : 0;
    const expressions = this.model.internalModel?.expressionManager?.definitions?.length || 0;
    
    return {
      loaded: true,
      visible: this.model.visible,
      x: Math.round(this.model.x),
      y: Math.round(this.model.y),
      scale: this.model.scale.x.toFixed(2),
      bounds: `${Math.round(bounds.width)}×${Math.round(bounds.height)}`,
      motionGroups,
      expressions
    };
  }
  
  getSystemInfo() {
    const fps = this.app.ticker.FPS.toFixed(1);
    const memory = (performance.memory?.usedJSHeapSize / 1024 / 1024)?.toFixed(1) + 'MB' || 'N/A';
    const canvas = `${this.app.view.width}×${this.app.view.height}`;
    const audioContext = window.AudioContext ? '✓' : '✗';
    
    return { fps, memory, canvas, audioContext };
  }
  
  log(message, color = '#00ff00') {
    const time = new Date().toLocaleTimeString();
    this.logs.push({ message, color, time });
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    console.log(`[Live2D Debug] ${message}`);
  }
  
  centerModel() {
    if (!this.model) {
      this.log('No model to center', '#ff4444');
      return;
    }
    
    this.model.x = this.app.screen.width / 2;
    this.model.y = this.app.screen.height * 0.8;
    this.model.visible = true;
    this.model.alpha = 1;
    this.app.render();
    
    this.log('Model centered and made visible', '#44ff44');
  }
  
  async testMotions() {
    if (!this.model?.internalModel?.motionManager) {
      this.log('No motion manager available', '#ff4444');
      return;
    }
    
    const groups = Object.keys(this.model.internalModel.motionManager.definitions);
    this.log(`Testing ${groups.length} motion groups...`, '#ffff44');
    
    for (const group of groups) {
      try {
        await this.model.motion(group);
        this.log(`✓ Motion group '${group}' works`, '#44ff44');
        await this.sleep(2000);
      } catch (error) {
        this.log(`✗ Motion group '${group}' failed: ${error.message}`, '#ff4444');
      }
    }
    
    this.log('Motion test completed', '#44ff44');
  }
  
  async testExpressions() {
    if (!this.model?.internalModel?.expressionManager) {
      this.log('No expression manager available', '#ff4444');
      return;
    }
    
    const expressions = this.model.internalModel.expressionManager.definitions;
    this.log(`Testing ${expressions.length} expressions...`, '#ffff44');
    
    for (let i = 0; i < expressions.length; i++) {
      try {
        this.model.expression(i);
        this.log(`✓ Expression ${i} works`, '#44ff44');
        await this.sleep(1500);
      } catch (error) {
        this.log(`✗ Expression ${i} failed: ${error.message}`, '#ff4444');
      }
    }
    
    this.model.expression(); // Reset
    this.log('Expression test completed', '#44ff44');
  }
  
  exportInfo() {
    const info = {
      model: this.getModelInfo(),
      system: this.getSystemInfo(),
      logs: this.logs,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `live2d-debug-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.log('Debug info exported', '#44ff44');
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  close() {
    if (this.debugPanel) {
      document.body.removeChild(this.debugPanel);
      this.debugPanel = null;
      this.isActive = false;
    }
  }
}

// Global debug function
function createDebugger(model, app) {
  const debugger = new Live2DDebugger(model, app);
  debugger.createDebugPanel();
  debugger.log('Live2D Debugger initialized');
  
  // Expose to global scope
  window.debugger = debugger;
  
  return debugger;
}

// Keyboard shortcut to open debugger
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'd') {
    event.preventDefault();
    if (window.model && window.app) {
      createDebugger(window.model, window.app);
    } else {
      console.warn('Model or app not available for debugging');
    }
  }
});
```

---

These examples provide comprehensive implementations for all major aspects of the VTuber Game framework. Each example includes error handling, performance considerations, and extensibility options for developers to build upon.