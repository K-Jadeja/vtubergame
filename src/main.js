// src/main.js
import "./style.css";
import { Application, Ticker } from "pixi.js";
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";
import { updateProgress } from "./updateProgress.js";
import { Live2DAudioPlayer } from "./Live2DAudioPlayer.js";
import { StreamingAudioPlayer } from "./StreamingAudioPlayer.js";
import { TTSButtonHandler } from "./TTSButtonHandler.js";
import "./performance-test.js"; // Import performance testing

// Register ticker for model updates
Live2DModel.registerTicker(Ticker);

let app;
let model;
let ttsWorker;
let streamingAudioPlayer;
let buttonHandler;

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
  document.getElementById("load-cyan").onclick = () =>
    loadModel("/models/CyanSDLowRes/CyanSD.model3.json", "Cyan");
  try {
    const response = await fetch(`${PRESIDENT_ASSETS_PATH}models.json`);
    const sceneList = await response.json();
    createSceneButtons(sceneList);
  } catch (error) {
    console.error("Failed to load models.json:", error);
    alert("Could not load the scene list. Check the console.");
  }

  // Initialize TTS system with StreamingKokoroJS architecture
  initializeTTSSystem();

  console.log("Application initialized. Load a model to begin!");
}

function initializeTTSSystem() {
  // Initialize TTS worker
  ttsWorker = new Worker(new URL("./tts-worker.js", import.meta.url), {
    type: "module",
  });

  // Initialize streaming audio player for immediate playback + Live2D
  streamingAudioPlayer = new StreamingAudioPlayer(ttsWorker, model);

  // Initialize button handler with streaming audio player
  buttonHandler = new TTSButtonHandler(ttsWorker, streamingAudioPlayer);

  // Set up message handlers with hybrid streaming approach
  const onMessageReceived = async (e) => {
    switch (e.data.status) {
      case "loading_model_start":
        console.log("Kokoro TTS model loading started:", e.data);
        updateProgress(0, "Loading Kokoro TTS model...");
        break;

      case "loading_model_ready":
        buttonHandler.enableButton();
        updateProgress(100, "Kokoro TTS model loaded successfully");
        console.log(
          "Kokoro TTS model ready, voices available:",
          Object.keys(e.data.voices || {}).length
        );
        break;

      case "loading_model_progress":
        let progress = Number(e.data.progress) * 100;
        if (isNaN(progress)) progress = 0;
        updateProgress(
          progress,
          `Loading Kokoro model: ${Math.round(progress)}%`
        );
        break;

      case "chunk_count":
        // Set total chunks for progress tracking
        streamingAudioPlayer.setTotalChunks(e.data.count);
        console.log(`Expected ${e.data.count} audio chunks`);
        break;

      case "stream_audio_data":
        // Update button to stop state once we start receiving data
        buttonHandler.updateToStopState();

        // Queue audio for BOTH immediate streaming AND Live2D preparation
        await streamingAudioPlayer.queueAudio(e.data.audio);
        
        // Try to start early lipsync if we have enough chunks
        await streamingAudioPlayer.startEarlyLipsyncIfReady();
        break;

      case "complete":
        try {
          // Since we're already streaming audio, just finalize Live2D
          updateProgress(95, "Finalizing Live2D lipsync...");

          // Prepare final audio for Live2D if not already done
          if (!streamingAudioPlayer.currentAudioUrl) {
            await streamingAudioPlayer.prepareLive2DAudio();
          }

          updateProgress(98, "Synchronizing Live2D lipsync...");

          // Start or continue Live2D lipsync
          await streamingAudioPlayer.playWithLipsync();

          updateProgress(100, "Speech completed successfully!");
        } catch (error) {
          console.error("Error during Live2D playback:", error);
          updateProgress(100, "Error during speech playback!");
        } finally {
          buttonHandler.onComplete();
        }
        break;

      case "error":
        console.error("TTS Worker error:", e.data.error);
        buttonHandler.onError(e.data.error);
        break;
    }
  };

  const onErrorReceived = (e) => {
    console.error("TTS Worker error:", e);
    buttonHandler.onError(e.message || "Unknown worker error");
  };

  ttsWorker.addEventListener("message", onMessageReceived);
  ttsWorker.addEventListener("error", onErrorReceived);

  // Initialize button handlers
  buttonHandler.init();

  // Show initial progress
  updateProgress(0, "Initializing Kokoro TTS model...");
  document.getElementById("progressContainer").style.display = "block";
  
  // Make streaming audio player available globally for testing
  window.streamingAudioPlayer = streamingAudioPlayer;
}

/**
 * Creates the scene buttons from the fetched manifest data.
 */
function createSceneButtons(sceneList) {
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
    model.scale.set(0.1);

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

    // Update audio player with new model
    if (streamingAudioPlayer) {
      streamingAudioPlayer.setLive2DModel(model);
    }

    // Setup UI controls for this model
    setupModelControls(modelName);

    // Update scene title
    const sceneTitle = document.getElementById("scene-title");
    const sceneSubtitle = document.getElementById("scene-subtitle");
    sceneTitle.textContent = `Current Model: ${modelName}`;
    sceneSubtitle.textContent = `Loaded from: ${modelPath.split("/").pop()}`;

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

  console.log("Internal model:", internalModel);
  console.log("Motion manager:", motionManager);
  console.log("Expression manager:", expressionManager);
  console.log("Model settings:", internalModel.settings);

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

  // Expression info - handle different Cubism versions
  let expressionCount = 0;
  let sourceMethod = "none";

  // Method 1: Cubism 4 - expressionManager.definitions (array)
  if (
    expressionManager?.definitions &&
    Array.isArray(expressionManager.definitions)
  ) {
    expressionCount = expressionManager.definitions.length;
    sourceMethod = "expressionManager.definitions (Cubism 4)";
  }
  // Method 2: Cubism 2.1 - check model settings
  else if (
    model?.internalModel?.settings?.expressions &&
    Array.isArray(model.internalModel.settings.expressions)
  ) {
    expressionCount = model.internalModel.settings.expressions.length;
    sourceMethod = "settings.expressions (Cubism 2.1)";
  }
  // Method 3: Alternative - check if definitions is an object
  else if (
    expressionManager?.definitions &&
    typeof expressionManager.definitions === "object"
  ) {
    expressionCount = Object.keys(expressionManager.definitions).length;
    sourceMethod = "expressionManager.definitions (object)";
  }

  info += `<strong>Expressions:</strong> ${expressionCount} (via ${sourceMethod})<br>`;

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

  // Try different ways to get expressions for different Cubism versions
  let expressions = [];
  let sourceMethod = "";

  // Method 1: Cubism 4 - expressionManager.definitions (array)
  if (
    expressionManager?.definitions &&
    Array.isArray(expressionManager.definitions)
  ) {
    expressions = expressionManager.definitions;
    sourceMethod = "expressionManager.definitions (Cubism 4)";
  }
  // Method 2: Cubism 2.1 - check model settings
  else if (
    model?.internalModel?.settings?.expressions &&
    Array.isArray(model.internalModel.settings.expressions)
  ) {
    expressions = model.internalModel.settings.expressions;
    sourceMethod = "settings.expressions (Cubism 2.1)";
  }
  // Method 3: Alternative - check if definitions is an object (fallback)
  else if (
    expressionManager?.definitions &&
    typeof expressionManager.definitions === "object"
  ) {
    expressions = Object.values(expressionManager.definitions);
    sourceMethod = "expressionManager.definitions (object)";
  }

  console.log(`Found ${expressions.length} expressions via ${sourceMethod}`);
  console.log("Expressions array:", expressions);

  if (expressions.length === 0) {
    expressionsDiv.innerHTML += "<p>No expressions available</p>";
    console.log("DEBUG: Expression manager:", expressionManager);
    console.log("DEBUG: Model settings:", model?.internalModel?.settings);
    console.log(
      "DEBUG: Settings expressions:",
      model?.internalModel?.settings?.expressions
    );
    return;
  }

  console.log(`Setting up ${expressions.length} expression buttons...`);

  // Add expression buttons
  expressions.forEach((expression, index) => {
    const button = document.createElement("button");
    // Handle different naming conventions between Cubism versions
    const expressionName =
      expression.name || // Cubism 2.1
      expression.Name || // Cubism 4
      expression.file || // Alternative
      `Expression ${index}`; // Fallback

    button.textContent = expressionName;
    button.onclick = () => {
      console.log(`Setting expression: ${expressionName} (index: ${index})`);
      try {
        model.expression(index);
        console.log(`Expression ${index} applied successfully`);
      } catch (error) {
        console.error(`Failed to apply expression ${index}:`, error);
      }
    };
    button.className = "expression-btn";
    expressionsDiv.appendChild(button);
  });

  // Add reset expression button
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset Expression";
  resetBtn.onclick = () => {
    console.log("Resetting expression");
    try {
      model.expression();
      console.log("Expression reset successfully");
    } catch (error) {
      console.error("Failed to reset expression:", error);
    }
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

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
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
