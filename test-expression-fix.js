// Test script to validate the expression fix
// Paste this into browser console after loading the page

function testExpressionFix() {
  console.log("=== TESTING EXPRESSION FIX ===");

  // Test both models
  const tests = [
    { name: "Shizuku (Cubism 2.1)", buttonId: "load-shizuku" },
    { name: "Haru (Cubism 4)", buttonId: "load-haru" },
    { name: "Cyan (Cubism 4)", buttonId: "load-cyan" },
  ];

  let currentTest = 0;

  function runNextTest() {
    if (currentTest >= tests.length) {
      console.log("=== ALL TESTS COMPLETED ===");
      return;
    }

    const test = tests[currentTest];
    console.log(`\n--- Testing ${test.name} ---`);

    // Load the model
    document.getElementById(test.buttonId).click();

    // Wait for model to load, then check expressions
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
          expressionButtons[0].click();

          setTimeout(() => {
            // Reset expression
            const resetBtn = document.querySelector(
              ".expression-btn.reset-btn"
            );
            if (resetBtn) resetBtn.click();

            // Move to next test
            currentTest++;
            setTimeout(runNextTest, 1000);
          }, 2000);
        } else {
          console.log(`❌ ${test.name}: No expression buttons found`);
          currentTest++;
          setTimeout(runNextTest, 1000);
        }
      } else {
        console.log(`❌ ${test.name}: Model failed to load`);
        currentTest++;
        setTimeout(runNextTest, 1000);
      }
    }, 3000);
  }

  runNextTest();
}

// Run the test
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(testExpressionFix, 2000);
  });
} else {
  setTimeout(testExpressionFix, 2000);
}

console.log("Expression fix test will run in 2 seconds...");
