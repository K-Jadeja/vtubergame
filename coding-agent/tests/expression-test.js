// Live2D Expression Test Script
// Copy and paste this into browser console after loading the page

function testExpressions() {
  console.log("=== TESTING LIVE2D EXPRESSIONS ===");

  // Test all model types
  const tests = [
    { name: "Shizuku (Cubism 2.1)", buttonId: "load-shizuku" },
    { name: "Haru (Cubism 4)", buttonId: "load-haru" },
    { name: "Cyan (Cubism 4)", buttonId: "load-cyan" },
  ];

  let currentTest = 0;
  let results = [];

  function runNextTest() {
    if (currentTest >= tests.length) {
      console.log("=== EXPRESSION TEST RESULTS ===");
      results.forEach((result) => {
        console.log(
          `${result.model}: ${result.status} (${result.count} expressions)`
        );
      });
      console.log("=== ALL EXPRESSION TESTS COMPLETED ===");
      return;
    }

    const test = tests[currentTest];
    console.log(`\n--- Testing ${test.name} ---`);

    // Load the model
    document.getElementById(test.buttonId).click();

    // Wait for model to load, then test expressions
    setTimeout(() => {
      if (window.model) {
        console.log(`${test.name} loaded successfully`);

        // Check if expression buttons were created
        const expressionButtons = document.querySelectorAll(
          ".expression-btn:not(.reset-btn)"
        );
        console.log(`Found ${expressionButtons.length} expression buttons`);

        if (expressionButtons.length > 0) {
          console.log(
            `✅ ${test.name}: Expressions detected and buttons created!`
          );

          // Test first expression
          console.log("Testing first expression...");
          try {
            expressionButtons[0].click();
            console.log("✅ Expression applied successfully");

            // Test reset
            setTimeout(() => {
              const resetBtn = document.querySelector(
                ".expression-btn.reset-btn"
              );
              if (resetBtn) {
                resetBtn.click();
                console.log("✅ Expression reset successfully");
              }

              results.push({
                model: test.name,
                status: "✅ PASS",
                count: expressionButtons.length,
              });

              // Move to next test
              currentTest++;
              setTimeout(runNextTest, 1000);
            }, 2000);
          } catch (error) {
            console.error("❌ Error testing expression:", error);
            results.push({
              model: test.name,
              status: "❌ FAIL - Expression error",
              count: expressionButtons.length,
            });
            currentTest++;
            setTimeout(runNextTest, 1000);
          }
        } else {
          console.log(`❌ ${test.name}: No expression buttons found`);
          results.push({
            model: test.name,
            status: "❌ FAIL - No expressions",
            count: 0,
          });
          currentTest++;
          setTimeout(runNextTest, 1000);
        }
      } else {
        console.log(`❌ ${test.name}: Model failed to load`);
        results.push({
          model: test.name,
          status: "❌ FAIL - Model loading",
          count: 0,
        });
        currentTest++;
        setTimeout(runNextTest, 1000);
      }
    }, 3000);
  }

  runNextTest();
}

// Also provide manual test function
function testCurrentModelExpressions() {
  console.log("=== TESTING CURRENT MODEL EXPRESSIONS ===");

  if (!window.model) {
    console.error("❌ No model loaded. Load a model first.");
    return;
  }

  const expressionButtons = document.querySelectorAll(
    ".expression-btn:not(.reset-btn)"
  );
  console.log(`Found ${expressionButtons.length} expression buttons`);

  if (expressionButtons.length === 0) {
    console.error("❌ No expression buttons found");
    return;
  }

  // Test each expression with 1 second delay
  expressionButtons.forEach((button, index) => {
    setTimeout(() => {
      console.log(`Testing expression: ${button.textContent}`);
      button.click();
    }, index * 1500);
  });

  // Reset after all tests
  setTimeout(() => {
    const resetBtn = document.querySelector(".expression-btn.reset-btn");
    if (resetBtn) {
      resetBtn.click();
      console.log("✅ All expressions tested, reset to default");
    }
  }, expressionButtons.length * 1500 + 1000);
}

// Debug function to check expression data
function debugExpressions() {
  console.log("=== EXPRESSION DEBUG INFO ===");

  if (!window.model) {
    console.error("❌ No model loaded");
    return;
  }

  const internalModel = window.model.internalModel;
  console.log("Internal model:", internalModel);
  console.log("Expression manager:", internalModel.expressionManager);
  console.log("Model settings:", internalModel.settings);

  // Check different sources of expressions
  if (internalModel.expressionManager?.definitions) {
    console.log(
      "Expressions via expressionManager.definitions:",
      internalModel.expressionManager.definitions
    );
  }

  if (internalModel.settings?.expressions) {
    console.log(
      "Expressions via settings.expressions:",
      internalModel.settings.expressions
    );
  }

  console.log("=== END DEBUG ===");
}

// Auto-run functions
window.testExpressions = testExpressions;
window.testCurrentModelExpressions = testCurrentModelExpressions;
window.debugExpressions = debugExpressions;

console.log("Expression test functions loaded:");
console.log("- testExpressions() - Test all models");
console.log("- testCurrentModelExpressions() - Test current model only");
console.log("- debugExpressions() - Debug expression data");
console.log("Run testExpressions() to start comprehensive test");
