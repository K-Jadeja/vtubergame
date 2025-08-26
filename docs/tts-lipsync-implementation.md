# TTS-to-Audio Lipsync Implementation

## Overview

This document describes the new Text-to-Speech (TTS) to audio conversion system implemented for accurate Live2D lipsync testing. The system solves the problem where the browser TTS and hardcoded sample audio files were playing simultaneously, resulting in lipsync that was not synchronized to the actual spoken text.

## Problem Statement

**Before**: 
- Clicking "Speak" triggered both browser TTS (speechSynthesis.speak) and a random hardcoded MP3 file
- The lipsync was synchronized to the sample audio, not the text being spoken
- No way to test lipsync capabilities with custom text input

**After**:
- Text input is converted to audio files/streams that drive both speech and lipsync
- Lipsync is accurately synchronized to the actual spoken text
- Provides proper testing environment for lipsync capabilities

## Implementation Details

### Core Components

1. **TTSAudioGenerator Class** (`src/tts-audio.js`)
   - Converts text to audio files using Web Speech API with MediaRecorder capture
   - Fallback synthetic audio generation using Web Audio API
   - WAV audio file generation from AudioBuffer
   - Automatic cleanup of blob URLs

2. **Enhanced speakText Function** (`src/main.js`)
   - Integrates with TTSAudioGenerator
   - Uses generated audio for model.speak() lipsync
   - Supports both TTS capture and synthetic audio modes
   - Robust error handling with fallbacks

3. **Improved UI Controls** (`index.html` + CSS)
   - Speed and pitch controls for TTS
   - Synthetic audio toggle for testing
   - Real-time status feedback
   - Enhanced visual design

### Audio Generation Methods

#### Method 1: TTS Capture (Primary)
```javascript
// Captures browser TTS output using MediaRecorder
const audioResult = await ttsGenerator.generateAudioFromText(text, {
  rate: 0.9,
  pitch: 1.1,
  volume: 1.0
});
```

#### Method 2: Synthetic Audio (Fallback/Testing)
```javascript
// Generates synthetic audio with phoneme mapping
const audioResult = await ttsGenerator.generateSyntheticAudio(text, {
  rate: 0.9,
  baseFrequency: 220,
  phonemeDuration: 0.15
});
```

### Key Features

- **Automatic Fallback**: If TTS capture fails, automatically falls back to synthetic audio
- **Real-time Status**: Visual feedback showing "Generating audio...", "Playing audio with lipsync...", etc.
- **Configurable Settings**: Speed and pitch controls for fine-tuning
- **Testing Mode**: Synthetic audio option for reliable testing
- **Clean Resource Management**: Automatic cleanup of blob URLs and audio contexts

## Usage

### Basic Usage
1. Load a Live2D model (e.g., Shizuku)
2. Enter text in the "Text to Speech with Lipsync" input field
3. Click "Generate Audio & Speak"
4. Watch the model speak with synchronized lip movement

### Advanced Settings
- **Speed**: Adjust TTS speed (0.5x to 2.0x)
- **Pitch**: Adjust TTS pitch (0.5x to 2.0x)  
- **Synthetic Audio**: Enable for reliable testing when TTS capture fails

### Testing Different Scenarios
```javascript
// Test with different text lengths
"Hi!" // Short text
"Hello! I'm a Live2D model!" // Medium text
"This is a test of the new TTS lipsync system with a longer sentence!" // Long text

// Test with different settings
Speed: 0.5 (slow), 1.0 (normal), 2.0 (fast)
Pitch: 0.5 (low), 1.0 (normal), 2.0 (high)
```

## Technical Implementation

### Audio Capture Process
1. Create MediaRecorder with WebRTC audio stream
2. Configure SpeechSynthesisUtterance with desired settings
3. Start recording when TTS begins speaking
4. Stop recording when TTS completes
5. Convert recorded audio chunks to Blob/URL
6. Use generated audio for lipsync

### Synthetic Audio Generation
1. Map text characters to frequency values
2. Generate sine wave audio with Web Audio API
3. Apply exponential decay for natural sound
4. Convert AudioBuffer to WAV format
5. Create Blob URL for playback

### Lipsync Integration
```javascript
// Use generated audio for accurate lipsync
model.speak(audioResult.audioUrl, {
  volume: 0.8,
  expression: getRandomExpression(),
  resetExpression: true,
  crossOrigin: "anonymous",
  onFinish: () => {
    console.log("Generated audio finished");
    updateTTSStatus('Ready');
    URL.revokeObjectURL(audioResult.audioUrl); // Cleanup
  }
});
```

## Benefits

1. **Accurate Lipsync**: Mouth movements are synchronized to actual spoken words
2. **Flexible Testing**: Can test with any text input, not just hardcoded samples
3. **Robust Fallbacks**: Works even when TTS capture fails
4. **User-Friendly**: Intuitive controls with real-time feedback
5. **Resource Efficient**: Automatic cleanup prevents memory leaks

## Browser Compatibility

- **TTS Capture**: Requires Web Speech API and MediaRecorder support
- **Synthetic Audio**: Works in all modern browsers with Web Audio API
- **Fallback Strategy**: Ensures functionality across different environments

## Future Enhancements

- Integration with external TTS APIs (Google TTS, Azure Cognitive Services)
- Advanced phoneme analysis for more realistic synthetic audio
- Voice selection from available system voices
- Audio export functionality for saving generated speech
- Real-time audio visualization during generation

## Troubleshooting

### Common Issues
1. **TTS Capture Fails**: Automatically falls back to synthetic audio
2. **No Audio Output**: Check browser audio permissions and settings
3. **Lipsync Not Working**: Ensure model has proper mouth parameters (ParamMouthOpenY, ParamMouthForm)

### Debug Information
Check browser console for detailed logs:
- TTS generation status
- Audio blob creation
- Lipsync parameter updates
- Error messages and fallback triggers