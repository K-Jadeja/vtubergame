---
layout: default
title: Getting Started
permalink: /getting-started/
---

# Getting Started

This guide will help you set up and run the VTuber Game Live2D framework on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Modern web browser** with WebGL support
- **Git** for cloning the repository

### Browser Requirements

The application requires a modern browser with:
- **WebGL Support**: Required for PixiJS rendering
- **ES6+ Modules**: Modern JavaScript support  
- **Speech Synthesis API**: For TTS functionality
- **Audio Context**: For lipsync audio processing
- **CORS Support**: For external audio file loading

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/K-Jadeja/vtubergame.git
cd vtubergame
```

### 2. Install Dependencies

```bash
npm install
```

The project uses these key dependencies:
- `pixi-live2d-display-lipsyncpatch`: Enhanced Live2D library with lipsync
- `pixi.js`: 2D rendering engine
- `vite`: Modern build tool and dev server

### 3. Start Development Server

```bash
npm run dev
```

This will start the Vite development server, typically at `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🎮 First Run

Once the development server is running:

1. **Open your browser** to the development URL
2. **Load a model** by clicking either:
   - "Load Shizuku (Cubism 2.1)" - Classic Live2D model
   - "Load Haru (Cubism 4)" - Modern Live2D model

3. **Test interactions**:
   - Click motion buttons to trigger animations
   - Use expression controls to change facial expressions
   - Try the Text-to-Speech feature with lipsync

## 📁 Project Structure

```
vtubergame/
├── docs/                     # Documentation (GitHub Pages)
├── public/                   # Static assets
│   ├── core/                # Live2D runtime files
│   │   ├── live2d.min.js    # Cubism 2.1 runtime
│   │   └── live2dcubismcore.js # Cubism 4 runtime
│   └── models/              # Live2D model files
│       ├── shizuku/         # Cubism 2.1 sample model
│       └── haru/            # Cubism 4 sample model
├── src/                     # Source code
│   ├── main.js              # Application entry point
│   ├── style.css            # Styling
│   └── counter.js           # Utility functions
├── index.html               # Main HTML file
├── package.json             # Dependencies and scripts
└── vite.config.js           # Build configuration
```

## 🎯 Basic Usage

### Loading Models

```javascript
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

// Load a model
const model = await Live2DModel.from('/models/shizuku/shizuku.model.json');
app.stage.addChild(model);

// Position and scale
model.scale.set(0.3);
model.x = app.screen.width / 2;
model.y = app.screen.height * 0.8;
model.anchor.set(0.5, 1.0);
```

### Triggering Animations

```javascript
// Play a motion
model.motion('idle'); // Motion group name

// Set expression
model.expression(2); // Expression index

// Speak with lipsync
model.speak('/path/to/audio.mp3', {
  volume: 1.0,
  expression: 4,
  resetExpression: true
});
```

## 🔧 Configuration

### Adding Your Own Models

1. **Place model files** in `public/models/your-model/`
2. **Update model loading** in `src/main.js`:

```javascript
document.getElementById('load-custom').onclick = () =>
  loadModel('/models/your-model/model.json', 'CustomModel');
```

### Customizing TTS Voices

```javascript
// In speakText function
const voices = speechSynthesis.getVoices();
const preferredVoice = voices.find(voice => 
  voice.name.includes('your-preferred-voice')
);
if (preferredVoice) {
  utterance.voice = preferredVoice;
}
```

## 🎨 UI Customization

The interface styling is in `src/style.css`. Key customizable elements:

- **Canvas size**: Modify `#canvas` dimensions
- **Color scheme**: Update CSS custom properties
- **Layout**: Adjust flexbox properties in `#app`
- **Button styling**: Customize button appearance

## 🐛 Common Issues

### Models Not Loading

**Issue**: Model appears in console but not on screen

**Solution**: Check model positioning and scale:

```javascript
// Debug model visibility
if (window.model) {
  window.model.visible = true;
  window.model.alpha = 1;
  window.app.render();
}
```

### Audio/Lipsync Problems

**Issue**: "CORS access restrictions" error

**Solution**: Use crossOrigin parameter:

```javascript
model.speak(audioUrl, {
  crossOrigin: 'anonymous'
});
```

### TTS Not Working

**Issue**: No speech synthesis

**Solution**: Check browser support:

```javascript
if ('speechSynthesis' in window) {
  console.log('TTS supported');
} else {
  console.log('TTS not supported');
}
```

## ⚡ Performance Tips

1. **Optimize model scale**: Use `model.scale.set(0.2-0.4)` for better performance
2. **Limit FPS**: Set `app.ticker.maxFPS = 30` if needed
3. **Cleanup models**: Always destroy previous models when loading new ones
4. **Use appropriate model sizes**: Smaller texture sizes load faster

## 🔗 Next Steps

- Explore the [Architecture](/architecture/) to understand the system design
- Check the [API Reference](/api/) for detailed method documentation  
- View [Examples](/examples/) for advanced usage patterns
- Consult [Development](/development/) for contribution guidelines

---

Need help? Check our [Troubleshooting](/troubleshooting/) guide or open an issue on GitHub.