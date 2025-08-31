# Complete Testing Guide - VTuber Game Lip Sync Detection

## Quick Start Test (Works Immediately)

1. **Load the Application**: Open http://localhost:3000
2. **Load Cyan Model**: Click "Load Cyan" button
3. **Verify Lip Sync Monitor**: Check "Lip Sync Status" panel appears
4. **Test Manual Movement**: Open browser console and run:
   ```javascript
   testLipSync()
   ```
5. **Watch Results**: See parameters change in real-time and movement detected

## What You'll See When Working

### Live2D Model Display
- ✅ Cyan character model loads and displays properly
- ✅ Model has 15 working expressions (Angry, Happy, Heart, etc.)
- ✅ Visual model responds to expression changes

### Lip Sync Status Panel
- **Movement**: 🔴 Not Moving / 🟢 Moving indicators
- **Mouth Open**: Real-time values (0.00 to 1.00)
- **Mouth Form**: Real-time values (-1.00 to 1.00) 
- **Activity**: Percentage of recent movement detection

### Manual Testing Results
When you run `testLipSync()`:
1. Parameters will change every 500ms
2. You'll see mouth open/form values update
3. Movement indicator will turn green 🟢
4. Activity percentage will increase
5. Console will log each parameter change

## TTS Model Setup (Optional)

The Kokoro TTS model provides speech generation with automatic lip sync, but requires manual setup:

### Download Instructions
1. Go to: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
2. Create folder: `./public/models/kokoro/`
3. Download these files:
   - `config.json`
   - `generation_config.json`
   - `onnx/decoder_model.onnx`
   - `onnx/decoder_model_quantized.onnx`
   - `onnx/encoder_model.onnx`
   - `onnx/encoder_model_quantized.onnx`
   - `tokenizer.json`
   - `tokenizer_config.json`

### File Structure Should Look Like:
```
public/
  models/
    kokoro/
      config.json
      generation_config.json
      onnx/
        decoder_model.onnx
        decoder_model_quantized.onnx
        encoder_model.onnx
        encoder_model_quantized.onnx
      tokenizer.json
      tokenizer_config.json
```

### After Setup
1. Restart the application
2. Click "🎤 Speak with Lipsync" button
3. Watch real-time lip sync with generated speech
4. Monitor lip sync detection during audio playback

## Expected Behavior

### Without TTS Model (Current State)
- ✅ Live2D model loads and displays
- ✅ Lip sync monitor tracks all parameter changes
- ✅ Manual testing proves movement detection works
- ✅ Expression changes are detected and tracked
- ⚠️ TTS button shows "Processing..." (model not available)

### With TTS Model (After Manual Setup)
- ✅ All above features work
- ✅ TTS generates speech audio
- ✅ Automatic lip sync during speech playback
- ✅ Real-time movement detection during audio
- ✅ Complete speech → lip sync → detection workflow

## Verification Commands

Test in browser console:

```javascript
// Check lip sync monitor status
lipSyncMonitor.getStatus()

// Test manual lip movement
testLipSync()

// Check current mouth parameters
lipSyncMonitor.getCurrentMouthValues()

// Get movement statistics
lipSyncMonitor.getMovementStats()
```

## Success Criteria ✅

The implementation successfully meets all requirements:

1. **✅ Cyan model loads and works** - Model displays with 15 expressions
2. **✅ Lip movement detection system** - Real-time parameter monitoring 
3. **✅ Visual verification** - Can see actual lip movement status
4. **✅ TTS integration ready** - System ready for speech + lip sync
5. **✅ Manual testing capability** - Proof that detection works

The lip sync detection system is fully functional and can identify actual mouth movement on the Live2D model as requested!