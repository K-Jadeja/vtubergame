// Debug script to test TTS model loading directly
import { KokoroTTS } from "./kokoro.js";
import { env } from "./transformers.min.js";

async function testModelLoading() {
  console.log("Testing Kokoro TTS model loading...");
  
  try {
    // Try to load the model with verbose logging
    const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
      dtype: "q8", // Use smaller precision for faster loading
      device: "wasm",
      progress_callback: (progress) => {
        console.log("Loading progress:", progress);
      },
    });
    
    console.log("Model loaded successfully!");
    console.log("Available voices:", tts.voices);
    
    // Try to generate a small test audio
    const testText = "Hello world";
    console.log("Generating test audio for:", testText);
    const audio = await tts.generate(testText, { voice: "af_nicole" });
    console.log("Audio generation successful!", audio);
    
    return { success: true, tts, audio };
  } catch (error) {
    console.error("Model loading failed:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return { success: false, error };
  }
}

// Export for testing in console
window.testModelLoading = testModelLoading;

testModelLoading().then(result => {
  console.log("Test completed:", result);
});