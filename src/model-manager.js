// src/model-manager.js
// Live2D Model management and utilities

import { Live2DModel } from "pixi-live2d-display-lipsyncpatch";

/**
 * Manages Live2D model loading, interactions, and state
 */
export class ModelManager {
  constructor(app) {
    this.app = app;
    this.currentModel = null;
    this.modelInfo = {
      name: '',
      motionGroups: [],
      expressions: []
    };
  }

  /**
   * Load a Live2D model
   */
  async loadModel(modelPath, modelName) {
    console.log(`Loading model: ${modelName} from ${modelPath}`);
    
    try {
      // Remove existing model
      if (this.currentModel) {
        this.app.stage.removeChild(this.currentModel);
        this.currentModel.destroy();
      }

      // Load new model
      const model = await Live2DModel.from(modelPath, {
        autoInteract: true,
        crossOrigin: "anonymous",
      });

      // Configure model
      this.setupModel(model, modelName);
      
      // Add to stage
      this.app.stage.addChild(model);
      this.currentModel = model;

      // Update model info
      this.updateModelInfo(model, modelName);
      
      console.log(`Model ${modelName} loaded successfully`);
      return model;
      
    } catch (error) {
      console.error(`Failed to load model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Setup model positioning and scale
   */
  setupModel(model, modelName) {
    // Scale model to fit canvas
    const scale = Math.min(
      this.app.screen.width / model.width,
      this.app.screen.height / model.height
    ) * 0.8;
    
    model.scale.set(scale);
    
    // Center model
    model.x = this.app.screen.width / 2;
    model.y = this.app.screen.height / 2;
    model.anchor.set(0.5, 0.5);

    // Enable interactions
    model.interactive = true;
    model.on("hit", this.onModelHit.bind(this));

    console.log(`Model ${modelName} configured: scale=${scale.toFixed(2)}, position=(${model.x}, ${model.y})`);
  }

  /**
   * Handle model interactions
   */
  onModelHit(hitAreas) {
    console.log("Model hit areas:", hitAreas);
    
    if (this.currentModel) {
      // Trigger random motion based on hit area
      for (const hitArea of hitAreas) {
        if (this.triggerMotionForHitArea(hitArea)) {
          break; // Only trigger one motion
        }
      }
    }
  }

  /**
   * Trigger motion based on hit area
   */
  triggerMotionForHitArea(hitArea) {
    const motionMap = {
      'head': ['flick_head', 'tap_head', 'pinch_in', 'pinch_out'],
      'body': ['tap_body'],
      'arm': ['tap_body'],
      'hand': ['tap_body']
    };

    const areaName = hitArea.toLowerCase();
    for (const [area, motions] of Object.entries(motionMap)) {
      if (areaName.includes(area)) {
        for (const motion of motions) {
          if (this.triggerRandomMotion(motion)) {
            return true;
          }
        }
      }
    }

    // Fallback to idle motion
    return this.triggerRandomMotion('idle') || this.triggerRandomMotion('Idle');
  }

  /**
   * Trigger a random motion from a group
   */
  triggerRandomMotion(groupName) {
    if (!this.currentModel) return false;

    try {
      const motionGroup = this.currentModel.internalModel.motionManager.definitions[groupName];
      if (motionGroup && motionGroup.length > 0) {
        const randomIndex = Math.floor(Math.random() * motionGroup.length);
        this.currentModel.motion(groupName, randomIndex);
        console.log(`Playing random motion: ${groupName}[${randomIndex}]`);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to play motion ${groupName}:`, error);
    }
    
    return false;
  }

  /**
   * Update model information
   */
  updateModelInfo(model, modelName) {
    this.modelInfo.name = modelName;
    this.modelInfo.motionGroups = [];
    this.modelInfo.expressions = [];

    try {
      // Get motion groups
      const motionDefinitions = model.internalModel.motionManager.definitions;
      for (const [groupName, motions] of Object.entries(motionDefinitions)) {
        this.modelInfo.motionGroups.push({
          name: groupName,
          count: motions.length
        });
      }

      // Get expressions
      const expressionManager = model.internalModel.motionManager.expressionManager;
      if (expressionManager && expressionManager.definitions) {
        this.modelInfo.expressions = Object.keys(expressionManager.definitions);
      }
    } catch (error) {
      console.warn("Failed to get model info:", error);
    }
  }

  /**
   * Get random expression
   */
  getRandomExpression() {
    if (this.modelInfo.expressions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.modelInfo.expressions.length);
    return this.modelInfo.expressions[randomIndex];
  }

  /**
   * Set model expression
   */
  setExpression(expressionName) {
    if (!this.currentModel) return false;
    
    try {
      this.currentModel.expression(expressionName);
      console.log(`Set expression: ${expressionName}`);
      return true;
    } catch (error) {
      console.warn(`Failed to set expression ${expressionName}:`, error);
      return false;
    }
  }

  /**
   * Get current model
   */
  getCurrentModel() {
    return this.currentModel;
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return { ...this.modelInfo };
  }

  /**
   * Check if model is loaded
   */
  hasModel() {
    return this.currentModel !== null;
  }
}

/**
 * Create scene buttons for President models
 */
export function createSceneButtons(sceneList) {
  const sceneButtonsDiv = document.getElementById("scene-buttons");
  sceneButtonsDiv.innerHTML = "<h4>President Scenes:</h4>";

  for (const scene of sceneList) {
    const button = document.createElement("button");
    button.textContent = `Load ${scene.name}`;
    button.onclick = () => {
      const modelManager = window.modelManager; // Global reference
      if (modelManager) {
        modelManager.loadModel(scene.path, scene.name);
      }
    };
    sceneButtonsDiv.appendChild(button);
  }
}