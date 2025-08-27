---
layout: default
title: API Reference
permalink: /api/
---

# API Reference

Complete reference documentation for the VTuber Game Live2D framework, including the enhanced lipsync-enabled Live2DModel class and utility functions.

## 📚 Table of Contents

- [Live2DModel Class](#live2dmodel-class)
- [Audio & Lipsync Methods](#audio--lipsync-methods)
- [Motion Control](#motion-control)
- [Expression Management](#expression-management)
- [Transform Properties](#transform-properties)
- [Utility Functions](#utility-functions)
- [Debug Tools](#debug-tools)

## 🎭 Live2DModel Class

The core class for Live2D model management with enhanced lipsync capabilities and cross-version compatibility.

### 🔧 Cubism Version Compatibility

This framework supports both Live2D Cubism 2.1 and Cubism 4.0 models with automatic version detection and appropriate handling:

- **Cubism 2.1 Models**: Use `.model.json` files (e.g., Shizuku)
- **Cubism 4.0 Models**: Use `.model3.json` files (e.g., Haru, Cyan)

### Constructor & Loading

#### `Live2DModel.from(source, options?)`

Creates a Live2DModel instance from a model file with automatic Cubism version detection.

**Parameters:**

- `source` (string): Path to model file (.model.json or .model3.json)
- `options` (object, optional): Loading options

**Returns:** `Promise<Live2DModel>`

**Example:**

```javascript
// Cubism 2.1 model
const shizuku = await Live2DModel.from("/models/shizuku/shizuku.model.json");

// Cubism 4.0 model
const haru = await Live2DModel.from("/models/haru/haru.model3.json", {
  autoInteract: true,
  crossOrigin: "anonymous",
});
```

#### `Live2DModel.registerTicker(ticker)`

Registers the PixiJS ticker for model updates.

**Parameters:**

- `ticker` (PIXI.Ticker): The PixiJS ticker instance

**Example:**

```javascript
import { Ticker } from "pixi.js";
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";

Live2DModel.registerTicker(Ticker);
```

## 🔊 Audio & Lipsync Methods

### `model.speak(audioSource, options?)`

**Enhanced method from the lipsync patch** - Plays audio with synchronized lip movement.

**Parameters:**

- `audioSource` (string): URL/path to audio file (MP3, WAV)
- `options` (object, optional): Audio and lipsync options

**Options Object:**

```javascript
{
  volume: number,          // Audio volume (0.0 - 1.0, default: 1.0)
  expression: number,      // Expression index during speech (optional)
  resetExpression: boolean, // Reset expression after speech (default: true)
  crossOrigin: string,     // CORS setting ('anonymous', etc.)
  onFinish: function,      // Callback when audio finishes
  onError: function        // Error callback
}
```

**Examples:**

```javascript
// Basic lipsync
model.speak("/audio/greeting.mp3");

// With all options
model.speak("/audio/speech.mp3", {
  volume: 0.8,
  expression: 4,
  resetExpression: true,
  crossOrigin: "anonymous",
  onFinish: () => console.log("Speech completed"),
  onError: (err) => console.error("Audio error:", err),
});

// External audio with CORS
model.speak("https://example.com/audio.mp3", {
  crossOrigin: "anonymous",
});
```

### `model.stopSpeaking()`

Stops all audio playback and lipsync animation.

**Example:**

```javascript
// Stop current speech
model.stopSpeaking();
```

### `model.stopMotions()`

Stops all motions, audio, and lipsync animations.

**Example:**

```javascript
// Stop everything
model.stopMotions();
```

## 🎪 Motion Control

### `model.motion(group, index?, priority?)`

Triggers a motion animation.

**Parameters:**

- `group` (string): Motion group name
- `index` (number, optional): Motion index within group (default: random)
- `priority` (number, optional): Motion priority (default: 2)

**Returns:** `Promise<boolean>` - Success status

**Examples:**

```javascript
// Random motion from group
model.motion("idle");

// Specific motion
model.motion("idle", 0);

// With priority
model.motion("tapBody", 1, 3);

// With audio (if motion has sound)
model.motion("greeting", 0, 2, {
  sound: "/audio/greeting.mp3",
  volume: 0.8,
  crossOrigin: "anonymous",
});
```

### Available Motion Groups

Common motion groups (varies by model):

- `idle` or `Idle`: Idle animations
- `tapBody`: Body interaction animations
- `tapHead`: Head interaction animations
- `pinchIn`: Pinch gesture animations
- `pinchOut`: Pinch out gesture animations
- `shake`: Shake animations
- `flick`: Flick gesture animations

**Get available motions:**

```javascript
// List all motion groups
const motionGroups = Object.keys(model.internalModel.motionManager.definitions);
console.log("Available motion groups:", motionGroups);

// Get motions in a group
const idleMotions = model.internalModel.motionManager.definitions.idle;
console.log("Idle motions count:", idleMotions?.length || 0);
```

## 😊 Expression Management

### 🔧 Cross-Version Compatibility

The expression system automatically detects and handles both Cubism 2.1 and Cubism 4.0 models:

- **Cubism 4.0**: Uses `expressionManager.definitions` array
- **Cubism 2.1**: Uses `internalModel.settings.expressions` array

### `model.expression(index?)`

Sets or resets facial expressions with automatic version detection.

**Parameters:**

- `index` (number, optional): Expression index, or omit to reset

**Examples:**

```javascript
// Set specific expression
model.expression(2);

// Reset to default expression
model.expression();

// Random expression (version-safe)
const expressionCount = getExpressionCount(model);
if (expressionCount > 0) {
  const randomIndex = Math.floor(Math.random() * expressionCount);
  model.expression(randomIndex);
}
```

### Expression Detection & Utilities

#### `getExpressionCount(model)`

Returns the number of available expressions for any Cubism version.

```javascript
function getExpressionCount(model) {
  if (!model?.internalModel) return 0;

  // Cubism 4.0
  if (model.internalModel.expressionManager?.definitions) {
    return Object.keys(model.internalModel.expressionManager.definitions)
      .length;
  }

  // Cubism 2.1
  if (model.internalModel.settings?.expressions) {
    return model.internalModel.settings.expressions.length;
  }

  return 0;
}
```

#### `getExpressionNames(model)`

Returns expression information for any Cubism version.

```javascript
function getExpressionNames(model) {
  if (!model?.internalModel) return [];

  // Cubism 4.0
  if (model.internalModel.expressionManager?.definitions) {
    return Object.keys(model.internalModel.expressionManager.definitions).map(
      (name, index) => ({
        index,
        name: name || `Expression ${index}`,
        id: name,
      })
    );
  }

  // Cubism 2.1
  if (model.internalModel.settings?.expressions) {
    return model.internalModel.settings.expressions.map((expr, index) => ({
      index,
      name: expr.name || expr.file || `Expression ${index}`,
      id: expr.name || expr.file,
    }));
  }

  return [];
}
```

#### `getRandomExpression(model)`

Gets a random expression index safely for any version.

```javascript
function getRandomExpression(model) {
  const count = getExpressionCount(model);
  return count > 0 ? Math.floor(Math.random() * count) : null;
}
```

### Debug Expression System

```javascript
function debugExpressions(model) {
  console.log("=== Expression Debug ===");

  if (!model?.internalModel) {
    console.log("❌ No model loaded");
    return;
  }

  const expressionManager = model.internalModel.expressionManager;
  const settings = model.internalModel.settings;

  console.log("Expression Manager:", expressionManager);
  console.log("Model Settings:", settings);

  // Cubism 4.0 detection
  if (expressionManager?.definitions) {
    console.log("✅ Cubism 4.0 detected");
    console.log("Expressions:", Object.keys(expressionManager.definitions));
    console.log("Count:", Object.keys(expressionManager.definitions).length);
  }

  // Cubism 2.1 detection
  if (settings?.expressions) {
    console.log("✅ Cubism 2.1 detected");
    console.log("Expressions:", settings.expressions);
    console.log("Count:", settings.expressions.length);
  }

  if (!expressionManager?.definitions && !settings?.expressions) {
    console.log("❌ No expressions found");
  }
}
```

## 📐 Transform Properties

### Position Properties

```javascript
// Position (pixels from top-left)
model.x = 400; // Horizontal position
model.y = 300; // Vertical position

// Position methods
model.position.set(400, 300);
model.position.copy(otherDisplayObject.position);
```

### Scale Properties

```javascript
// Uniform scaling
model.scale.set(0.5); // 50% size

// Non-uniform scaling
model.scale.x = 0.5; // 50% width
model.scale.y = 0.8; // 80% height

// Scale methods
model.scale.set(0.5, 0.8);
```

### Anchor Properties

```javascript
// Anchor point (0.0 to 1.0)
model.anchor.set(0.5, 1.0); // Center-bottom
model.anchor.x = 0.5; // Center horizontally
model.anchor.y = 1.0; // Bottom vertically

// Common anchor presets
model.anchor.set(0.0, 0.0); // Top-left
model.anchor.set(0.5, 0.5); // Center
model.anchor.set(1.0, 1.0); // Bottom-right
```

### Rotation & Alpha

```javascript
// Rotation (radians)
model.rotation = Math.PI / 4; // 45 degrees

// Transparency
model.alpha = 0.8; // 80% opacity

// Visibility
model.visible = true; // Show/hide model
```

## 🛠️ Utility Functions

### Model Information

```javascript
// Get model dimensions
function getModelInfo(model) {
  return {
    width: model.width,
    height: model.height,
    originalWidth: model.internalModel.width,
    originalHeight: model.internalModel.height,
    bounds: model.getBounds(),
    position: { x: model.x, y: model.y },
    scale: { x: model.scale.x, y: model.scale.y },
  };
}
```

### Motion Helpers

```javascript
// Trigger random motion from group
function triggerRandomMotion(groupName) {
  if (!model?.internalModel?.motionManager) return false;

  const group = model.internalModel.motionManager.definitions[groupName];
  if (!group || group.length === 0) return false;

  const randomIndex = Math.floor(Math.random() * group.length);
  model.motion(groupName, randomIndex);
  return true;
}

// Check if motion group exists
function hasMotionGroup(groupName) {
  return !!model?.internalModel?.motionManager?.definitions?.[groupName];
}
```

### Audio Helpers

```javascript
// Get sample audio for model
function getSampleAudio() {
  if (!model) return null;

  const sampleSounds = [
    "/models/shizuku/sounds/tapBody_00.mp3",
    "/models/shizuku/sounds/tapBody_01.mp3",
    "/models/shizuku/sounds/pinchIn_00.mp3",
    "/models/shizuku/sounds/flickHead_00.mp3",
  ];

  return sampleSounds[Math.floor(Math.random() * sampleSounds.length)];
}
```

## 🐛 Debug Tools

### `debugModel()`

Comprehensive model debugging information.

**Available globally as `window.debugModel()`**

```javascript
// Run in browser console
debugModel();
```

**Output includes:**

- Model visibility and position
- Scale and bounds information
- Canvas dimensions
- Position validation
- Automatic centering for testing

### Manual Debug Checks

```javascript
// Force model visibility
if (window.model) {
  window.model.visible = true;
  window.model.alpha = 1;
  window.app.render();
}

// Check model properties
console.log("Model loaded:", !!window.model);
console.log("Model visible:", window.model?.visible);
console.log("Model bounds:", window.model?.getBounds());
console.log("App children:", window.app?.stage?.children?.length);
```

### Performance Monitoring

```javascript
// Monitor rendering performance
let frameCount = 0;
const startTime = performance.now();

app.ticker.add(() => {
  frameCount++;
  if (frameCount % 60 === 0) {
    const elapsed = performance.now() - startTime;
    console.log(`FPS: ${((frameCount / elapsed) * 1000).toFixed(1)}`);
  }
});
```

## 🎯 Kokoro TTS Integration

### Voice Configuration

The system uses Kokoro neural TTS with selectable voice options. You can change the default voice by modifying the voice parameter in the TTS generation.

**Available Voices:**

- `af_nicole` (default) - Female, clear pronunciation
- `af_sarah` - Female, warm tone
- `af_sky` - Female, energetic
- And other voices provided by the Kokoro model

**Changing Voice:**

```javascript
// In TTSButtonHandler.js, modify the voice parameter:
this.worker.postMessage({
  type: "generate",
  text: text,
  voice: "af_sarah", // Change from default "af_nicole"
});
```

**Voice Selection Options:**

```javascript
// Available voices are loaded when the model initializes
// Check console for: "Kokoro TTS model ready, voices available: X"

// To see all available voices programmatically:
// They are available in the worker's voices object after model loads
```

### TTS Configuration

**Text Processing:**

- Automatic text chunking for optimal generation
- Smart sentence splitting at 300 characters
- Progressive audio streaming for responsiveness

**Audio Output:**

- High-quality 24kHz neural synthesis
- WAV format conversion for Live2D compatibility
- Real-time lipsync synchronization

## 🎯 Browser Speech Synthesis Integration

### `speakText(text)`

Custom TTS function with motion synchronization.

**Parameters:**

- `text` (string): Text to speak

**Example:**

```javascript
// Simple TTS with motion
speakText("Hello! I am a Live2D character!");

// The function automatically:
// - Selects appropriate voice
// - Triggers talking motions
// - Handles speech events
```

### Voice Selection

```javascript
// Get available voices
const voices = speechSynthesis.getVoices();
console.log(
  "Available voices:",
  voices.map((v) => v.name)
);

// Find female voices
const femaleVoices = voices.filter(
  (voice) =>
    voice.name.toLowerCase().includes("female") ||
    voice.name.toLowerCase().includes("woman")
);
```

## ⚠️ Error Handling

### Common Error Patterns

```javascript
// Safe model operations
function safeMotion(group, index) {
  try {
    if (!model) {
      console.warn("No model loaded");
      return false;
    }

    if (!hasMotionGroup(group)) {
      console.warn(`Motion group '${group}' not found`);
      return false;
    }

    return model.motion(group, index);
  } catch (error) {
    console.error("Motion error:", error);
    return false;
  }
}

// Safe audio operations
function safeSpeak(audioPath, options = {}) {
  if (!model) {
    console.warn("No model loaded for speech");
    return;
  }

  const defaultOptions = {
    onError: (err) => console.error("Speech error:", err),
    onFinish: () => console.log("Speech completed"),
    ...options,
  };

  model.speak(audioPath, defaultOptions);
}
```

## 🔗 Type Definitions

For TypeScript users, the enhanced model interface:

```typescript
interface Live2DModel extends PIXI.DisplayObject {
  // Core methods
  motion(group: string, index?: number, priority?: number): Promise<boolean>;
  expression(index?: number): void;

  // Enhanced lipsync methods
  speak(audioSource: string, options?: SpeakOptions): void;
  stopSpeaking(): void;
  stopMotions(): void;

  // Properties
  internalModel: {
    width: number;
    height: number;
    motionManager: MotionManager;
    expressionManager: ExpressionManager;
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
```

---

This API reference provides complete documentation for all available methods and properties. For implementation examples, see the [Examples](/examples/) section.
