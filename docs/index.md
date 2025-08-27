---
layout: default
title: Home
permalink: /
---

# VTuber Game - Live2D Framework Documentation

Welcome to the comprehensive documentation for the VTuber Game project - a powerful Live2D framework with enhanced lipsync capabilities built on PixiJS.

## 🎯 What is This Project?

This project is a **universal Live2D framework** that demonstrates advanced integration between Live2D models and web technologies, featuring:

- **Universal Model Support**: Compatible with Cubism 2.1, 3, and 4 models
- **Advanced Lipsync**: Real-time lip synchronization with audio using a patched library
- **Text-to-Speech Integration**: Browser TTS with motion synchronization
- **Interactive Controls**: Comprehensive model control interface
- **Performance Optimized**: Efficient rendering and memory management

## 🚀 Quick Navigation

<div class="quick-nav">
  <div class="nav-card">
    <h3><a href="/getting-started/">🏁 Getting Started</a></h3>
    <p>Set up the project and run your first Live2D model</p>
  </div>
  
  <div class="nav-card">
    <h3><a href="/architecture/">🏗️ Architecture</a></h3>
    <p>Understand the system design and component structure</p>
  </div>
  
  <div class="nav-card">
    <h3><a href="/api/">📚 API Reference</a></h3>
    <p>Complete API documentation with examples</p>
  </div>
  
  <div class="nav-card">
    <h3><a href="/development/">⚙️ Development</a></h3>
    <p>Developer guides and contribution instructions</p>
  </div>
</div>

## 🌟 Key Features

### Core Live2D Capabilities

- **Multi-Version Support**: Seamless handling of all Cubism versions
- **Universal API**: Simplified, unified interface for all model types
- **Interactive Events**: Touch, drag, and gesture support
- **Expression Management**: Dynamic facial expression control
- **Motion Control**: Comprehensive animation system

### Enhanced Audio Features

- **Lipsync Technology**: Real-time mouth movement synchronization
- **TTS Integration**: Browser text-to-speech with motion triggers
- **Audio Processing**: Advanced audio analysis for natural lip movement
- **CORS Support**: Cross-origin audio file handling

### Developer Experience

- **TypeScript Support**: Full type definitions for better development
- **Modern Build Tools**: Vite-powered development and building
- **Comprehensive Testing**: Model testing interface
- **Debug Tools**: Built-in debugging and diagnostic functions

## 🔧 The Lipsync Patch

This project uses a **custom-patched version** of the pixi-live2d-display library that adds advanced lipsync capabilities:

```javascript
// Enhanced speak function with lipsync
model.speak(audioPath, {
  volume: 1.0,
  expression: 4,
  resetExpression: true,
  crossOrigin: "anonymous",
  onFinish: () => console.log("Speech completed"),
  onError: (err) => console.error("Audio error:", err),
});
```

The patch enables:

- Real-time audio analysis
- Automatic mouth parameter adjustment
- Expression preservation during speech
- Error handling and callbacks

## 📖 Documentation Structure

This documentation is organized into several key sections:

1. **[Getting Started](/getting-started/)** - Quick setup and basic usage
2. **[Architecture](/architecture/)** - System design and components
3. **[API Reference](/api/)** - Complete method and property documentation
4. **[Development](/development/)** - Advanced development topics
5. **[Examples](/examples/)** - Practical implementation examples
6. **[Troubleshooting](/troubleshooting/)** - Common issues and solutions
7. **[Expression Fix](/expression-fix/)** - 🆕 Cubism version compatibility fixes

## 🔧 Recent Updates

### Expression System Fix (Latest)

Fixed cross-version compatibility for Live2D expressions:

- ✅ **Cubism 2.1 Support**: Shizuku model expressions now working
- ✅ **Cubism 4.0 Support**: Haru and Cyan model expressions maintained
- ✅ **Automatic Detection**: System auto-detects and handles both versions
- ✅ **Comprehensive Testing**: Full test suite for validation

[Learn more about the expression fix →](/expression-fix/)

## 🤝 Contributing

This project welcomes contributions! Whether you're:

- Adding new features
- Improving documentation
- Reporting bugs
- Creating examples

Check our [Development Guide](/development/) for contribution guidelines.

## 📄 License

This project is for testing and demonstration purposes. Live2D models are redistributed under Live2D's Free Material License.

---

<div class="footer-links">
  <a href="https://github.com/K-Jadeja/vtubergame">View on GitHub</a> |
  <a href="/getting-started/">Get Started</a> |
  <a href="/api/">API Docs</a>
</div>

<style>
.quick-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.nav-card {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 20px;
  background: #f6f8fa;
}

.nav-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.nav-card h3 a {
  text-decoration: none;
  color: #0366d6;
}

.nav-card p {
  margin-bottom: 0;
  color: #586069;
}

.footer-links {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e1e4e8;
}

.footer-links a {
  margin: 0 10px;
  text-decoration: none;
  color: #0366d6;
}
</style>
