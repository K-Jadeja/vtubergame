/**
 * Performance testing script for Kokoro TTS Streaming
 * 
 * This script measures the time from button click to first audio output
 * to verify our optimizations are working.
 */

// Test timing measurements
let performanceMetrics = {
  buttonClickTime: null,
  firstChunkTime: null,
  firstAudioPlayTime: null,
  lipsyncStartTime: null,
  completeTime: null
};

// Hook into the StreamingAudioPlayer to measure performance
function instrumentPerformance() {
  console.log("🚀 Performance testing enabled");
  
  // Measure button click
  document.getElementById("speak-btn").addEventListener("click", () => {
    performanceMetrics.buttonClickTime = performance.now();
    console.log("📊 Button clicked at:", performanceMetrics.buttonClickTime);
  });
  
  // Hook into the streaming audio player if available
  if (window.immediateAudioPlayer) {
    const originalQueueAudio = window.immediateAudioPlayer.queueAudio.bind(window.immediateAudioPlayer);
    window.immediateAudioPlayer.queueAudio = async function(audioData) {
      if (!performanceMetrics.firstChunkTime) {
        performanceMetrics.firstChunkTime = performance.now();
        const timeToFirstChunk = performanceMetrics.firstChunkTime - performanceMetrics.buttonClickTime;
        console.log("📊 First audio chunk received after:", Math.round(timeToFirstChunk), "ms");
      }
      return originalQueueAudio(audioData);
    };
    
    const originalPlayAudioQueue = window.immediateAudioPlayer.playAudioQueue.bind(window.immediateAudioPlayer);
    window.immediateAudioPlayer.playAudioQueue = async function() {
      if (!performanceMetrics.firstAudioPlayTime) {
        performanceMetrics.firstAudioPlayTime = performance.now();
        const timeToFirstPlay = performanceMetrics.firstAudioPlayTime - performanceMetrics.buttonClickTime;
        console.log("📊 First audio started playing after:", Math.round(timeToFirstPlay), "ms");
        console.log("🎯 TARGET: Should be under 12 seconds (12000ms)");
        
        if (timeToFirstPlay < 12000) {
          console.log("✅ PERFORMANCE TARGET MET!");
        } else {
          console.log("❌ Performance target missed. Current:", Math.round(timeToFirstPlay), "ms");
        }
      }
      return originalPlayAudioQueue();
    };
  }
  
  // Hook into progressive lipsync manager
  if (window.progressiveLipsyncManager) {
    const originalUpdateLipsync = window.progressiveLipsyncManager.updateLipsync.bind(window.progressiveLipsyncManager);
    window.progressiveLipsyncManager.updateLipsync = async function() {
      if (!performanceMetrics.lipsyncStartTime) {
        performanceMetrics.lipsyncStartTime = performance.now();
        const timeToLipsync = performanceMetrics.lipsyncStartTime - performanceMetrics.buttonClickTime;
        console.log("📊 Live2D lipsync started after:", Math.round(timeToLipsync), "ms");
      }
      return originalUpdateLipsync();
    };
  }
}

// Print performance summary
function printPerformanceSummary() {
  console.log("\n📊 PERFORMANCE SUMMARY:");
  console.log("======================");
  
  if (performanceMetrics.buttonClickTime && performanceMetrics.firstAudioPlayTime) {
    const timeToAudio = performanceMetrics.firstAudioPlayTime - performanceMetrics.buttonClickTime;
    console.log(`🎵 Time to first audio: ${Math.round(timeToAudio)}ms`);
    
    if (timeToAudio < 12000) {
      console.log("✅ StreamingKokoroJS performance target MET!");
    } else {
      console.log("❌ Still slower than StreamingKokoroJS target (12s)");
    }
  }
  
  if (performanceMetrics.buttonClickTime && performanceMetrics.lipsyncStartTime) {
    const timeToLipsync = performanceMetrics.lipsyncStartTime - performanceMetrics.buttonClickTime;
    console.log(`💋 Time to Live2D lipsync: ${Math.round(timeToLipsync)}ms`);
  }
  
  console.log("\n🎯 Target: Under 12 seconds for first audio");
  console.log("📈 Previous: ~60 seconds (1 minute)");
  console.log("======================\n");
}

// Auto-run performance testing
if (typeof window !== 'undefined') {
  // Wait for page to load, then instrument
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(instrumentPerformance, 1000);
    });
  } else {
    setTimeout(instrumentPerformance, 1000);
  }
  
  // Add to window for manual access
  window.printPerformanceSummary = printPerformanceSummary;
  window.performanceMetrics = performanceMetrics;
}

export { instrumentPerformance, printPerformanceSummary, performanceMetrics };