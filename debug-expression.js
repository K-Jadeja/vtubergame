// Debug script to check expression manager structure
// Run this in browser console after loading a model

function debugExpressionManager() {
  if (!window.model) {
    console.error("No model loaded");
    return;
  }

  console.log("=== EXPRESSION MANAGER DEBUG ===");
  console.log("Model:", window.model);

  const internalModel = window.model.internalModel;
  if (!internalModel) {
    console.error("No internal model found");
    return;
  }

  console.log("Internal model:", internalModel);
  console.log("Expression manager:", internalModel.expressionManager);

  // Check Cubism version
  const settings = internalModel.settings;
  console.log("Model settings:", settings);
  if (settings) {
    console.log("Model type/version:", settings.type || settings.Version);
  }

  // Check expression manager
  if (internalModel.expressionManager) {
    const exprMgr = internalModel.expressionManager;
    console.log("Expression manager definitions:", exprMgr.definitions);
    console.log("Definitions type:", typeof exprMgr.definitions);
    console.log("Is array?", Array.isArray(exprMgr.definitions));

    if (Array.isArray(exprMgr.definitions)) {
      console.log(
        "Definitions is an array with",
        exprMgr.definitions.length,
        "items"
      );
      exprMgr.definitions.forEach((expr, index) => {
        console.log(`Expression ${index}:`, expr);
      });
    } else if (exprMgr.definitions) {
      console.log(
        "Definitions is not an array, keys:",
        Object.keys(exprMgr.definitions)
      );
      Object.entries(exprMgr.definitions).forEach(([key, value]) => {
        console.log(`Expression ${key}:`, value);
      });
    }

    // Check expression manager properties
    console.log("Expression manager keys:", Object.keys(exprMgr));
  } else {
    console.error("No expression manager found");
  }

  // For Cubism 2.1 models - check different structure
  console.log("=== CHECKING CUBISM 2.1 STRUCTURE ===");
  if (settings?.expressions) {
    console.log("Settings.expressions:", settings.expressions);
  }

  // Check model expressions array (possible alternative location)
  if (window.model.expressions) {
    console.log("Model.expressions array:", window.model.expressions);
  }

  console.log("=== END DEBUG ===");
}

// Also create test functions
function testExpressions() {
  if (!window.model) {
    console.error("No model loaded");
    return;
  }

  console.log("=== TESTING EXPRESSIONS ===");

  // Try different ways to get expressions
  const internalModel = window.model.internalModel;
  let expressions = null;

  // Method 1: expressionManager.definitions (Cubism 4)
  if (internalModel.expressionManager?.definitions) {
    expressions = internalModel.expressionManager.definitions;
    console.log(
      "Found expressions via expressionManager.definitions:",
      expressions.length
    );
  }

  // Method 2: settings.expressions (Cubism 2.1)
  else if (internalModel.settings?.expressions) {
    expressions = internalModel.settings.expressions;
    console.log(
      "Found expressions via settings.expressions:",
      expressions.length
    );
  }

  // Method 3: model.expressions
  else if (window.model.expressions) {
    expressions = window.model.expressions;
    console.log("Found expressions via model.expressions:", expressions.length);
  }

  if (expressions && expressions.length > 0) {
    console.log("Testing first expression...");
    try {
      window.model.expression(0);
      console.log("Expression 0 applied successfully!");
      setTimeout(() => {
        window.model.expression(); // Reset
        console.log("Expression reset");
      }, 2000);
    } catch (error) {
      console.error("Failed to apply expression:", error);
    }
  } else {
    console.log("No expressions found to test");
  }
}

// Make functions available globally
window.debugExpressionManager = debugExpressionManager;
window.testExpressions = testExpressions;
console.log(
  "Debug functions loaded. Run debugExpressionManager() or testExpressions() after loading a model."
);
