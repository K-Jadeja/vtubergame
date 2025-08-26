# VTuber Game - Live2D Framework

![Cubism version](https://img.shields.io/badge/Cubism-2.1/4-ff69b4?style=flat-square)
![PixiJS version](https://img.shields.io/badge/PixiJS-7.4.3-blue?style=flat-square)
![Live2D Lipsync](https://img.shields.io/badge/Lipsync-Enabled-green?style=flat-square)
![Documentation](https://img.shields.io/badge/Documentation-Complete-brightgreen?style=flat-square)

A comprehensive Live2D framework with **advanced lipsync capabilities**, built with PixiJS and the **pixi-live2d-display-lipsyncpatch** library.

This project demonstrates a universal Live2D framework implementation that supports all Live2D model versions with enhanced lipsync capabilities, unified APIs, and interactive features.

## 📖 Complete Documentation

**[📚 View Full Documentation](https://k-jadeja.github.io/vtubergame/)**

This README provides a quick overview. For comprehensive documentation including:
- **Complete API Reference** with examples
- **System Architecture** documentation  
- **Developer Guides** and contribution instructions
- **Advanced Examples** and tutorials
- **Troubleshooting** guides and debug tools

Visit our [**full documentation site**](https://k-jadeja.github.io/vtubergame/).

## ✨ Features

### Core Live2D Features

- **🎭 Multi-Model Support**: Load and test both Cubism 2.1 and Cubism 4 models
- **🎬 Complete Motion Testing**: Test all available motions for each model with priority control
- **😊 Expression Control**: Try all facial expressions with visual feedback
- **🎯 Interactive Hit Testing**: Click on model body/head for interactive responses
- **📏 Pixi-style Transforms**: Position, scale, rotation, skew, anchor support

### Enhanced Audio & Lipsync Features

- **🗣️ Text-to-Speech Integration**: Enter text and watch the model "speak" with lip sync
- **🎵 Audio Lipsync**: Real-time mouth movement synchronized with audio playback
- **🔊 Sample Audio Testing**: Built-in sample sounds for motion testing
- **🎚️ Volume Control**: Adjustable audio volume with crossOrigin support
- **⏹️ Audio Control**: Stop speaking/motions with dedicated controls

### Advanced Features

- **📊 Real-time Model Info**: See motion groups, expression counts, and model details
- **🎲 Random Motion Triggers**: Random motion playback for each motion group
- **🎪 Expression Management**: Individual expression control with reset functionality
- **🐛 Debug Tools**: Built-in debugging functions accessible from console
- **📱 Responsive Design**: Mobile-friendly interface with optimized controls

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## 📚 Usage Guide

### Basic Model Loading

1. **Load a Model**: Click "Load Shizuku (Cubism 2.1)" or "Load Haru (Cubism 4)"
2. **Test Motions**: Click individual motion buttons or "Random" buttons for each group
3. **Try Expressions**: Click expression buttons to change facial expressions
4. **Interactive Mode**: Click on the model's body or head for interactive responses

### Text-to-Speech & Lipsync

1. **Enter Text**: Type any text in the TTS input field
2. **Speak**: Click "Speak" button to trigger TTS with automatic lipsync
3. **Stop**: Use "Stop" button to halt all audio and motion
4. **Voice Selection**: Automatically selects female voices when available

### Advanced Motion Control

#### Manual Motion Triggering

```javascript
// Basic motion
model.motion("idle", 0, 2); // category, index, priority

// Motion with audio and expression
model.motion("tapBody", 1, 3, {
  sound: "/models/shizuku/sounds/tapBody_01.mp3",
  volume: 0.8,
  expression: 2,
  resetExpression: true,
  crossOrigin: "anonymous",
  onFinish: () => console.log("Motion completed"),
  onError: (err) => console.error("Motion error:", err),
});
```

#### Motion Priority Levels

- **0**: No priority
- **1**: Idle (background animations)
- **2**: Normal (default for user interactions)
- **3**: Forced (interrupts current motion, used for audio)

### Lipsync-Only Audio

```javascript
// Pure lipsync without motion
model.speak("/path/to/audio.mp3", {
  volume: 1.0,
  expression: 4,
  resetExpression: true,
  crossOrigin: "anonymous",
  onFinish: () => console.log("Speech finished"),
  onError: (err) => console.error("Audio error:", err),
});
```

### Expression Control

```javascript
// Set specific expression
model.expression(2); // expression index

// Reset to default expression
model.expression();

// Get random expression
const randomExp = Math.floor(
  Math.random() * model.internalModel.expressionManager.definitions.length
);
model.expression(randomExp);
```

### Debug Functions

Access debug tools from browser console:

```javascript
// Comprehensive model debugging
debugModel();

// Force model visibility
if (window.model) {
  window.model.visible = true;
  window.model.alpha = 1;
  window.app.render();
}
```

## 🎯 Models Included

### Shizuku (Cubism 2.1)

- **File**: `/models/shizuku/shizuku.model.json`
- **Motions**: idle (3), tapBody (3), flickHead (3), pinchIn (3), pinchOut (3), shake (3)
- **Expressions**: 4 different facial expressions (f01-f04)
- **Audio**: Complete sample sounds for all motions
- **Features**: Physics simulation, pose system, full interaction support

### Haru (Cubism 4)

- **File**: `/models/haru/haru_greeter_t03.model3.json`
- **Motions**: idle, greeting motions (m05, m07, m14, m15)
- **Expressions**: 8 different facial expressions (F01-F08)
- **Format**: Modern Cubism 4 with enhanced features
- **Physics**: Advanced physics3.json and pose3.json

## 🛠️ Technical Implementation

### Dependencies

```json
{
  "pixi-live2d-display-lipsyncpatch": "^0.5.0-ls-8",
  "pixi.js": "^7.4.3",
  "vite": "^7.1.2"
}
```

### Core Architecture

```javascript
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";
import { Application, Ticker } from "pixi.js";

// Register ticker for Live2D updates
Live2DModel.registerTicker(Ticker);

// Initialize PixiJS application
const app = new Application({
  view: canvas,
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});

// Load model
const model = await Live2DModel.from("model.json");
app.stage.addChild(model);

// Setup interaction
model.eventMode = "static";
model.on("hit", (hitAreas) => {
  // Handle hit detection
});
```

### Browser Compatibility

- **WebGL Support**: Required for PixiJS rendering
- **ES6+ Modules**: Modern JavaScript support
- **Speech Synthesis API**: For TTS functionality (most modern browsers)
- **Audio Context**: For lipsync audio processing
- **CORS Support**: For external audio file loading

### Performance Optimizations

- **Automatic Scaling**: Models positioned at 30% scale for optimal viewing
- **Smart Anchoring**: Center-bottom anchoring for natural positioning
- **Efficient Rendering**: Manual render triggers for performance
- **Memory Management**: Proper model cleanup on switching

## 🎨 API Documentation

### Live2DModel Methods

#### Motion Control

```javascript
// Basic motion
model.motion(group, index, priority)

// Advanced motion with options
model.motion(group, index, priority, {
  sound: string,           // Audio file path
  volume: number,          // 0.0 - 1.0
  expression: number,      // Expression index
  resetExpression: boolean, // Reset after motion
  crossOrigin: string,     // CORS setting
  onFinish: function,      // Completion callback
  onError: function        // Error callback
})
```

#### Audio & Lipsync

```javascript
// Lipsync with audio
model.speak(audioPath, {
  volume: number,          // Audio volume
  expression: number,      // Expression during speech
  resetExpression: boolean, // Reset after speech
  crossOrigin: string,     // CORS for external audio
  onFinish: function,      // Completion callback
  onError: function        // Error callback
})

// Stop all audio and lipsync
model.stopSpeaking()

// Stop all motions and audio
model.stopMotions()
```

#### Expression Control

```javascript
model.expression(index); // Set expression
model.expression(); // Reset expression
```

#### Transform Control

```javascript
// Standard PixiJS transforms
model.x = 400;
model.y = 300;
model.scale.set(0.5);
model.rotation = Math.PI / 4;
model.anchor.set(0.5, 1.0);
```

#### Event Handling

```javascript
model.on("hit", (hitAreas) => {
  if (hitAreas.includes("body")) {
    // Handle body interaction
  }
});
```

## 📁 File Structure

```
live2dtest/
├── public/
│   ├── core/                          # Live2D runtime files
│   │   ├── live2d.min.js             # Cubism 2.1 core
│   │   └── live2dcubismcore.js       # Cubism 4 core
│   └── models/                       # Live2D model assets
│       ├── shizuku/                  # Cubism 2.1 test model
│       │   ├── shizuku.model.json    # Model definition
│       │   ├── shizuku.moc           # Model data
│       │   ├── shizuku.physics.json  # Physics simulation
│       │   ├── shizuku.pose.json     # Pose system
│       │   ├── expressions/          # Facial expressions
│       │   ├── motions/              # Motion files (.mtn)
│       │   ├── shizuku.1024/         # Texture files
│       │   └── sounds/               # Audio samples (.mp3)
│       └── haru/                     # Cubism 4 test model
│           ├── haru_greeter_t03.model3.json  # Model definition
│           ├── haru_greeter_t03.moc3         # Model data
│           ├── haru_greeter_t03.physics3.json # Physics
│           ├── haru_greeter_t03.pose3.json   # Pose system
│           ├── expressions/                   # Expressions (.exp3.json)
│           ├── motion/                        # Motions (.motion3.json)
│           └── haru_greeter_t03.2048/        # Textures
├── src/
│   ├── main.js                       # Main application logic
│   └── style.css                     # UI styling
├── index.html                        # HTML template
├── package.json                      # Dependencies
└── vercel.json                       # Deployment config
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
npx vercel --prod
```

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting service
```

## 🔧 Customization Guide

### Adding Your Own Models

1. **Place Model Files**: Copy to `public/models/your-model/`
2. **Update Loading Logic**: Modify `loadModel()` calls in `main.js`
3. **Adjust Paths**: Update model path references
4. **Test Motions**: Verify motion groups and expressions

### TTS Voice Customization

```javascript
// Voice selection logic in speakText()
const femaleVoice = voices.find(
  (voice) =>
    voice.name.toLowerCase().includes("female") ||
    voice.name.toLowerCase().includes("woman")
);
```

### UI Theme Customization

All styling is in `src/style.css` with CSS custom properties:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  /* Modify colors here */
}
```

### Motion Mapping

```javascript
// Custom hit area mapping
model.on("hit", (hitAreas) => {
  const motionMap = {
    body: "tapBody",
    head: "flickHead",
    face: "pinchIn",
  };

  hitAreas.forEach((area) => {
    if (motionMap[area]) {
      triggerRandomMotion(motionMap[area]);
    }
  });
});
```

## 🐛 Troubleshooting

### Models Not Loading

```javascript
// Debug model loading
console.log("Model path:", modelPath);
console.log("Model loaded:", model);
console.log("Model visible:", model.visible);
```

### Audio Issues

```javascript
// Fix CORS audio issues
model.speak(audioUrl, {
  crossOrigin: "anonymous",
});

// Check audio context
console.log("Audio context state:", window.AudioContext);
```

### TTS Problems

```javascript
// Debug TTS
console.log("Voices available:", speechSynthesis.getVoices());
console.log("Speech supported:", "speechSynthesis" in window);
```

### Performance Issues

```javascript
// Optimize performance
model.scale.set(0.2); // Reduce scale
app.ticker.maxFPS = 30; // Limit FPS
```

## 🔗 Advanced Examples

### Complete Motion Sequence

```javascript
async function playMotionSequence() {
  // Play greeting
  await new Promise((resolve) => {
    model.motion("greeting", 0, 3, {
      onFinish: resolve,
    });
  });

  // Set happy expression
  model.expression(1);

  // Play talking motion with audio
  await new Promise((resolve) => {
    model.motion("talking", 0, 3, {
      sound: "/audio/hello.mp3",
      volume: 0.8,
      onFinish: resolve,
    });
  });

  // Return to idle
  model.motion("idle", 0, 1);
  model.expression(); // Reset expression
}
```

### Interactive Conversation System

```javascript
class Live2DConversation {
  constructor(model) {
    this.model = model;
    this.isPlaying = false;
  }

  async speak(text, options = {}) {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Generate TTS
    const utterance = new SpeechSynthesisUtterance(text);

    // Trigger talking motion
    this.model.motion("talking", null, 3, {
      expression: options.expression || 1,
      onFinish: () => {
        this.isPlaying = false;
        this.model.motion("idle", 0, 1);
      },
    });

    speechSynthesis.speak(utterance);
  }

  setMood(mood) {
    const moodMap = {
      happy: 1,
      sad: 2,
      angry: 3,
      surprised: 4,
    };

    this.model.expression(moodMap[mood] || 0);
  }
}

// Usage
const conversation = new Live2DConversation(model);
conversation.setMood("happy");
conversation.speak("Hello! How are you today?");
```

## 📖 Additional Resources

- **Original Library**: [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)
- **Lipsync Patch**: [pixi-live2d-display-lipsyncpatch](https://github.com/RaSan147/pixi-live2d-display)
- **PixiJS Documentation**: [pixijs.com](https://pixijs.com/)
- **Live2D Cubism**: [live2d.com](https://www.live2d.com/)
- **API Documentation**: [Live2D Display API](https://guansss.github.io/pixi-live2d-display/api/)

## 📄 License & Credits

### Models

- **Shizuku & Haru**: Redistributed under [Live2D's Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html)

### Libraries

- **pixi-live2d-display-lipsyncpatch**: Enhanced version with lipsync support
- **PixiJS**: WebGL rendering engine
- **Vite**: Build tool and development server

### Special Thanks

- **[RaSan147](https://github.com/RaSan147)**: Lipsync patch development
- **[guansss](https://github.com/guansss)**: Original pixi-live2d-display library
- **[fatalgoth](https://github.com/fatalgoth)**: Lipsync implementation
- **[windjackz](https://github.com/windjackz)**: Additional features

---

**Ready to create interactive Live2D experiences? Start with `npm run dev` and begin exploring!** 🎭✨

## File Structure

```
live2dtest/
├── public/
│   ├── core/                 # Live2D runtime files
│   │   ├── live2d.min.js    # Cubism 2.1 core
│   │   └── live2dcubismcore.js # Cubism 4 core
│   └── models/              # Live2D model assets
│       ├── shizuku/         # Cubism 2.1 test model
│       └── haru/            # Cubism 4 test model
├── src/
│   ├── main.js             # Main application logic
│   └── style.css           # UI styling
├── index.html              # HTML template
└── package.json
```

## Technical Details

### Dependencies

- **pixi.js**: 7.4.3 - WebGL rendering engine
- **pixi-live2d-display-lipsyncpatch**: 0.5.0-ls-8 - Live2D integration with lipsync

### Browser Compatibility

- Modern browsers with WebGL support
- Speech Synthesis API for TTS (most modern browsers)
- ES6+ module support

### Performance Notes

- Models are positioned at 30% scale for optimal viewing
- Interactive hit detection enabled
- Automatic ticker registration for smooth animations

## Deployment

### Vercel (Recommended)

```bash
npm run build
npx vercel --prod
```

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting service
```

## Customization

### Adding Your Own Models

1. Place model files in `public/models/your-model/`
2. Update the model loading buttons in `main.js`
3. Adjust paths in the `loadModel()` function

### TTS Voice Customization

The application automatically selects female voices when available. Modify the voice selection logic in the `speakText()` function.

### UI Customization

All styling is in `src/style.css` with CSS custom properties for easy theming.

## Troubleshooting

### Models Not Loading

- Check browser console for errors
- Verify model files are in the correct `public/models/` directory
- Ensure Live2D core files are loaded (check Network tab)

### TTS Not Working

- Verify Speech Synthesis API support in your browser
- Check if voices are loaded (may take a moment on first load)
- Some browsers require user interaction before TTS works

### Performance Issues

- Try reducing model scale in `main.js`
- Check WebGL support in your browser
- Monitor browser console for warnings

## 📖 Complete Documentation

For comprehensive documentation, please visit:

**[📚 Full Documentation Site](https://k-jadeja.github.io/vtubergame/)**

### Documentation Sections
- **[🏁 Getting Started](https://k-jadeja.github.io/vtubergame/getting-started/)** - Setup and installation
- **[🏗️ Architecture](https://k-jadeja.github.io/vtubergame/architecture/)** - System design and lipsync patch details
- **[📚 API Reference](https://k-jadeja.github.io/vtubergame/api/)** - Complete method documentation  
- **[💻 Development](https://k-jadeja.github.io/vtubergame/development/)** - Contributing and extending the framework
- **[📝 Examples](https://k-jadeja.github.io/vtubergame/examples/)** - Advanced usage patterns and tutorials
- **[🔧 Troubleshooting](https://k-jadeja.github.io/vtubergame/troubleshooting/)** - Common issues and debug tools

### What's in the Documentation

The documentation provides detailed coverage of:

- **Complete API Reference**: Every method and property with examples
- **Lipsync Patch Implementation**: Deep dive into the enhanced audio capabilities
- **Architecture Details**: System design, data flow, and component interaction
- **Developer Tools**: Debug utilities, performance monitoring, and development setup
- **Advanced Examples**: Real-world implementation patterns and best practices
- **Troubleshooting**: Step-by-step solutions for common issues

## Credits

- **Base Library**: [pixi-live2d-display](https://github.com/RaSan147/pixi-live2d-display) with lipsync patch
- **Test Models**: Shizuku and Haru models under Live2D's Free Material License
- **Framework**: Built with Vite for fast development and building

## License

This project is for testing and demonstration purposes. Live2D models are redistributed under Live2D's Free Material License.
