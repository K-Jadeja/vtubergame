---
layout: default
title: Troubleshooting
permalink: /troubleshooting/
---

# Troubleshooting Guide

This guide helps you diagnose and fix common issues when working with the VTuber Game Live2D framework.

## 🚨 Common Issues and Solutions

### Model Loading Problems

#### ❌ Models Not Loading/Appearing

**Symptoms:**
- Console shows "Model loaded" but nothing appears on screen
- Black/empty canvas
- Model loaded event fires but no visual model

**Diagnosis:**
```javascript
// Run in browser console
debugModel();

// Check if model exists
console.log('Model loaded:', !!window.model);
console.log('Model visible:', window.model?.visible);
console.log('Model alpha:', window.model?.alpha);
console.log('Model bounds:', window.model?.getBounds());
```

**Solutions:**

1. **Check Model Positioning:**
```javascript
// Force model to center and make visible
if (window.model) {
  window.model.x = window.app.screen.width / 2;
  window.model.y = window.app.screen.height / 2;
  window.model.anchor.set(0.5, 0.5);
  window.model.visible = true;
  window.model.alpha = 1;
  window.app.render();
}
```

2. **Verify Model Scale:**
```javascript
// Model might be too small or too large
window.model.scale.set(0.3); // Adjust scale
```

3. **Check Canvas Size:**
```javascript
console.log('Canvas dimensions:', {
  width: window.app.view.width,
  height: window.app.view.height
});

// Resize if needed
window.app.renderer.resize(800, 600);
```

#### ❌ "Failed to Load Model" Errors

**Common Causes:**
- Incorrect file paths
- Missing model files
- CORS restrictions
- Corrupted model data

**Solutions:**

1. **Verify File Paths:**
```bash
# Check if files exist
ls -la public/models/shizuku/
ls -la public/models/haru/

# Verify web server is serving files
curl http://localhost:5173/models/shizuku/shizuku.model.json
```

2. **Check Console for Specific Errors:**
```javascript
// Add detailed error logging
async function loadModelWithLogging(modelPath, modelName) {
  try {
    console.log(`Attempting to load: ${modelPath}`);
    
    // Test if file is accessible
    const response = await fetch(modelPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const model = await Live2DModel.from(modelPath);
    console.log('Model loaded successfully:', model);
    
  } catch (error) {
    console.error('Detailed loading error:', {
      message: error.message,
      stack: error.stack,
      path: modelPath
    });
  }
}
```

3. **Fix CORS Issues:**
```javascript
// For external models
const model = await Live2DModel.from(modelPath, {
  crossOrigin: 'anonymous'
});
```

### Audio and Lipsync Issues

#### ❌ "MediaElementAudioSource outputs zeroes due to CORS access restrictions"

**Cause:** Cross-origin audio files without proper CORS headers

**Solution:**
```javascript
// Use crossOrigin parameter
model.speak(audioUrl, {
  crossOrigin: 'anonymous'
});

// Or for motion with sound
model.motion('greeting', 0, 2, {
  sound: audioUrl,
  crossOrigin: 'anonymous'
});
```

#### ❌ Lipsync Not Working

**Diagnosis Steps:**

1. **Check Audio Context:**
```javascript
console.log('AudioContext supported:', !!window.AudioContext);
console.log('Audio context state:', audioContext?.state);

// Resume audio context if suspended
if (audioContext?.state === 'suspended') {
  audioContext.resume();
}
```

2. **Verify Audio File Loading:**
```javascript
// Test audio file directly
const testAudio = new Audio('/models/shizuku/sounds/tapBody_00.mp3');
testAudio.oncanplaythrough = () => console.log('Audio can play');
testAudio.onerror = (e) => console.error('Audio error:', e);
testAudio.load();
```

3. **Check Live2D Parameters:**
```javascript
// Verify mouth parameters exist
if (model?.internalModel?.coreModel) {
  try {
    model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0.5);
    console.log('Mouth parameter update successful');
  } catch (error) {
    console.error('Cannot update mouth parameters:', error);
  }
}
```

**Solutions:**

1. **Manual Lipsync Test:**
```javascript
// Test lipsync manually
function testLipsync() {
  if (!model) return;
  
  let value = 0;
  const interval = setInterval(() => {
    value = value === 0 ? 1 : 0;
    try {
      model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', value);
    } catch (error) {
      console.error('Lipsync test failed:', error);
      clearInterval(interval);
    }
  }, 500);
  
  setTimeout(() => clearInterval(interval), 5000);
}

testLipsync();
```

2. **Audio Context Fix:**
```javascript
// Ensure audio context is running
document.addEventListener('click', () => {
  if (window.audioContext?.state === 'suspended') {
    window.audioContext.resume();
  }
}, { once: true });
```

#### ❌ TTS (Text-to-Speech) Not Working

**Diagnosis:**
```javascript
// Check TTS support
console.log('Speech synthesis supported:', 'speechSynthesis' in window);
console.log('Available voices:', speechSynthesis.getVoices().length);

// Wait for voices to load
speechSynthesis.addEventListener('voiceschanged', () => {
  console.log('Voices loaded:', speechSynthesis.getVoices().map(v => v.name));
});
```

**Solutions:**

1. **Voice Loading Issue:**
```javascript
function speakWithVoiceCheck(text) {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      utterance.voice = voices[0]; // Use first available voice
    }
    
    speechSynthesis.speak(utterance);
  };
  
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
  } else {
    speak();
  }
}
```

2. **Browser Compatibility:**
```javascript
// Fallback for unsupported browsers
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS not supported, using fallback');
    // Trigger motion without speech
    triggerRandomMotion('tapBody');
    return;
  }
  
  // Normal TTS implementation
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}
```

### Motion and Animation Issues

#### ❌ Motions Not Playing

**Diagnosis:**
```javascript
// Check motion manager
if (model?.internalModel?.motionManager) {
  console.log('Available motions:', Object.keys(model.internalModel.motionManager.definitions));
  console.log('Motion definitions:', model.internalModel.motionManager.definitions);
} else {
  console.error('Motion manager not available');
}
```

**Solutions:**

1. **Verify Motion Groups:**
```javascript
function listAvailableMotions() {
  if (!model?.internalModel?.motionManager) {
    console.error('No motion manager');
    return;
  }
  
  const definitions = model.internalModel.motionManager.definitions;
  Object.keys(definitions).forEach(groupName => {
    const motions = definitions[groupName];
    console.log(`${groupName}: ${motions.length} motions`);
    motions.forEach((motion, index) => {
      console.log(`  [${index}] ${motion.name || 'Unnamed'}`);
    });
  });
}

listAvailableMotions();
```

2. **Safe Motion Triggering:**
```javascript
function safeMotion(groupName, index = null) {
  if (!model) {
    console.error('No model loaded');
    return false;
  }
  
  const motionManager = model.internalModel?.motionManager;
  if (!motionManager) {
    console.error('No motion manager');
    return false;
  }
  
  const group = motionManager.definitions[groupName];
  if (!group || group.length === 0) {
    console.error(`Motion group '${groupName}' not found or empty`);
    return false;
  }
  
  const motionIndex = index !== null ? index : Math.floor(Math.random() * group.length);
  if (motionIndex >= group.length) {
    console.error(`Motion index ${motionIndex} out of range for group '${groupName}'`);
    return false;
  }
  
  try {
    model.motion(groupName, motionIndex);
    console.log(`Playing motion: ${groupName}[${motionIndex}]`);
    return true;
  } catch (error) {
    console.error('Motion playback error:', error);
    return false;
  }
}
```

#### ❌ Expressions Not Changing

**Diagnosis:**
```javascript
// Check expression manager
if (model?.internalModel?.expressionManager) {
  console.log('Available expressions:', model.internalModel.expressionManager.definitions.length);
  console.log('Expression definitions:', model.internalModel.expressionManager.definitions);
} else {
  console.error('Expression manager not available');
}
```

**Solutions:**

1. **Test Expressions:**
```javascript
function testAllExpressions() {
  if (!model?.internalModel?.expressionManager) {
    console.error('No expression manager');
    return;
  }
  
  const expressions = model.internalModel.expressionManager.definitions;
  console.log(`Testing ${expressions.length} expressions...`);
  
  expressions.forEach((expr, index) => {
    setTimeout(() => {
      try {
        model.expression(index);
        console.log(`Expression ${index}: ${expr.name || 'Unnamed'} - Applied`);
      } catch (error) {
        console.error(`Expression ${index} failed:`, error);
      }
    }, index * 2000);
  });
  
  // Reset after all tests
  setTimeout(() => {
    model.expression();
    console.log('Expressions reset');
  }, expressions.length * 2000 + 1000);
}

testAllExpressions();
```

### Performance Issues

#### ❌ Low FPS / Stuttering

**Diagnosis:**
```javascript
// Monitor FPS
let frameCount = 0;
let lastTime = performance.now();

app.ticker.add(() => {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    const fps = frameCount / ((currentTime - lastTime) / 1000);
    console.log(`FPS: ${fps.toFixed(1)}`);
    frameCount = 0;
    lastTime = currentTime;
  }
});
```

**Solutions:**

1. **Reduce Model Scale:**
```javascript
model.scale.set(0.2); // Smaller scale = better performance
```

2. **Limit Frame Rate:**
```javascript
app.ticker.maxFPS = 30; // Limit to 30 FPS
```

3. **Optimize Rendering:**
```javascript
// Disable automatic rendering
app.ticker.stop();

// Manual render on demand
function render() {
  app.render();
  requestAnimationFrame(render);
}
render();
```

#### ❌ Memory Leaks

**Diagnosis:**
```javascript
// Monitor memory usage
setInterval(() => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
      total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
      limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
    });
  }
}, 5000);
```

**Solutions:**

1. **Proper Model Cleanup:**
```javascript
function cleanupModel() {
  if (model) {
    // Remove from stage
    app.stage.removeChild(model);
    
    // Destroy model
    model.destroy();
    model = null;
    
    // Force garbage collection (if available)
    if (window.gc) {
      window.gc();
    }
    
    console.log('Model cleaned up');
  }
}
```

2. **Audio Context Cleanup:**
```javascript
function cleanupAudio() {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}
```

### Build and Development Issues

#### ❌ Vite Build Failures

**Common Error:** "Some chunks are larger than 500 kB"

**Solution:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['pixi.js'],
          live2d: ['pixi-live2d-display-lipsyncpatch']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit
  }
}
```

#### ❌ ES Module Import Errors

**Error:** "Failed to resolve module specifier"

**Solution:**
```javascript
// Use full import paths
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

// Not relative paths for packages
// import { Live2DModel } from './node_modules/...'; // ❌ Wrong
```

#### ❌ TypeScript Errors

**Missing Type Definitions:**

```typescript
// Create types/live2d.d.ts
declare module 'pixi-live2d-display-lipsyncpatch' {
  export class Live2DModel extends PIXI.DisplayObject {
    static from(source: string, options?: any): Promise<Live2DModel>;
    static registerTicker(ticker: any): void;
    
    motion(group: string, index?: number, priority?: number): Promise<boolean>;
    expression(index?: number): void;
    speak(audioSource: string, options?: SpeakOptions): void;
    stopSpeaking(): void;
    stopMotions(): void;
    
    internalModel: {
      width: number;
      height: number;
      motionManager: any;
      expressionManager: any;
    };
  }
  
  interface SpeakOptions {
    volume?: number;
    expression?: number;
    resetExpression?: boolean;
    crossOrigin?: string;
    onFinish?: () => void;
    onError?: (error: Error) => void;
  }
}
```

## 🔧 Debug Tools and Utilities

### Emergency Debug Functions

Add these to browser console when things go wrong:

```javascript
// Force model visibility
function forceVisible() {
  if (window.model) {
    window.model.visible = true;
    window.model.alpha = 1;
    window.model.x = window.app.screen.width / 2;
    window.model.y = window.app.screen.height / 2;
    window.model.anchor.set(0.5, 0.5);
    window.app.render();
    console.log('Model forced visible');
  } else {
    console.error('No model found');
  }
}

// Reset everything
function resetApp() {
  if (window.app) {
    window.app.stage.removeChildren();
    window.app.render();
    console.log('App reset');
  }
}

// Test audio context
function testAudio() {
  try {
    const audioContext = new AudioContext();
    console.log('Audio context state:', audioContext.state);
    
    const testOscillator = audioContext.createOscillator();
    testOscillator.connect(audioContext.destination);
    testOscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    testOscillator.start();
    testOscillator.stop(audioContext.currentTime + 0.5);
    
    console.log('Audio test completed');
  } catch (error) {
    console.error('Audio test failed:', error);
  }
}

// Check browser compatibility
function checkCompatibility() {
  const checks = {
    webgl: !!window.WebGLRenderingContext,
    audioContext: !!window.AudioContext,
    speechSynthesis: !!window.speechSynthesis,
    es6modules: typeof Symbol !== 'undefined',
    fetch: !!window.fetch,
    promises: !!window.Promise
  };
  
  console.log('Browser compatibility:', checks);
  
  const failed = Object.entries(checks).filter(([_, supported]) => !supported);
  if (failed.length > 0) {
    console.warn('Unsupported features:', failed.map(([feature]) => feature));
  }
  
  return checks;
}
```

### Performance Profiler

```javascript
class PerformanceProfiler {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }
  
  start(label) {
    performance.mark(`${label}-start`);
    this.marks.set(label, Date.now());
  }
  
  end(label) {
    if (!this.marks.has(label)) {
      console.warn(`No start mark for ${label}`);
      return;
    }
    
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    this.measures.push({
      label,
      duration: measure.duration,
      timestamp: Date.now()
    });
    
    console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
    this.marks.delete(label);
  }
  
  getReport() {
    return {
      measures: this.measures,
      averages: this.calculateAverages(),
      slowest: this.measures.sort((a, b) => b.duration - a.duration).slice(0, 5)
    };
  }
  
  calculateAverages() {
    const groups = {};
    this.measures.forEach(measure => {
      if (!groups[measure.label]) {
        groups[measure.label] = [];
      }
      groups[measure.label].push(measure.duration);
    });
    
    return Object.fromEntries(
      Object.entries(groups).map(([label, durations]) => [
        label,
        durations.reduce((a, b) => a + b) / durations.length
      ])
    );
  }
}

// Usage
const profiler = new PerformanceProfiler();

// Profile model loading
profiler.start('model-load');
// ... load model ...
profiler.end('model-load');

// View report
console.log(profiler.getReport());
```

## 📞 Getting Help

### Before Asking for Help

1. **Check Console for Errors:** Open browser dev tools (F12) and look for error messages
2. **Try Debug Functions:** Use `debugModel()` and other debug utilities
3. **Test in Different Browser:** Some issues are browser-specific
4. **Clear Cache:** Hard refresh (Ctrl+F5) to ensure you have latest files
5. **Check File Permissions:** Ensure model files are accessible

### Information to Include in Bug Reports

```javascript
// Generate debug report
function generateDebugReport() {
  const report = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    
    // App state
    app: {
      exists: !!window.app,
      dimensions: window.app ? {
        width: window.app.view.width,
        height: window.app.view.height
      } : null,
      children: window.app?.stage?.children?.length || 0
    },
    
    // Model state
    model: {
      exists: !!window.model,
      visible: window.model?.visible,
      position: window.model ? {
        x: window.model.x,
        y: window.model.y
      } : null,
      scale: window.model?.scale?.x,
      bounds: window.model ? window.model.getBounds() : null
    },
    
    // Browser capabilities
    capabilities: checkCompatibility(),
    
    // Error logs
    errors: console.error?.logs || 'Not available'
  };
  
  console.log('Debug Report:', report);
  return report;
}
```

### Common Error Patterns and Quick Fixes

| Error Message | Quick Fix |
|---------------|-----------|
| "Model loaded but not visible" | `forceVisible()` |
| "CORS audio restrictions" | Add `crossOrigin: 'anonymous'` |
| "Motion group not found" | Check available groups with `listAvailableMotions()` |
| "AudioContext suspended" | Click anywhere on page to resume |
| "Expression index out of range" | Check expression count first |
| "Low FPS" | Reduce model scale or limit FPS |
| "Memory leak" | Properly destroy models with `cleanupModel()` |

---

If you encounter an issue not covered here, please check the [GitHub Issues](https://github.com/K-Jadeja/vtubergame/issues) or create a new issue with a detailed bug report.