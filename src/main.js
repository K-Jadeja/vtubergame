// src/main.js
import "./style.css";
import { Application, Ticker } from "pixi.js";
import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";
import { ModelManager, createSceneButtons } from "./model-manager.js";
import { ttsEngine } from "./tts.js";
import { UIManager } from "./ui-manager.js";

// Register ticker for model updates
Live2DModel.registerTicker(Ticker);

// Global variables
let app;
let modelManager;
let uiManager;

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

  // Initialize managers
  modelManager = new ModelManager(app);
  await ttsEngine.initialize();
  uiManager = new UIManager(modelManager, ttsEngine);
  uiManager.initialize();

  // Make managers globally accessible for button callbacks
  window.modelManager = modelManager;
  window.uiManager = uiManager;

  // Load President scene list
  await loadPresidentScenes();

  console.log("Application initialized successfully!");
}

/**
 * Load President scene models
 */
async function loadPresidentScenes() {
  try {
    const response = await fetch(`${PRESIDENT_ASSETS_PATH}models.json`);
    const sceneList = await response.json();
    createSceneButtons(sceneList);
    console.log("President scenes loaded successfully");
  } catch (error) {
    console.error("Failed to load models.json:", error);
    uiManager?.showError("Could not load the scene list. Check the console.");
  }
}

// Initialize the application
init().catch(error => {
  console.error("Failed to initialize application:", error);
  alert("Failed to initialize the application. Check the console for details.");
});