// TTS System Test Script
// Copy and paste this into browser console after loading the page

function testTTSVoices() {
  console.log("=== TESTING TTS VOICES ===");

  // Test different voices
  const voices = [
    { name: "Nicole (default)", value: "af_nicole" },
    { name: "Sarah", value: "af_sarah" },
    { name: "Sky", value: "af_sky" },
    { name: "Bella", value: "bf_bella" },
    { name: "Charon", value: "bf_charon" },
    { name: "Emma", value: "bf_emma" },
    { name: "Isabella", value: "bf_isabella" },
    { name: "Ryan", value: "am_ryan" },
    { name: "Ben", value: "am_adam" },
    { name: "Alex", value: "am_alex" },
  ];

  const testText =
    "Hello! I am testing the text to speech system. How do I sound?";
  let currentVoice = 0;

  function testNextVoice() {
    if (currentVoice >= voices.length) {
      console.log("✅ All TTS voices tested!");
      return;
    }

    const voice = voices[currentVoice];
    console.log(`\n--- Testing ${voice.name} (${voice.value}) ---`);

    // Update voice selector
    const voiceSelect = document.getElementById("voice-select");
    if (voiceSelect) {
      voiceSelect.value = voice.value;
      console.log(`Set voice to: ${voice.value}`);
    } else {
      console.warn("Voice selector not found");
    }

    // Test TTS
    const textInput = document.getElementById("text-input");
    const speakButton = document.getElementById("speak-btn");

    if (textInput && speakButton) {
      textInput.value = `Testing ${voice.name}. ${testText}`;
      speakButton.click();
      console.log(`✅ ${voice.name}: TTS request sent`);
    } else {
      console.error(`❌ ${voice.name}: UI elements not found`);
    }

    currentVoice++;
    setTimeout(testNextVoice, 8000); // Wait 8 seconds between tests
  }

  testNextVoice();
}

function testTTSSystem() {
  console.log("=== TESTING TTS SYSTEM FUNCTIONALITY ===");

  // Check if TTS components exist
  const checks = [
    { name: "Text Input", id: "text-input" },
    { name: "Voice Select", id: "voice-select" },
    { name: "Speak Button", id: "speak-btn" },
    { name: "Stop Button", id: "stop-btn" },
    { name: "Audio Progress", class: "audio-progress" },
  ];

  checks.forEach((check) => {
    const element = check.id
      ? document.getElementById(check.id)
      : document.querySelector(`.${check.class}`);

    if (element) {
      console.log(`✅ ${check.name}: Found`);
    } else {
      console.log(`❌ ${check.name}: Missing`);
    }
  });

  // Check if TTS worker is available
  if (window.ttsWorker) {
    console.log("✅ TTS Worker: Available");
  } else {
    console.log("❌ TTS Worker: Not found");
  }

  // Check voice options
  const voiceSelect = document.getElementById("voice-select");
  if (voiceSelect) {
    const options = voiceSelect.querySelectorAll("option");
    console.log(`✅ Voice Options: ${options.length} available`);
    options.forEach((option) => {
      console.log(`  - ${option.textContent} (${option.value})`);
    });
  }

  // Test sample TTS
  console.log("\n--- Testing Sample TTS ---");
  const testText = "This is a test of the text to speech system.";
  testTTSWithText(testText);
}

function testTTSWithText(text, voiceId = "af_nicole") {
  console.log(`Testing TTS with text: "${text}"`);
  console.log(`Using voice: ${voiceId}`);

  // Set voice
  const voiceSelect = document.getElementById("voice-select");
  if (voiceSelect) {
    voiceSelect.value = voiceId;
  }

  // Set text
  const textInput = document.getElementById("text-input");
  if (textInput) {
    textInput.value = text;
  }

  // Trigger TTS
  const speakButton = document.getElementById("speak-btn");
  if (speakButton) {
    speakButton.click();
    console.log("✅ TTS request sent");

    // Monitor for audio completion
    setTimeout(() => {
      const audioProgress = document.querySelector(".audio-progress");
      if (audioProgress) {
        console.log(`Audio progress: ${audioProgress.style.width || "0%"}`);
      }
    }, 2000);
  } else {
    console.error("❌ Speak button not found");
  }
}

function testTTSStop() {
  console.log("=== TESTING TTS STOP FUNCTIONALITY ===");

  // Start a long TTS
  const longText =
    "This is a very long text that should take a while to speak. " +
    "We will test if we can stop it mid-speech. " +
    "If this is working correctly, you should be able to interrupt this message.";

  testTTSWithText(longText);

  // Stop after 3 seconds
  setTimeout(() => {
    const stopButton = document.getElementById("stop-btn");
    if (stopButton) {
      stopButton.click();
      console.log("✅ Stop button clicked");
    } else {
      console.error("❌ Stop button not found");
    }
  }, 3000);
}

function testTTSPhonemes() {
  console.log("=== TESTING TTS PHONEME INTEGRATION ===");

  if (window.phonemize) {
    console.log("✅ Phonemizer available");

    const testText = "Hello world";
    try {
      const phonemes = window.phonemize(testText);
      console.log(`Phonemes for "${testText}":`, phonemes);
    } catch (error) {
      console.error("❌ Phonemizer error:", error);
    }
  } else {
    console.log("❌ Phonemizer not available");
  }

  // Check if Live2D lip sync is working
  if (window.model) {
    console.log("✅ Live2D model available for lip sync");

    // Test with TTS
    const testText = "Testing lip sync with Live2D model";
    testTTSWithText(testText);

    // Check for lip sync after a delay
    setTimeout(() => {
      console.log("Check if model mouth is moving during speech");
    }, 2000);
  } else {
    console.log("❌ No Live2D model loaded for lip sync test");
  }
}

function debugTTS() {
  console.log("=== TTS DEBUG INFO ===");

  // Check global TTS variables
  console.log("TTS Worker:", window.ttsWorker);
  console.log("Current Audio:", window.currentAudio);
  console.log("Audio Context:", window.audioContext);

  // Check UI state
  const voiceSelect = document.getElementById("voice-select");
  const textInput = document.getElementById("text-input");

  if (voiceSelect) {
    console.log("Current voice:", voiceSelect.value);
  }

  if (textInput) {
    console.log("Current text:", textInput.value);
  }

  // Check if any audio is playing
  const audioElements = document.querySelectorAll("audio");
  console.log(`Audio elements found: ${audioElements.length}`);
  audioElements.forEach((audio, index) => {
    console.log(
      `Audio ${index}: paused=${audio.paused}, currentTime=${audio.currentTime}, duration=${audio.duration}`
    );
  });

  console.log("=== END DEBUG ===");
}

// Performance test
function testTTSPerformance() {
  console.log("=== TESTING TTS PERFORMANCE ===");

  const testTexts = [
    "Short test.",
    "This is a medium length test sentence that should take a few seconds to process.",
    "This is a very long test sentence that contains multiple clauses and should take significantly longer to process through the text to speech system, allowing us to measure performance characteristics.",
  ];

  let currentTest = 0;
  const results = [];

  function runNextPerformanceTest() {
    if (currentTest >= testTexts.length) {
      console.log("=== PERFORMANCE TEST RESULTS ===");
      results.forEach((result, index) => {
        console.log(
          `Test ${index + 1}: ${result.duration}ms for ${
            result.characters
          } characters`
        );
        console.log(
          `  Rate: ${((result.characters / result.duration) * 1000).toFixed(
            2
          )} chars/second`
        );
      });
      return;
    }

    const text = testTexts[currentTest];
    const startTime = Date.now();

    console.log(
      `Performance test ${currentTest + 1}: "${text.substring(0, 50)}..."`
    );

    // Start TTS
    testTTSWithText(text);

    // Estimate completion time (rough)
    const estimatedDuration = text.length * 50; // ~50ms per character estimate
    setTimeout(() => {
      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      results.push({
        characters: text.length,
        duration: actualDuration,
      });

      currentTest++;
      setTimeout(runNextPerformanceTest, 2000);
    }, estimatedDuration);
  }

  runNextPerformanceTest();
}

// Auto-load functions
window.testTTSVoices = testTTSVoices;
window.testTTSSystem = testTTSSystem;
window.testTTSWithText = testTTSWithText;
window.testTTSStop = testTTSStop;
window.testTTSPhonemes = testTTSPhonemes;
window.testTTSPerformance = testTTSPerformance;
window.debugTTS = debugTTS;

console.log("TTS test functions loaded:");
console.log("- testTTSVoices() - Test all available voices");
console.log("- testTTSSystem() - Test TTS system components");
console.log(
  "- testTTSWithText(text, voice) - Test TTS with specific text/voice"
);
console.log("- testTTSStop() - Test TTS stop functionality");
console.log("- testTTSPhonemes() - Test phoneme integration");
console.log("- testTTSPerformance() - Test TTS performance");
console.log("- debugTTS() - Debug TTS system state");
console.log("Run testTTSSystem() to start basic test");
