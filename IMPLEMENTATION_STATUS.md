# VTuber Game - Lip Sync and TTS Implementation

## Current Status
✅ **COMPLETED:**
- Cyan Live2D model loads successfully with 15 expressions
- Live2D lip sync monitoring system implemented and working
- Real-time mouth parameter detection (`ParamMouthOpenY`, `ParamMouthForm`)
- Visual lip sync status display with movement indicators
- Manual lip sync testing functionality (`testLipSync()` in console)
- Improved TTS error handling with download instructions

## Lip Sync Detection Features

### Real-time Monitoring
- **Movement Detection**: Monitors actual Live2D mouth parameter changes
- **Visual Indicators**: 🟢 Moving / 🔴 Not Moving status
- **Parameter Values**: Real-time display of mouth open/form values
- **Activity Percentage**: Shows movement activity over time

### Testing
1. **Load the Cyan model** - Click "Load Cyan" button
2. **Test manual lip sync** - Run `testLipSync()` in browser console
3. **Watch the status panel** - See real-time parameter changes
4. **Expressions testing** - Click expression buttons to see parameter changes

## TTS Model Issue Resolution

### Current Problem
The Kokoro ONNX TTS model fails to load from HuggingFace Hub due to network/CORS issues.

### Error Details
```
Failed to load model from HuggingFace: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Manual Installation Instructions

If you want to enable TTS functionality, download the Kokoro model manually:

1. **Go to**: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
2. **Download these files** to `./public/models/kokoro/`:
   - `config.json`
   - `generation_config.json`
   - `onnx/decoder_model.onnx`
   - `onnx/decoder_model_quantized.onnx`
   - `onnx/encoder_model.onnx`
   - `onnx/encoder_model_quantized.onnx`
   - `tokenizer.json`
   - `tokenizer_config.json`

3. **Restart the application**
4. **The app will automatically detect and use the local model**

### Alternative Testing Without TTS

You can test the lip sync detection system without TTS:

1. **Use Manual Testing**: Run `testLipSync()` in browser console
2. **Test Expressions**: Click expression buttons and watch lip parameters
3. **Monitor Live**: Watch the "Lip Sync Status" panel for real-time updates

## Implementation Details

### Core Components

1. **LipSyncMonitor.js** - Real-time mouth parameter monitoring
2. **Live2DAudioPlayer.js** - Audio playback with lip sync integration
3. **TTS Worker** - Improved error handling and local model support
4. **UI Components** - Visual status display and controls

### Lip Sync Detection Algorithm

```javascript
// Detects movement based on parameter changes
const openChange = Math.abs(currentValues.open - lastValues.open);
const formChange = Math.abs(currentValues.form - lastValues.form);
const isMoving = openChange > threshold || formChange > threshold;
```

### Live2D Parameter Mapping

- `ParamMouthOpenY`: Vertical mouth opening (0.0 to 1.0)
- `ParamMouthForm`: Mouth shape/form (-1.0 to 1.0)

## Testing Results

✅ **Cyan Model Loading**: Working perfectly
✅ **Lip Sync Monitoring**: Detects real parameter changes
✅ **Visual Status Display**: Shows real-time movement status
✅ **Manual Testing**: `testLipSync()` function works correctly
✅ **Expression Integration**: Expression changes are detected
⚠️ **TTS Model Loading**: Requires manual installation (instructions provided)

## Next Steps

1. **Test with local TTS model** (if manually installed)
2. **Verify complete TTS → Lip Sync → Detection workflow**
3. **Document working setup and troubleshooting**

The lip sync detection system is fully functional and can identify actual mouth movement on the Live2D model as requested!