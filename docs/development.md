---
layout: default
title: Development Guide
permalink: /development/
---

# Development Guide

This guide covers advanced development topics, contribution guidelines, and in-depth explanations of the tools and technologies used in the VTuber Game framework.

## 🛠️ Development Environment Setup

### Prerequisites

Ensure you have the following development tools:

```bash
# Node.js and npm (required)
node --version  # v16+ required
npm --version   # v8+ required

# Git (required)
git --version

# Optional but recommended
yarn --version  # Alternative package manager
code --version  # VS Code for development
```

### IDE Configuration

**VS Code Recommended Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag"
  ]
}
```

**VS Code Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "files.associations": {
    "*.json": "jsonc"
  }
}
```

## 🏗️ Build System Deep Dive

### Vite Configuration

The project uses Vite for development and building. Key configuration aspects:

```javascript
// vite.config.js (implicit configuration)
export default {
  // Automatic ES module handling
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          // Potential optimization for large chunks
          vendor: ['pixi.js'],
          live2d: ['pixi-live2d-display-lipsyncpatch']
        }
      }
    }
  },
  server: {
    // Development server configuration
    host: true,
    port: 5173
  }
}
```

### Asset Processing

**Static Assets Pipeline:**
- **Public Directory**: Files in `public/` are served as-is
- **Core Libraries**: Live2D runtimes loaded via script tags
- **Models**: Served statically with proper MIME types
- **Audio**: Supports MP3, WAV, OGG formats

**CORS Considerations:**
```javascript
// Development server automatically handles CORS
// Production deployments need proper CORS headers
// For audio files from external sources:
model.speak('https://external.com/audio.mp3', {
  crossOrigin: 'anonymous'
});
```

## 🧩 Code Architecture Patterns

### Module Organization

**main.js Structure:**
```javascript
// Dependencies
import "./style.css";
import { Application, Ticker } from "pixi.js";
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";

// Global state
let app;
let model;

// Initialization
async function init() { /* ... */ }

// Model management
async function loadModel(modelPath, modelName) { /* ... */ }
function setupModelControls(modelName) { /* ... */ }

// UI controllers
function setupMotionControls(motionManager) { /* ... */ }
function setupExpressionControls(expressionManager) { /* ... */ }

// Audio integration
function speakText(text) { /* ... */ }
function getSampleAudio() { /* ... */ }

// Utilities
function triggerRandomMotion(groupName) { /* ... */ }
function debugModel() { /* ... */ }

// Event handlers
document.addEventListener('DOMContentLoaded', init);
```

### Error Handling Patterns

**Graceful Degradation:**
```javascript
async function loadModel(modelPath, modelName) {
  try {
    console.log(`Loading ${modelName} model from: ${modelPath}`);
    
    // Cleanup previous model
    if (model) {
      app.stage.removeChild(model);
      model.destroy();
    }
    
    // Load new model with timeout
    const loadPromise = Live2DModel.from(modelPath);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Load timeout')), 10000)
    );
    
    model = await Promise.race([loadPromise, timeoutPromise]);
    
    // Success handling
    app.stage.addChild(model);
    setupModelControls(modelName);
    
  } catch (error) {
    console.error(`Failed to load ${modelName}:`, error);
    
    // User feedback
    alert(`Failed to load ${modelName} model. Check console for details.`);
    
    // Cleanup on error
    if (model) {
      model.destroy();
      model = null;
    }
  }
}
```

**Audio Error Handling:**
```javascript
function speakText(text) {
  if (!model) {
    console.warn('No model loaded for TTS');
    return;
  }
  
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      // Fallback to sample audio
      const sampleAudio = getSampleAudio();
      if (sampleAudio) {
        model.speak(sampleAudio, {
          onError: (err) => console.error('Fallback audio failed:', err)
        });
      }
    };
    
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis not available:', error);
  }
}
```

## 🔧 The Lipsync Patch Implementation

### Technical Overview

The `pixi-live2d-display-lipsyncpatch` extends the original library with audio analysis capabilities:

**Core Enhancements:**
1. **Audio Analysis Engine**: Real-time FFT analysis
2. **Parameter Mapping**: Audio features to Live2D parameters  
3. **Timing Synchronization**: Frame-accurate updates
4. **CORS Support**: External audio handling
5. **Callback System**: Event-driven audio management

### Patch Components

**Audio Processing Chain:**
```javascript
// Conceptual implementation of the patch
class LipsyncEngine {
  constructor(model) {
    this.model = model;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }
  
  setupAudio(audioElement, options = {}) {
    const source = this.audioContext.createMediaElementSource(audioElement);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    if (options.crossOrigin) {
      audioElement.crossOrigin = options.crossOrigin;
    }
  }
  
  updateLipsync() {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate volume
    const volume = this.dataArray.reduce((sum, val) => sum + val, 0) / this.dataArray.length;
    const normalizedVolume = volume / 255;
    
    // Extract formants for more realistic mouth movement
    const lowFreq = this.dataArray.slice(0, 32).reduce((sum, val) => sum + val, 0) / 32;
    const midFreq = this.dataArray.slice(32, 64).reduce((sum, val) => sum + val, 0) / 32;
    
    // Map to Live2D parameters
    const mouthOpen = Math.min(1, normalizedVolume * 2);
    const mouthForm = (midFreq - lowFreq) / 255;
    
    // Update model parameters
    if (this.model.internalModel) {
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthOpen);
      this.model.internalModel.coreModel.setParameterValueById('ParamMouthForm', mouthForm);
    }
  }
}
```

**Enhanced Speak Method:**
```javascript
// Patch adds this method to Live2DModel
speak(audioSource, options = {}) {
  const {
    volume = 1.0,
    expression,
    resetExpression = true,
    crossOrigin,
    onFinish,
    onError
  } = options;
  
  // Create audio element
  const audio = new Audio(audioSource);
  audio.volume = volume;
  
  if (crossOrigin) {
    audio.crossOrigin = crossOrigin;
  }
  
  // Set up lipsync
  this.lipsyncEngine = new LipsyncEngine(this);
  this.lipsyncEngine.setupAudio(audio, { crossOrigin });
  
  // Expression management
  const originalExpression = this.currentExpression;
  if (expression !== undefined) {
    this.expression(expression);
  }
  
  // Event handlers
  audio.onloadeddata = () => {
    audio.play();
    this.startLipsyncAnimation();
  };
  
  audio.onended = () => {
    this.stopLipsyncAnimation();
    if (resetExpression && originalExpression !== undefined) {
      this.expression(originalExpression);
    }
    if (onFinish) onFinish();
  };
  
  audio.onerror = (error) => {
    this.stopLipsyncAnimation();
    if (onError) onError(error);
  };
}
```

### Parameter Mapping Details

**Live2D Parameter IDs:**
- `ParamMouthOpenY`: Vertical mouth opening (0.0 to 1.0)
- `ParamMouthForm`: Mouth shape/form (-1.0 to 1.0)
- `ParamBrowLAngle`: Left eyebrow angle
- `ParamBrowRAngle`: Right eyebrow angle

**Audio Feature Extraction:**
```javascript
function extractAudioFeatures(dataArray) {
  // Volume calculation
  const volume = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255;
  
  // Frequency band analysis
  const bands = {
    low: dataArray.slice(0, 32),      // 0-2kHz (vowels)
    mid: dataArray.slice(32, 64),     // 2-4kHz (consonants)
    high: dataArray.slice(64, 96)     // 4-6kHz (sibilants)
  };
  
  const bandVolumes = Object.fromEntries(
    Object.entries(bands).map(([name, band]) => [
      name,
      band.reduce((sum, val) => sum + val, 0) / band.length / 255
    ])
  );
  
  return { volume, bandVolumes };
}
```

## 🎨 UI Development Patterns

### Dynamic Control Generation

**Motion Controls Pattern:**
```javascript
function setupMotionControls(motionManager) {
  const motionsDiv = document.getElementById('motions');
  motionsDiv.innerHTML = '<h3>Motions:</h3>';
  
  const definitions = motionManager.definitions;
  Object.keys(definitions).forEach(groupName => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'motion-group';
    
    const groupTitle = document.createElement('h4');
    groupTitle.textContent = groupName;
    groupDiv.appendChild(groupTitle);
    
    const motions = definitions[groupName];
    motions.forEach((motion, index) => {
      const button = document.createElement('button');
      button.textContent = motion.name || `${groupName} ${index}`;
      button.onclick = () => triggerMotion(groupName, index);
      groupDiv.appendChild(button);
    });
    
    motionsDiv.appendChild(groupDiv);
  });
}
```

**CSS Organization:**
```css
/* Component-based styling */
.motion-group {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.motion-group h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.motion-group button {
  margin: 2px;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.motion-group button:hover {
  background: #e9ecef;
}
```

### Responsive Design Considerations

```css
/* Mobile-responsive layout */
@media (max-width: 768px) {
  #app {
    flex-direction: column;
  }
  
  #canvas {
    width: 100%;
    height: 400px;
    max-width: 100vw;
  }
  
  #controls {
    width: 100%;
    margin-top: 20px;
  }
}
```

## 📦 Dependency Management

### Core Dependencies

**Production Dependencies:**
```json
{
  "pixi-live2d-display-lipsyncpatch": "^0.5.0-ls-8",
  "pixi.js": "^7.4.3"
}
```

**Development Dependencies:**
```json
{
  "vite": "^7.1.2",
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0"
}
```

### Version Compatibility

**PixiJS Compatibility:**
- Requires PixiJS v7.x
- WebGL 2.0 preferred, WebGL 1.0 fallback
- ES2015+ browser support

**Live2D Runtime Compatibility:**
- Cubism 2.1: Uses `live2d.min.js`
- Cubism 4: Uses `live2dcubismcore.js`  
- Automatic version detection

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update patch versions
npm update

# Update major versions (carefully)
npm install pixi.js@latest
npm install pixi-live2d-display-lipsyncpatch@latest

# Verify functionality after updates
npm run build
npm run dev
```

## 🔍 Testing Strategies

### Manual Testing Checklist

**Model Loading Tests:**
- [ ] Shizuku model loads successfully
- [ ] Haru model loads successfully  
- [ ] Model positioning is correct
- [ ] Model scaling is appropriate
- [ ] Console shows no errors

**Motion System Tests:**
- [ ] All motion buttons are generated
- [ ] Motion animations play correctly
- [ ] No motion conflicts or overlaps
- [ ] Idle animations loop properly

**Expression Tests:**
- [ ] Expression buttons are generated
- [ ] Expressions change visibly
- [ ] Reset expression works
- [ ] No expression conflicts

**Audio/Lipsync Tests:**
- [ ] TTS speaks with motion sync
- [ ] Audio files play with lipsync
- [ ] Mouth movement matches audio
- [ ] Audio stops/cleanup works
- [ ] CORS audio loads correctly

**Performance Tests:**
- [ ] Smooth 60fps rendering
- [ ] No memory leaks on model switching
- [ ] Reasonable CPU usage
- [ ] Audio processing doesn't lag

### Debug Tools Usage

**Browser Console Testing:**
```javascript
// Test model loading
debugModel();

// Test motion system
triggerRandomMotion('idle');

// Test audio system
model.speak('/models/shizuku/sounds/tapBody_00.mp3');

// Performance monitoring
performance.mark('test-start');
// ... perform operations ...
performance.mark('test-end');
performance.measure('test-duration', 'test-start', 'test-end');
console.log(performance.getEntriesByName('test-duration')[0].duration);
```

## 🚀 Deployment Strategies

### Static Hosting

**Vercel Deployment (included):**
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ]
}
```

**GitHub Pages:**
```bash
# Build for production
npm run build

# Deploy to gh-pages branch
git checkout -b gh-pages
cp -r dist/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

**Custom Server:**
```bash
# Build
npm run build

# Serve with any static server
npx serve dist
# or
python -m http.server 8000 -d dist
```

### Performance Optimization

**Build Optimization:**
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true
      }
    }
  }
}
```

## 🤝 Contributing Guidelines

### Code Style

**JavaScript/ES6+ Conventions:**
```javascript
// Use const/let, not var
const model = await Live2DModel.from(modelPath);
let currentExpression = 0;

// Use arrow functions for callbacks
button.onclick = () => triggerMotion('idle');

// Use template literals
console.log(`Loading model: ${modelName}`);

// Use destructuring
const { width, height } = model;
const { volume = 1.0, expression } = options;
```

**Naming Conventions:**
- Functions: `camelCase` (e.g., `loadModel`, `setupControls`)
- Variables: `camelCase` (e.g., `motionManager`, `audioContext`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `PRESIDENT_ASSETS_PATH`)
- Classes: `PascalCase` (e.g., `Live2DModel`)

### Git Workflow

**Branch Naming:**
- Features: `feature/add-new-model-support`
- Bugs: `fix/lipsync-timing-issue`
- Docs: `docs/update-api-reference`

**Commit Messages:**
```bash
git commit -m "feat: add support for Cubism 5 models"
git commit -m "fix: resolve CORS issues with external audio"
git commit -m "docs: update API documentation with examples"
git commit -m "refactor: simplify motion control generation"
```

### Pull Request Process

1. **Fork** the repository
2. **Create** feature branch
3. **Make** changes with tests
4. **Update** documentation
5. **Submit** pull request with description
6. **Address** review feedback

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Manual testing performed
- [ ] Console shows no errors
- [ ] Cross-browser testing done

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
```

## 📚 Learning Resources

### Live2D Development
- [Live2D Official Documentation](https://docs.live2d.com/)
- [Cubism SDK Documentation](https://docs.live2d.com/cubism-sdk-manual/top/)
- [Live2D Model Creation Guide](https://docs.live2d.com/cubism-editor-manual/top/)

### PixiJS Development  
- [PixiJS Documentation](https://pixijs.io/guides/)
- [PixiJS API Reference](https://pixijs.download/release/docs/index.html)
- [PixiJS Examples](https://pixijs.io/examples/)

### Web Audio API
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)

### Browser APIs
- [Speech Synthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

This development guide provides the foundation for contributing to and extending the VTuber Game framework. For specific implementation examples, see the [Examples](/examples/) section.