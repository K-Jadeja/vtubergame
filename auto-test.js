// Auto-test script to be run in browser console
// This will automatically test both models after page load

function autoTestModels() {
  console.log("=== AUTO TESTING MODELS ===");

  // Test Shizuku (Cubism 2.1) first
  console.log("Loading Shizuku model...");
  setTimeout(() => {
    document.getElementById("load-shizuku").click();

    // After model loads, test expressions
    setTimeout(() => {
      console.log("=== SHIZUKU EXPRESSION TEST ===");
      if (window.model) {
        debugExpressionManager();
        testExpressions();
      }
    }, 3000);

    // Then test Haru (Cubism 4)
    setTimeout(() => {
      console.log("Loading Haru model...");
      document.getElementById("load-haru").click();

      // After model loads, test expressions
      setTimeout(() => {
        console.log("=== HARU EXPRESSION TEST ===");
        if (window.model) {
          debugExpressionManager();
          testExpressions();
        }
      }, 3000);
    }, 8000);
  }, 1000);
}

// Run after page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoTestModels);
} else {
  autoTestModels();
}

console.log("Auto-test script loaded. Tests will run automatically.");
