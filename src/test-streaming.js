/**
 * Test streaming functionality without requiring the actual Kokoro TTS model
 * This generates synthetic audio data to test the streaming architecture
 */

// Generate synthetic audio data for testing
function generateTestAudioChunk(duration = 0.5) {
  const sampleRate = 24000;
  const length = Math.floor(sampleRate * duration);
  const audioData = new Float32Array(length);
  
  // Generate a simple sine wave for testing
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    audioData[i] = Math.sin(2 * Math.PI * 440 * time) * 0.1; // 440Hz tone at low volume
  }
  
  return audioData;
}

// Test the streaming architecture
async function testStreamingArchitecture() {
  console.log("🧪 Testing streaming architecture...");
  
  if (!window.immediateAudioPlayer || !window.progressiveLipsyncManager) {
    console.error("❌ Audio players not available");
    return;
  }
  
  const testChunks = 5;
  window.immediateAudioPlayer.setTotalChunks(testChunks);
  window.progressiveLipsyncManager.setTotalExpectedChunks(testChunks);
  
  console.log("🎵 Starting synthetic audio streaming test...");
  
  for (let i = 0; i < testChunks; i++) {
    console.log(`🔊 Processing chunk ${i + 1}/${testChunks}`);
    
    // Generate test audio chunk
    const audioData = generateTestAudioChunk(0.5);
    
    // Test immediate streaming
    await window.immediateAudioPlayer.queueAudio(audioData.buffer);
    
    // Test progressive lipsync
    await window.progressiveLipsyncManager.addAudioChunk(audioData.buffer);
    
    // Wait between chunks to simulate realistic streaming
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log("✅ Synthetic streaming test completed");
  
  // Finalize lipsync
  await window.progressiveLipsyncManager.finalizeLipsync();
  
  console.log("🎯 Architecture test complete! Check if lips are moving and audio is playing.");
}

// Test progressive lipsync without audio
async function testLipsyncOnly() {
  console.log("💋 Testing lipsync-only functionality...");
  
  if (!window.progressiveLipsyncManager) {
    console.error("❌ Progressive lipsync manager not available");
    return;
  }
  
  const testChunks = 3;
  window.progressiveLipsyncManager.setTotalExpectedChunks(testChunks);
  
  for (let i = 0; i < testChunks; i++) {
    console.log(`💋 Processing lipsync chunk ${i + 1}/${testChunks}`);
    
    // Generate test audio chunk
    const audioData = generateTestAudioChunk(1.0);
    
    // Test progressive lipsync only
    await window.progressiveLipsyncManager.addAudioChunk(audioData.buffer);
    
    // Wait between chunks
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  await window.progressiveLipsyncManager.finalizeLipsync();
  
  console.log("✅ Lipsync-only test completed");
}

// Make functions available globally
window.testStreamingArchitecture = testStreamingArchitecture;
window.testLipsyncOnly = testLipsyncOnly;
window.generateTestAudioChunk = generateTestAudioChunk;

console.log("🧪 Test streaming functions loaded:");
console.log("- testStreamingArchitecture() - Test full streaming + lipsync");
console.log("- testLipsyncOnly() - Test just lipsync functionality");