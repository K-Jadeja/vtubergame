// Model Loading Test Script
// Copy and paste this into browser console after loading the page

function testModelLoading() {
  console.log("=== TESTING MODEL LOADING ===");

  // Define all models to test
  const models = [
    {
      name: "Shizuku (Cubism 2.1)",
      buttonId: "load-shizuku",
      path: "/models/shizuku/shizuku.model.json",
    },
    {
      name: "Haru (Cubism 4)",
      buttonId: "load-haru",
      path: "/models/haru/haru_greeter_t03.model3.json",
    },
    {
      name: "Cyan (Cubism 4)",
      buttonId: "load-cyan",
      path: "/models/cyan/cyan.model3.json",
    },
  ];

  let currentModel = 0;
  const results = [];

  function testNextModel() {
    if (currentModel >= models.length) {
      console.log("=== MODEL LOADING TEST RESULTS ===");
      results.forEach((result) => {
        console.log(`${result.name}: ${result.status}`);
        if (result.details) {
          Object.entries(result.details).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        }
      });
      console.log("=== ALL MODEL LOADING TESTS COMPLETED ===");
      return;
    }

    const model = models[currentModel];
    console.log(`\n--- Testing ${model.name} ---`);

    const startTime = Date.now();

    // Clear any existing model
    if (window.model) {
      console.log("Clearing existing model...");
      window.model.destroy();
      window.model = null;
    }

    // Click the load button
    const button = document.getElementById(model.buttonId);
    if (!button) {
      console.error(`❌ Button ${model.buttonId} not found`);
      results.push({
        name: model.name,
        status: "❌ FAIL - Button not found",
      });
      currentModel++;
      setTimeout(testNextModel, 1000);
      return;
    }

    button.click();
    console.log(`Loading ${model.name}...`);

    // Wait for model to load
    const checkInterval = setInterval(() => {
      if (window.model) {
        const loadTime = Date.now() - startTime;
        clearInterval(checkInterval);

        console.log(`✅ ${model.name} loaded in ${loadTime}ms`);

        // Analyze loaded model
        analyzeLoadedModel(model, loadTime, (details) => {
          results.push({
            name: model.name,
            status: "✅ PASS",
            details: details,
          });

          currentModel++;
          setTimeout(testNextModel, 2000);
        });
      }
    }, 500);

    // Timeout after 15 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.model) {
        const loadTime = Date.now() - startTime;
        console.error(
          `❌ ${model.name} failed to load (timeout after ${loadTime}ms)`
        );
        results.push({
          name: model.name,
          status: "❌ FAIL - Timeout",
        });

        currentModel++;
        setTimeout(testNextModel, 1000);
      }
    }, 15000);
  }

  testNextModel();
}

function analyzeLoadedModel(modelInfo, loadTime, callback) {
  console.log(`Analyzing ${modelInfo.name}...`);

  const details = {
    "Load Time": `${loadTime}ms`,
    "Cubism Version": "Unknown",
  };

  try {
    const model = window.model;
    const internalModel = model.internalModel;

    // Detect Cubism version
    if (internalModel.settings) {
      details["Cubism Version"] = "2.1";
    } else if (internalModel.coreModel) {
      details["Cubism Version"] = "4.0";
    }

    // Check expressions
    const expressionManager = internalModel.expressionManager;
    let expressionCount = 0;

    if (expressionManager?.definitions) {
      // Cubism 4
      expressionCount = Object.keys(expressionManager.definitions).length;
    } else if (internalModel.settings?.expressions) {
      // Cubism 2.1
      expressionCount = internalModel.settings.expressions.length;
    }

    details["Expressions"] = expressionCount;

    // Check motions
    const motionManager = internalModel.motionManager;
    let motionGroups = 0;
    let totalMotions = 0;

    if (motionManager?.definitions) {
      const groups = motionManager.definitions;
      motionGroups = Object.keys(groups).length;
      totalMotions = Object.values(groups).reduce((sum, group) => {
        return sum + (Array.isArray(group) ? group.length : 0);
      }, 0);
    }

    details["Motion Groups"] = motionGroups;
    details["Total Motions"] = totalMotions;

    // Check textures
    const textures = internalModel.textures || [];
    details["Textures"] = textures.length;

    // Check hit areas
    let hitAreas = 0;
    if (internalModel.settings?.hitAreas) {
      hitAreas = internalModel.settings.hitAreas.length;
    } else if (internalModel.coreModel?.getParameterCount) {
      // Rough estimate for Cubism 4
      hitAreas = "Available";
    }

    details["Hit Areas"] = hitAreas;

    // Check if model is interactive
    details["Interactive"] = model.interactive ? "Yes" : "No";

    // Check model dimensions
    const bounds = model.getBounds();
    details["Width"] = Math.round(bounds.width);
    details["Height"] = Math.round(bounds.height);

    console.log("Model analysis complete:", details);
  } catch (error) {
    console.error("Error analyzing model:", error);
    details["Analysis Error"] = error.message;
  }

  callback(details);
}

function testModelSwitching() {
  console.log("=== TESTING MODEL SWITCHING ===");

  const models = ["load-shizuku", "load-haru", "load-cyan"];
  let currentModel = 0;

  function switchToNext() {
    if (currentModel >= models.length) {
      console.log("✅ Model switching test completed!");
      return;
    }

    const buttonId = models[currentModel];
    const button = document.getElementById(buttonId);

    if (button) {
      console.log(`Switching to ${buttonId}...`);
      button.click();

      // Wait for model to load, then switch to next
      setTimeout(() => {
        if (window.model) {
          console.log(`✅ ${buttonId} loaded successfully`);
        } else {
          console.error(`❌ ${buttonId} failed to load`);
        }

        currentModel++;
        setTimeout(switchToNext, 3000);
      }, 5000);
    } else {
      console.error(`❌ Button ${buttonId} not found`);
      currentModel++;
      setTimeout(switchToNext, 1000);
    }
  }

  switchToNext();
}

function testModelInteraction() {
  console.log("=== TESTING MODEL INTERACTION ===");

  if (!window.model) {
    console.error("❌ No model loaded. Load a model first.");
    return;
  }

  console.log("Testing model interaction capabilities...");

  // Test hit detection
  const bounds = window.model.getBounds();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  console.log(`Model bounds:`, bounds);
  console.log(`Testing hit at center: (${centerX}, ${centerY})`);

  // Simulate click on model
  const canvas = document.querySelector("canvas");
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    const event = new MouseEvent("click", {
      clientX: rect.left + centerX,
      clientY: rect.top + centerY,
      bubbles: true,
    });

    canvas.dispatchEvent(event);
    console.log("✅ Simulated click on model center");
  }

  // Test model methods
  try {
    if (window.model.focus) {
      window.model.focus(centerX, centerY);
      console.log("✅ Focus method available");
    }

    if (window.model.tap) {
      window.model.tap(centerX, centerY);
      console.log("✅ Tap method available");
    }

    console.log("Interactive features:", {
      interactive: window.model.interactive,
      anchor: window.model.anchor,
      scale: window.model.scale,
      position: window.model.position,
    });
  } catch (error) {
    console.error("Error testing interaction:", error);
  }
}

function debugModelState() {
  console.log("=== MODEL STATE DEBUG ===");

  if (!window.model) {
    console.log("❌ No model loaded");
    return;
  }

  const model = window.model;
  const internalModel = model.internalModel;

  console.log("Model object:", model);
  console.log("Internal model:", internalModel);
  console.log("Model settings:", internalModel.settings);
  console.log("Core model:", internalModel.coreModel);
  console.log("Textures:", internalModel.textures);
  console.log("Expression manager:", internalModel.expressionManager);
  console.log("Motion manager:", internalModel.motionManager);
  console.log("Physics:", internalModel.physics);

  // Display comprehensive model info
  displayModelDebugInfo();
}

function displayModelDebugInfo() {
  if (!window.model) return;

  const info = {
    type: window.model.constructor.name,
    interactive: window.model.interactive,
    anchor: window.model.anchor,
    scale: window.model.scale,
    position: window.model.position,
    bounds: window.model.getBounds(),
    internalModel: {
      width: window.model.internalModel.width,
      height: window.model.internalModel.height,
      layout: window.model.internalModel.layout,
      textures: window.model.internalModel.textures?.length || 0,
    },
  };

  console.table(info);
}

// Performance testing
function testModelPerformance() {
  console.log("=== TESTING MODEL PERFORMANCE ===");

  if (!window.model) {
    console.error("❌ No model loaded");
    return;
  }

  let frameCount = 0;
  let startTime = Date.now();
  const duration = 10000; // 10 seconds

  function countFrames() {
    frameCount++;

    if (Date.now() - startTime < duration) {
      requestAnimationFrame(countFrames);
    } else {
      const fps = frameCount / (duration / 1000);
      console.log(
        `✅ Model performance: ${fps.toFixed(2)} FPS over ${
          duration / 1000
        } seconds`
      );
      console.log(`Total frames: ${frameCount}`);
    }
  }

  console.log("Starting performance test...");
  requestAnimationFrame(countFrames);
}

// Auto-load functions
window.testModelLoading = testModelLoading;
window.testModelSwitching = testModelSwitching;
window.testModelInteraction = testModelInteraction;
window.testModelPerformance = testModelPerformance;
window.debugModelState = debugModelState;
window.analyzeLoadedModel = analyzeLoadedModel;

console.log("Model loading test functions loaded:");
console.log("- testModelLoading() - Test loading all models");
console.log("- testModelSwitching() - Test switching between models");
console.log("- testModelInteraction() - Test model interaction");
console.log("- testModelPerformance() - Test model FPS performance");
console.log("- debugModelState() - Debug current model state");
console.log("Run testModelLoading() to start comprehensive test");
