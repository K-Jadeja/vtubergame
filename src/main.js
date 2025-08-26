// src/main.js
import "./style.css";
import { Application, Ticker } from "pixi.js";
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";

// Register ticker for model updates
Live2DModel.registerTicker(Ticker);

let app;
let model;
const PRESIDENT_ASSETS_PATH = "/models/President game assets/";

async function init() {
  console.log("Initializing Live2D Test Application...");

  // Create PixiJS application
  const canvas = document.getElementById("canvas");
  console.log("Canvas element:", canvas);

  app = new Application({
    view: canvas,
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });

  // Add the app view to DOM if not using existing canvas
  if (!canvas) {
    document.getElementById("app").appendChild(app.view);
  }

  console.log("PixiJS Application created:", app);

  // Setup model loading buttons
  document.getElementById("load-shizuku").onclick = () =>
    loadModel("/models/shizuku/shizuku.model.json", "Shizuku");
  document.getElementById("load-haru").onclick = () =>
    loadModel("/models/haru/haru_greeter_t03.model3.json", "Haru");
  try {
    const response = await fetch(`${PRESIDENT_ASSETS_PATH}models.json`);
    const sceneList = await response.json();
    createSceneButtons(sceneList);
  } catch (error) {
    console.error("Failed to load models.json:", error);
    alert("Could not load the scene list. Check the console.");
  }

  // Setup TTS controls
  document.getElementById("speak-btn").onclick = () => {
    const text = document.getElementById("tts-text").value;
    if (text && model) {
      speakText(text);
    } else if (!model) {
      alert("Please load a model first!");
    }
  };

  document.getElementById("stop-btn").onclick = () => {
    if (model) {
      model.stopSpeaking();
      model.stopMotions();
    }
    // Also stop Kokoro TTS
    kokoroTTS.stop();
  };

  // Initialize Kokoro TTS
  try {
    console.log("Initializing Kokoro TTS...");
    await kokoroTTS.initialize();
    console.log("Kokoro TTS initialized successfully");
  } catch (error) {
    console.warn("Kokoro TTS initialization failed, will use fallback:", error);
  }

  console.log("Application initialized. Load a model to begin!");
}

/**
 * Creates the scene buttons from the fetched manifest data.
 */
function createSceneButtons(sceneList) {
  // NOTE: This assumes I changed my HTML to have <div id="scene-buttons"></div>
  const container = document.getElementById("scene-buttons");
  if (!container) return;

  sceneList.forEach((sceneInfo) => {
    const button = document.createElement("button");
    button.textContent = `Load ${sceneInfo.name}`;
    const fullModelPath = `${PRESIDENT_ASSETS_PATH}${sceneInfo.path}`;
    button.onclick = () => loadModel(fullModelPath, sceneInfo.name);
    container.appendChild(button);
  });
}

async function loadModel(modelPath, modelName) {
  try {
    console.log(`Loading ${modelName} model from: ${modelPath}`);

    // Remove existing model
    if (model) {
      app.stage.removeChild(model);
      model.destroy();
    }

    // Load new model
    model = await Live2DModel.from(modelPath);

    // Add to stage
    app.stage.addChild(model);

    console.log("Model dimensions:", {
      width: model.width,
      height: model.height,
      originalWidth: model.internalModel.width,
      originalHeight: model.internalModel.height,
    });

    // Position and scale model
    model.scale.set(0.3);

    // Center the model horizontally and position vertically
    model.x = app.screen.width / 2;
    model.y = app.screen.height * 0.8; // Position at 80% down from top

    // Set anchor to center bottom for better positioning
    model.anchor.set(0.5, 1.0);

    console.log("Model positioned at:", {
      x: model.x,
      y: model.y,
      scale: model.scale.x,
    });

    // Setup model interaction
    model.eventMode = "static";
    model.cursor = "pointer";
    model.on("hit", (hitAreas) => {
      console.log("Hit areas:", hitAreas);
      if (hitAreas.includes("body")) {
        triggerRandomMotion("tapBody");
      } else if (hitAreas.includes("head")) {
        triggerRandomMotion("flickHead");
      }
    });

    // Setup UI controls for this model
    setupModelControls(modelName);

    console.log(`${modelName} model loaded successfully!`);
    console.log("Stage children count:", app.stage.children.length);
    console.log("Model visible:", model.visible);
    console.log("Model alpha:", model.alpha);
    console.log("App renderer size:", {
      width: app.renderer.width,
      height: app.renderer.height,
    });

    // Force a render
    app.render();
  } catch (error) {
    console.error(`Failed to load ${modelName} model:`, error);
    alert(`Failed to load ${modelName} model. Check console for details.`);
  }
}

function setupModelControls(modelName) {
  if (!model) return;

  console.log("Setting up controls for model:", modelName);

  // Get model information
  const internalModel = model.internalModel;
  const motionManager = internalModel.motionManager;
  const expressionManager = internalModel.expressionManager;

  // Display model info
  displayModelInfo(modelName, motionManager, expressionManager);

  // Setup motion controls
  setupMotionControls(motionManager);

  // Setup expression controls
  setupExpressionControls(expressionManager);
}

function displayModelInfo(modelName, motionManager, expressionManager) {
  const infoDiv = document.getElementById("info-content");
  let info = `<strong>Model:</strong> ${modelName}<br>`;

  // Motion groups info
  const motionGroups = motionManager.definitions || {};
  info += `<strong>Motion Groups:</strong> ${
    Object.keys(motionGroups).length
  }<br>`;

  for (const [groupName, motions] of Object.entries(motionGroups)) {
    if (Array.isArray(motions)) {
      info += `&nbsp;&nbsp;• ${groupName}: ${motions.length} motions<br>`;
    }
  }

  // Expression info
  const expressions = expressionManager?.definitions || [];
  info += `<strong>Expressions:</strong> ${expressions.length}<br>`;

  infoDiv.innerHTML = info;
}

function setupMotionControls(motionManager) {
  const motionsDiv = document.getElementById("motions");
  motionsDiv.innerHTML = "<h3>Motions:</h3>";

  const motionGroups = motionManager.definitions || {};

  if (Object.keys(motionGroups).length === 0) {
    motionsDiv.innerHTML += "<p>No motions available</p>";
    return;
  }

  for (const [groupName, motions] of Object.entries(motionGroups)) {
    if (Array.isArray(motions) && motions.length > 0) {
      const groupDiv = document.createElement("div");
      groupDiv.innerHTML = `<strong>${groupName}:</strong><br>`;

      // Add individual motion buttons
      motions.forEach((motion, index) => {
        const button = document.createElement("button");
        button.textContent = `${groupName} ${index}`;
        button.onclick = () => {
          console.log(`Playing motion: ${groupName}[${index}]`);
          model.motion(groupName, index, 2); // Priority 2 = normal
        };
        button.className = "motion-btn";
        groupDiv.appendChild(button);
      });

      // Add random motion button for this group
      const randomBtn = document.createElement("button");
      randomBtn.textContent = `Random ${groupName}`;
      randomBtn.onclick = () => triggerRandomMotion(groupName);
      randomBtn.className = "motion-btn random-btn";
      groupDiv.appendChild(randomBtn);

      groupDiv.appendChild(document.createElement("br"));
      motionsDiv.appendChild(groupDiv);
    }
  }
}

function setupExpressionControls(expressionManager) {
  const expressionsDiv = document.getElementById("expressions");
  expressionsDiv.innerHTML = "<h3>Expressions:</h3>";

  const expressions = expressionManager?.definitions || [];

  if (expressions.length === 0) {
    expressionsDiv.innerHTML += "<p>No expressions available</p>";
    return;
  }

  // Add expression buttons
  expressions.forEach((expression, index) => {
    const button = document.createElement("button");
    const expressionName =
      expression.name || expression.Name || `Expression ${index}`;
    button.textContent = expressionName;
    button.onclick = () => {
      console.log(`Setting expression: ${expressionName} (${index})`);
      model.expression(index);
    };
    button.className = "expression-btn";
    expressionsDiv.appendChild(button);
  });

  // Add reset expression button
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset Expression";
  resetBtn.onclick = () => {
    console.log("Resetting expression");
    model.expression();
  };
  resetBtn.className = "expression-btn reset-btn";
  expressionsDiv.appendChild(resetBtn);
}

function triggerRandomMotion(groupName) {
  if (!model) return;

  const motionManager = model.internalModel.motionManager;
  const motionGroups = motionManager.definitions || {};
  const motions = motionGroups[groupName];

  if (motions && Array.isArray(motions) && motions.length > 0) {
    const randomIndex = Math.floor(Math.random() * motions.length);
    console.log(`Playing random motion: ${groupName}[${randomIndex}]`);
    model.motion(groupName, randomIndex, 2);
  }
}

async function speakText(text) {
  if (!model) return;

  console.log(`Speaking text: "${text}"`);

  try {
    // Check if Kokoro TTS is ready
    if (!kokoroTTS.isInitialized) {
      console.log("Kokoro TTS is loading. Please wait...");
      // Fallback to basic TTS for now
      fallbackToBasicTTS(text);
      return;
    }

    // Generate TTS audio using Kokoro.js
    console.log("Generating TTS audio with lipsync...");
    const audioUrl = await kokoroTTS.generateSpeech(text, "af_nicole");

    if (audioUrl) {
      console.log(`Generated TTS audio blob: ${audioUrl}`);

      // Use the model's speak function for lip sync with the generated audio
      model.speak(audioUrl, {
        volume: 0.8,
        expression: getRandomExpression(),
        resetExpression: true,
        crossOrigin: "anonymous",
        onFinish: () => {
          console.log("TTS lipsync finished");
          // Clean up the temporary audio URL
          URL.revokeObjectURL(audioUrl);
        },
        onError: (err) => {
          console.error("TTS lipsync error:", err);
          // Clean up on error
          URL.revokeObjectURL(audioUrl);
          // Fallback to basic TTS
          fallbackToBasicTTS(text);
        },
      });

      // Trigger a talking motion
      triggerRandomMotion("tap_body") ||
        triggerRandomMotion("idle") ||
        triggerRandomMotion("Idle");
    } else {
      console.warn("Failed to generate TTS audio, using fallback");
      fallbackToBasicTTS(text);
    }
  } catch (error) {
    console.error("TTS generation error:", error);
    fallbackToBasicTTS(text);
  }
}

// Kokoro TTS Integration based on StreamingKokoroJS architecture
class KokoroTTSManager {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.audioChunks = [];
    this.isProcessing = false;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log("Initializing Kokoro TTS worker...");
      this.worker = new Worker(new URL("./tts-worker.js", import.meta.url), {
        type: "module",
      });

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Kokoro TTS initialization timeout"));
        }, 60000); // 60 second timeout

        this.worker.addEventListener("message", (e) => {
          switch (e.data.status) {
            case "loading_model_ready":
              clearTimeout(timeoutId);
              console.log("Kokoro TTS model loaded successfully");
              this.isInitialized = true;
              resolve(true);
              break;
            case "error":
              clearTimeout(timeoutId);
              console.error("Kokoro TTS error:", e.data.error);
              this.isInitialized = false;
              reject(new Error(e.data.error));
              break;
            case "loading_model_progress":
              const progress = Math.round(e.data.progress * 100);
              console.log(`Loading Kokoro model: ${progress}%`);
              break;
          }
        });

        this.worker.addEventListener("error", (error) => {
          clearTimeout(timeoutId);
          console.error("Kokoro TTS worker error:", error);
          this.isInitialized = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error("Failed to initialize Kokoro TTS:", error);
      this.isInitialized = false;
      return false;
    }
  }

  async generateSpeech(text, voice = "af_heart") {
    if (!this.isInitialized) {
      throw new Error(
        "Kokoro TTS is not initialized yet. Please wait for model to load."
      );
    }

    return new Promise((resolve, reject) => {
      this.audioChunks = [];

      const messageHandler = (e) => {
        switch (e.data.status) {
          case "stream_audio_data":
            // Collect Float32Array audio data from worker
            this.audioChunks.push(new Float32Array(e.data.audio));
            // Notify worker that buffer has been processed
            this.worker.postMessage({ type: "buffer_processed" });
            break;
          case "complete":
            // Convert all audio chunks to WAV blob compatible with Live2D
            try {
              const wavBlob = this.createWavBlob(this.audioChunks);
              const audioUrl = URL.createObjectURL(wavBlob);
              this.worker.removeEventListener("message", messageHandler);
              resolve(audioUrl);
            } catch (error) {
              this.worker.removeEventListener("message", messageHandler);
              reject(error);
            }
            break;
          case "error":
            this.worker.removeEventListener("message", messageHandler);
            reject(new Error(e.data.error));
            break;
        }
      };

      this.worker.addEventListener("message", messageHandler);
      this.worker.postMessage({ text, voice });
    });
  }

  // Create a properly formatted WAV blob that Live2D can handle
  createWavBlob(audioChunks) {
    if (audioChunks.length === 0) {
      throw new Error("No audio chunks to combine");
    }

    // Calculate total length
    const totalLength = audioChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0
    );

    // Combine all chunks into a single Float32Array
    const combinedAudio = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert Float32Array to 16-bit PCM for WAV format
    const sampleRate = 24000; // Kokoro model sample rate
    const buffer = new ArrayBuffer(44 + combinedAudio.length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + combinedAudio.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, combinedAudio.length * 2, true);

    // Convert float samples to 16-bit PCM
    let offset2 = 44;
    for (let i = 0; i < combinedAudio.length; i++) {
      const sample = Math.max(-1, Math.min(1, combinedAudio[i]));
      view.setInt16(offset2, sample * 0x7fff, true);
      offset2 += 2;
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  stop() {
    if (this.worker) {
      this.worker.postMessage({ type: "stop" });
    }
  }
}

// Create global Kokoro TTS instance
const kokoroTTS = new KokoroTTSManager();

function fallbackToBasicTTS(text) {
  console.log("Using basic browser TTS fallback (no lipsync)");

  const utterance = new SpeechSynthesisUtterance(text);

  // Get available voices
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    const femaleVoice = voices.find(
      (voice) =>
        voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("woman") ||
        voice.name.toLowerCase().includes("zira") ||
        voice.name.toLowerCase().includes("hazel")
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
  }

  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  utterance.onstart = () => {
    console.log("Basic TTS started");
    triggerRandomMotion("tap_body") ||
      triggerRandomMotion("idle") ||
      triggerRandomMotion("Idle");
  };

  utterance.onend = () => {
    console.log("Basic TTS ended");
  };

  utterance.onerror = (event) => {
    console.error("Basic TTS error:", event);
  };

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function getSampleAudio() {
  if (!model) return null;

  // Try to find sample audio files in the model's sound directory
  // This is based on the Shizuku model structure we copied
  const sampleSounds = [
    "/models/shizuku/sounds/tapBody_00.mp3",
    "/models/shizuku/sounds/tapBody_01.mp3",
    "/models/shizuku/sounds/pinchIn_00.mp3",
    "/models/shizuku/sounds/flickHead_00.mp3",
  ];

  // Return a random sample sound
  return sampleSounds[Math.floor(Math.random() * sampleSounds.length)];
}

function getRandomExpression() {
  if (!model || !model.internalModel.expressionManager) return null;

  const expressions = model.internalModel.expressionManager.definitions || [];
  if (expressions.length === 0) return null;

  return Math.floor(Math.random() * expressions.length);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit for voices to load
  setTimeout(() => {
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener("voiceschanged", () => {
        console.log(
          "Available voices:",
          speechSynthesis.getVoices().map((v) => v.name)
        );
      });
    } else {
      console.log(
        "Available voices:",
        speechSynthesis.getVoices().map((v) => v.name)
      );
    }
  }, 100);

  init();
});

// Debug function to check model visibility
function debugModel() {
  if (!model) {
    console.log("No model loaded");
    return;
  }

  console.log("=== MODEL DEBUG INFO ===");
  console.log("Model visible:", model.visible);
  console.log("Model alpha:", model.alpha);
  console.log("Model position:", { x: model.x, y: model.y });
  console.log("Model scale:", { x: model.scale.x, y: model.scale.y });
  console.log("Model bounds:", model.getBounds());
  console.log("App stage children:", app.stage.children.length);
  console.log("App renderer size:", {
    width: app.renderer.width,
    height: app.renderer.height,
  });
  console.log("Canvas element:", document.getElementById("canvas"));
  console.log("========================");
}

// Add debug function to window for console access
window.debugModel = debugModel;
