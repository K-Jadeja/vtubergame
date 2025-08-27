import { KokoroTTS } from "./kokoro.js";
import { env } from "./transformers.min.js";
import { splitTextSmart } from "./semantic-split.js";

async function detectWebGPU() {
  try {
    // Check if WebGPU is available
    if (!navigator.gpu) {
      console.log("WebGPU not available, falling back to WASM");
      return false;
    }
    
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.log("WebGPU adapter not available, falling back to WASM");
      return false;
    }
    
    // Test if we can get a device without hanging
    const device = await adapter.requestDevice();
    if (device.lost) {
      console.log("WebGPU device lost immediately, falling back to WASM");
      return false;
    }
    
    console.log("WebGPU available and working");
    return true;
  } catch (e) {
    console.log("WebGPU detection failed, falling back to WASM:", e.message);
    return false;
  }
}

const device = (await detectWebGPU()) ? "webgpu" : "wasm";
console.log(`Using device: ${device}`);
self.postMessage({ status: "loading_model_start", device });

let model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";

if (self.location.hostname === "localhost2") {
  env.allowLocalModels = true;
  model_id = "./my_model/";
}

const tts = await KokoroTTS.from_pretrained(model_id, {
  dtype: device === "wasm" ? "q8" : "fp32",
  device,
  progress_callback: (progress) => {
    self.postMessage({ status: "loading_model_progress", progress });
  },
}).catch((e) => {
  self.postMessage({ status: "error", error: e.message });
  throw e;
});

self.postMessage({ status: "loading_model_ready", voices: tts.voices, device });

// Track how many buffers are currently in the queue
let bufferQueueSize = 0;
const MAX_QUEUE_SIZE = 6;
let shouldStop = false;
let isGenerating = false; // Track if we're currently generating to prevent session conflicts

self.addEventListener("message", async (e) => {
  const { type, text, voice } = e.data;

  if (type === "stop") {
    bufferQueueSize = 0;
    shouldStop = true;
    isGenerating = false; // Reset generation flag
    console.log("Stop command received, stopping generation");
    return;
  }

  if (type === "buffer_processed") {
    bufferQueueSize = Math.max(0, bufferQueueSize - 1);
    return;
  }

  if (type === "generate" && text) {
    // Prevent overlapping generation sessions
    if (isGenerating) {
      console.log("Already generating, ignoring request");
      return;
    }
    
    shouldStop = false;
    isGenerating = true;
    
    try {
      let chunks = splitTextSmart(text, 300); // 300 characters per chunk for good balance

      self.postMessage({ status: "chunk_count", count: chunks.length });

      for (const chunk of chunks) {
        if (shouldStop) {
          console.log("Stopping audio generation");
          break;
        }
        console.log("Processing chunk:", chunk);

        while (bufferQueueSize >= MAX_QUEUE_SIZE && !shouldStop) {
          console.log("Waiting for buffer space...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (shouldStop) break;
        }

        // If stopped during wait, exit the main loop too
        if (shouldStop) {
          console.log("Stopping after queue wait");
          break;
        }

        try {
          const audio = await tts.generate(chunk, { voice: voice || "af_nicole" }); // This is transformers RawAudio
          let ab = audio.audio.buffer;

          bufferQueueSize++;
          self.postMessage(
            { status: "stream_audio_data", audio: ab, text: chunk },
            [ab]
          );
        } catch (generateError) {
          console.error("Error generating audio for chunk:", generateError);
          self.postMessage({ status: "error", error: `Audio generation failed: ${generateError.message}` });
          break;
        }
      }

      // Only send complete if we weren't stopped
      if (!shouldStop) {
        self.postMessage({ status: "complete" });
      }
    } catch (error) {
      console.error("Error in generate process:", error);
      self.postMessage({ status: "error", error: error.message });
    } finally {
      isGenerating = false; // Always reset the flag
    }
  }
});
