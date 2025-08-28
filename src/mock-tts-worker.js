// Mock TTS Worker for testing streaming performance
// This simulates the KokoroTTS functionality without requiring the actual model download

const SAMPLE_RATE = 24000;

// Mock voices data
const mockVoices = {
  "af_nicole": { name: "Nicole", language: "en-us", gender: "Female" },
  "af_sarah": { name: "Sarah", language: "en-us", gender: "Female" },
  "bm_lewis": { name: "Lewis", language: "en-gb", gender: "Male" }
};

// Track how many buffers are currently in the queue
let bufferQueueSize = 0;
const MAX_QUEUE_SIZE = 6;
let shouldStop = false;
let isGenerating = false;

// Send initial ready message
setTimeout(() => {
  self.postMessage({ 
    status: "loading_model_ready", 
    voices: mockVoices, 
    device: "mock" 
  });
}, 500); // Simulate quick load time

function generateMockAudio(text, durationMs = 1000) {
  // Generate simple sine wave audio for testing
  const sampleCount = Math.floor((durationMs / 1000) * SAMPLE_RATE);
  const audioData = new Float32Array(sampleCount);
  
  // Generate a simple sine wave based on text length for variation
  const frequency = 220 + (text.length % 10) * 50; // Vary frequency based on text
  
  for (let i = 0; i < sampleCount; i++) {
    audioData[i] = Math.sin(2 * Math.PI * frequency * i / SAMPLE_RATE) * 0.3;
    // Add some decay for more natural sound
    audioData[i] *= Math.exp(-i / (sampleCount * 0.8));
  }
  
  return audioData.buffer;
}

function splitTextSmart(text, maxLength = 300) {
  // Simple text splitting for mock implementation
  const words = text.split(' ');
  const chunks = [];
  let currentChunk = '';
  
  for (const word of words) {
    if ((currentChunk + ' ' + word).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = word;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks.length > 0 ? chunks : [text];
}

self.addEventListener("message", async (e) => {
  const { type, text, voice } = e.data;

  if (type === "stop") {
    bufferQueueSize = 0;
    shouldStop = true;
    isGenerating = false;
    console.log("Mock TTS: Stop command received");
    return;
  }

  if (type === "buffer_processed") {
    bufferQueueSize = Math.max(0, bufferQueueSize - 1);
    return;
  }

  if (type === "generate" && text) {
    if (isGenerating) {
      console.log("Mock TTS: Already generating, ignoring request");
      return;
    }
    
    shouldStop = false;
    isGenerating = true;
    
    try {
      console.log("Mock TTS: Starting generation for:", text.substring(0, 50) + "...");
      
      let chunks = splitTextSmart(text, 300);
      self.postMessage({ status: "chunk_count", count: chunks.length });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        if (shouldStop) {
          console.log("Mock TTS: Stopping generation");
          break;
        }
        
        console.log(`Mock TTS: Processing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);

        // Wait for buffer space
        while (bufferQueueSize >= MAX_QUEUE_SIZE && !shouldStop) {
          console.log("Mock TTS: Waiting for buffer space...");
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (shouldStop) break;
        }

        if (shouldStop) {
          console.log("Mock TTS: Stopping after queue wait");
          break;
        }

        try {
          // Simulate TTS generation time (much faster than real TTS)
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
          
          // Generate mock audio
          const audio = generateMockAudio(chunk, 800 + chunk.length * 10);
          
          bufferQueueSize++;
          self.postMessage(
            { status: "stream_audio_data", audio: audio, text: chunk },
            [audio]
          );
          
          console.log(`Mock TTS: Sent chunk ${i + 1} audio (${audio.byteLength} bytes)`);
          
        } catch (generateError) {
          console.error("Mock TTS: Error generating audio:", generateError);
          self.postMessage({ status: "error", error: `Mock generation failed: ${generateError.message}` });
          break;
        }
      }

      if (!shouldStop) {
        console.log("Mock TTS: Generation complete");
        self.postMessage({ status: "complete" });
      }
    } catch (error) {
      console.error("Mock TTS: Error in generate process:", error);
      self.postMessage({ status: "error", error: error.message });
    } finally {
      isGenerating = false;
    }
  }
});

console.log("Mock TTS Worker initialized");