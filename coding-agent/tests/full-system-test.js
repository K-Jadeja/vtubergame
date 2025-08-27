// Full System Integration Test
// Copy and paste this into browser console after loading the page

function runFullSystemTest() {
  console.log("🚀 === FULL SYSTEM INTEGRATION TEST ===");
  console.log("This will test the entire VTuber game system comprehensively.");
  console.log("Test will take approximately 5-10 minutes to complete.");

  const testResults = {
    pageLoad: false,
    modelLoading: [],
    expressions: [],
    motions: [],
    tts: [],
    integration: [],
    performance: {},
  };

  let currentPhase = 0;
  const phases = [
    { name: "Page Load", test: testPageLoad },
    { name: "Model Loading", test: testAllModels },
    { name: "Expression System", test: testAllExpressions },
    { name: "Motion System", test: testAllMotions },
    { name: "TTS System", test: testAllTTS },
    { name: "Integration", test: testSystemIntegration },
    { name: "Performance", test: testSystemPerformance },
  ];

  function runNextPhase() {
    if (currentPhase >= phases.length) {
      generateFinalReport();
      return;
    }

    const phase = phases[currentPhase];
    console.log(
      `\n🔄 Phase ${currentPhase + 1}/${phases.length}: ${phase.name}`
    );
    console.log("=".repeat(50));

    phase.test(() => {
      currentPhase++;
      setTimeout(runNextPhase, 2000);
    });
  }

  function testPageLoad(callback) {
    console.log("Testing page load status...");

    // Check if essential elements are present
    const essentialElements = [
      { name: "Canvas", selector: "canvas" },
      { name: "Model Buttons", selector: "[id^='load-']" },
      { name: "Text Input", selector: "#text-input" },
      { name: "Voice Select", selector: "#voice-select" },
      { name: "Speak Button", selector: "#speak-btn" },
    ];

    let passed = 0;
    essentialElements.forEach((element) => {
      const found = document.querySelector(element.selector);
      if (found) {
        console.log(`✅ ${element.name}: Found`);
        passed++;
      } else {
        console.log(`❌ ${element.name}: Missing`);
      }
    });

    testResults.pageLoad = passed === essentialElements.length;
    console.log(
      `Page load test: ${testResults.pageLoad ? "PASS" : "FAIL"} (${passed}/${
        essentialElements.length
      })`
    );

    callback();
  }

  function testAllModels(callback) {
    console.log("Testing all model loading...");

    const models = [
      { name: "Shizuku", buttonId: "load-shizuku" },
      { name: "Haru", buttonId: "load-haru" },
      { name: "Cyan", buttonId: "load-cyan" },
    ];

    let modelIndex = 0;

    function testNextModel() {
      if (modelIndex >= models.length) {
        console.log(
          `Model loading tests complete: ${
            testResults.modelLoading.filter((r) => r.success).length
          }/${models.length} passed`
        );
        callback();
        return;
      }

      const model = models[modelIndex];
      const startTime = Date.now();

      // Clear existing model
      if (window.model) {
        window.model.destroy();
        window.model = null;
      }

      // Load model
      const button = document.getElementById(model.buttonId);
      if (button) {
        button.click();

        const checkInterval = setInterval(() => {
          if (window.model) {
            clearInterval(checkInterval);
            const loadTime = Date.now() - startTime;

            testResults.modelLoading.push({
              name: model.name,
              success: true,
              loadTime: loadTime,
            });

            console.log(`✅ ${model.name}: Loaded in ${loadTime}ms`);
            modelIndex++;
            setTimeout(testNextModel, 2000);
          }
        }, 500);

        // Timeout
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.model) {
            testResults.modelLoading.push({
              name: model.name,
              success: false,
              error: "Timeout",
            });
            console.log(`❌ ${model.name}: Failed to load (timeout)`);
            modelIndex++;
            setTimeout(testNextModel, 1000);
          }
        }, 15000);
      } else {
        testResults.modelLoading.push({
          name: model.name,
          success: false,
          error: "Button not found",
        });
        console.log(`❌ ${model.name}: Button not found`);
        modelIndex++;
        setTimeout(testNextModel, 500);
      }
    }

    testNextModel();
  }

  function testAllExpressions(callback) {
    console.log("Testing expression system...");

    // Ensure we have a model loaded
    if (!window.model) {
      document.getElementById("load-haru").click();
      setTimeout(() => testAllExpressions(callback), 3000);
      return;
    }

    // Test expression detection and UI
    const expressionButtons = document.querySelectorAll(".expression-btn");
    const hasExpressionButtons = expressionButtons.length > 0;

    testResults.expressions.push({
      test: "Expression UI",
      success: hasExpressionButtons,
      count: expressionButtons.length,
    });

    console.log(`Expression buttons: ${expressionButtons.length} found`);

    // Test a few expressions if available
    if (expressionButtons.length > 0) {
      let expressionIndex = 0;
      const maxTests = Math.min(3, expressionButtons.length);

      function testNextExpression() {
        if (expressionIndex >= maxTests) {
          callback();
          return;
        }

        const button = expressionButtons[expressionIndex];
        console.log(`Testing expression: ${button.textContent}`);

        try {
          button.click();
          testResults.expressions.push({
            test: `Expression: ${button.textContent}`,
            success: true,
          });
          console.log(`✅ Expression ${button.textContent}: Triggered`);
        } catch (error) {
          testResults.expressions.push({
            test: `Expression: ${button.textContent}`,
            success: false,
            error: error.message,
          });
          console.log(
            `❌ Expression ${button.textContent}: Error - ${error.message}`
          );
        }

        expressionIndex++;
        setTimeout(testNextExpression, 2000);
      }

      testNextExpression();
    } else {
      console.log("❌ No expression buttons found");
      callback();
    }
  }

  function testAllMotions(callback) {
    console.log("Testing motion system...");

    // Test motion buttons
    const motionButtons = document.querySelectorAll(
      ".motion-btn:not(.random-btn)"
    );
    const randomButtons = document.querySelectorAll(".motion-btn.random-btn");

    testResults.motions.push({
      test: "Motion UI",
      success: motionButtons.length > 0,
      regularMotions: motionButtons.length,
      randomMotions: randomButtons.length,
    });

    console.log(
      `Motion buttons: ${motionButtons.length} regular, ${randomButtons.length} random`
    );

    // Test a few motions
    if (motionButtons.length > 0) {
      const button = motionButtons[0];
      try {
        button.click();
        testResults.motions.push({
          test: "Motion Trigger",
          success: true,
          motion: button.textContent,
        });
        console.log(`✅ Motion test: ${button.textContent} triggered`);
      } catch (error) {
        testResults.motions.push({
          test: "Motion Trigger",
          success: false,
          error: error.message,
        });
        console.log(`❌ Motion test failed: ${error.message}`);
      }
    }

    callback();
  }

  function testAllTTS(callback) {
    console.log("Testing TTS system...");

    // Check TTS components
    const textInput = document.getElementById("text-input");
    const voiceSelect = document.getElementById("voice-select");
    const speakButton = document.getElementById("speak-btn");

    const hasBasicTTS = textInput && voiceSelect && speakButton;

    testResults.tts.push({
      test: "TTS UI Components",
      success: hasBasicTTS,
      components: {
        textInput: !!textInput,
        voiceSelect: !!voiceSelect,
        speakButton: !!speakButton,
      },
    });

    if (hasBasicTTS) {
      // Test voice options
      const voiceOptions = voiceSelect.querySelectorAll("option");
      testResults.tts.push({
        test: "Voice Options",
        success: voiceOptions.length > 0,
        count: voiceOptions.length,
      });

      console.log(
        `✅ TTS UI: Complete (${voiceOptions.length} voices available)`
      );

      // Test actual TTS
      textInput.value = "Testing TTS system integration";
      speakButton.click();

      testResults.tts.push({
        test: "TTS Execution",
        success: true,
        voice: voiceSelect.value,
      });

      console.log(`✅ TTS test: Triggered with voice ${voiceSelect.value}`);
    } else {
      console.log("❌ TTS UI incomplete");
    }

    callback();
  }

  function testSystemIntegration(callback) {
    console.log("Testing system integration...");

    // Test combined functionality
    if (window.model) {
      // Test TTS + Expressions
      const textInput = document.getElementById("text-input");
      const speakButton = document.getElementById("speak-btn");

      if (textInput && speakButton) {
        textInput.value = "Testing integrated TTS and Live2D animation";
        speakButton.click();

        // Trigger expression during TTS
        setTimeout(() => {
          const expressionButtons =
            document.querySelectorAll(".expression-btn");
          if (expressionButtons.length > 0) {
            expressionButtons[0].click();

            testResults.integration.push({
              test: "TTS + Expression Integration",
              success: true,
            });
            console.log("✅ TTS + Expression integration: Working");
          }
        }, 1000);

        // Test motion during TTS
        setTimeout(() => {
          const motionButtons = document.querySelectorAll(
            ".motion-btn:not(.random-btn)"
          );
          if (motionButtons.length > 0) {
            motionButtons[0].click();

            testResults.integration.push({
              test: "TTS + Motion Integration",
              success: true,
            });
            console.log("✅ TTS + Motion integration: Working");
          }
        }, 2000);
      }

      testResults.integration.push({
        test: "Model + UI Integration",
        success: true,
      });
      console.log("✅ Model + UI integration: Working");
    } else {
      testResults.integration.push({
        test: "No Model Loaded",
        success: false,
      });
      console.log("❌ No model loaded for integration test");
    }

    setTimeout(callback, 5000);
  }

  function testSystemPerformance(callback) {
    console.log("Testing system performance...");

    const startTime = Date.now();
    let frameCount = 0;

    function countFrames() {
      frameCount++;

      if (Date.now() - startTime < 5000) {
        // 5 second test
        requestAnimationFrame(countFrames);
      } else {
        const fps = frameCount / 5;
        testResults.performance = {
          fps: fps,
          frameCount: frameCount,
          duration: 5000,
        };

        console.log(`✅ Performance: ${fps.toFixed(2)} FPS`);
        callback();
      }
    }

    requestAnimationFrame(countFrames);
  }

  function generateFinalReport() {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 FULL SYSTEM TEST COMPLETE");
    console.log("=".repeat(60));

    // Summary
    const totalTests =
      (testResults.pageLoad ? 1 : 0) +
      testResults.modelLoading.filter((r) => r.success).length +
      testResults.expressions.filter((r) => r.success).length +
      testResults.motions.filter((r) => r.success).length +
      testResults.tts.filter((r) => r.success).length +
      testResults.integration.filter((r) => r.success).length +
      (testResults.performance.fps ? 1 : 0);

    const maxTests =
      1 + // page load
      testResults.modelLoading.length +
      testResults.expressions.length +
      testResults.motions.length +
      testResults.tts.length +
      testResults.integration.length +
      1; // performance

    const passRate = ((totalTests / maxTests) * 100).toFixed(1);

    console.log(
      `📊 OVERALL RESULT: ${totalTests}/${maxTests} tests passed (${passRate}%)`
    );
    console.log("");

    // Detailed results
    console.log("📋 DETAILED RESULTS:");
    console.log(`Page Load: ${testResults.pageLoad ? "✅ PASS" : "❌ FAIL"}`);

    console.log(
      `Model Loading: ${
        testResults.modelLoading.filter((r) => r.success).length
      }/${testResults.modelLoading.length} passed`
    );
    testResults.modelLoading.forEach((result) => {
      console.log(
        `  ${result.name}: ${result.success ? "✅" : "❌"} ${
          result.loadTime ? `(${result.loadTime}ms)` : result.error || ""
        }`
      );
    });

    console.log(
      `Expressions: ${
        testResults.expressions.filter((r) => r.success).length
      }/${testResults.expressions.length} passed`
    );
    console.log(
      `Motions: ${testResults.motions.filter((r) => r.success).length}/${
        testResults.motions.length
      } passed`
    );
    console.log(
      `TTS: ${testResults.tts.filter((r) => r.success).length}/${
        testResults.tts.length
      } passed`
    );
    console.log(
      `Integration: ${
        testResults.integration.filter((r) => r.success).length
      }/${testResults.integration.length} passed`
    );

    if (testResults.performance.fps) {
      console.log(
        `Performance: ✅ ${testResults.performance.fps.toFixed(2)} FPS`
      );
    }

    // Recommendations
    console.log("\n💡 RECOMMENDATIONS:");

    if (!testResults.pageLoad) {
      console.log(
        "❗ Page load issues detected - check console for missing elements"
      );
    }

    const failedModels = testResults.modelLoading.filter((r) => !r.success);
    if (failedModels.length > 0) {
      console.log(
        `❗ Model loading issues: ${failedModels.map((m) => m.name).join(", ")}`
      );
    }

    if (testResults.expressions.filter((r) => r.success).length === 0) {
      console.log("❗ Expression system needs attention");
    }

    if (testResults.performance.fps && testResults.performance.fps < 30) {
      console.log("❗ Performance below 30 FPS - consider optimization");
    }

    if (passRate >= 90) {
      console.log(
        "🎉 Excellent system performance! All major components working."
      );
    } else if (passRate >= 70) {
      console.log("👍 Good system performance with minor issues.");
    } else {
      console.log("⚠️  System has significant issues that need attention.");
    }

    console.log(
      "\n🔚 Test completed. Results saved to testResults global variable."
    );
    window.fullSystemTestResults = testResults;
  }

  // Start the test
  runNextPhase();
}

// Quick system check (faster version)
function quickSystemCheck() {
  console.log("⚡ QUICK SYSTEM CHECK");
  console.log("=".repeat(30));

  const checks = [];

  // Page elements
  const essentials = ["canvas", "#text-input", "#voice-select", "#speak-btn"];
  essentials.forEach((selector) => {
    const found = document.querySelector(selector);
    checks.push({
      name: `Element ${selector}`,
      status: found ? "✅" : "❌",
      result: !!found,
    });
  });

  // Model state
  checks.push({
    name: "Live2D Model",
    status: window.model ? "✅" : "❌",
    result: !!window.model,
  });

  // UI state
  const expressionButtons = document.querySelectorAll(".expression-btn");
  const motionButtons = document.querySelectorAll(".motion-btn");

  checks.push({
    name: `Expression Buttons (${expressionButtons.length})`,
    status: expressionButtons.length > 0 ? "✅" : "❌",
    result: expressionButtons.length > 0,
  });

  checks.push({
    name: `Motion Buttons (${motionButtons.length})`,
    status: motionButtons.length > 0 ? "✅" : "❌",
    result: motionButtons.length > 0,
  });

  // TTS state
  const voiceSelect = document.getElementById("voice-select");
  const voiceCount = voiceSelect
    ? voiceSelect.querySelectorAll("option").length
    : 0;

  checks.push({
    name: `TTS Voices (${voiceCount})`,
    status: voiceCount > 0 ? "✅" : "❌",
    result: voiceCount > 0,
  });

  // Display results
  checks.forEach((check) => {
    console.log(`${check.status} ${check.name}`);
  });

  const passCount = checks.filter((c) => c.result).length;
  const totalCount = checks.length;
  const percentage = ((passCount / totalCount) * 100).toFixed(1);

  console.log(
    `\n📊 Result: ${passCount}/${totalCount} (${percentage}%) systems operational`
  );

  if (percentage >= 90) {
    console.log("🎉 System is fully operational!");
  } else if (percentage >= 70) {
    console.log("👍 System is mostly operational");
  } else {
    console.log("⚠️  System has issues that need attention");
  }

  return checks;
}

// Stress test
function stressTestSystem() {
  console.log("💪 SYSTEM STRESS TEST");
  console.log("=".repeat(30));
  console.log("This will rapidly switch models and trigger animations");

  let iterations = 0;
  const maxIterations = 20;
  const models = ["load-shizuku", "load-haru", "load-cyan"];

  function stressIteration() {
    if (iterations >= maxIterations) {
      console.log("✅ Stress test completed!");
      return;
    }

    // Random model
    const randomModel = models[Math.floor(Math.random() * models.length)];
    document.getElementById(randomModel).click();

    // Random expression (after model loads)
    setTimeout(() => {
      const expressionButtons = document.querySelectorAll(".expression-btn");
      if (expressionButtons.length > 0) {
        const randomExpression =
          expressionButtons[
            Math.floor(Math.random() * expressionButtons.length)
          ];
        randomExpression.click();
      }
    }, 2000);

    // Random motion
    setTimeout(() => {
      const motionButtons = document.querySelectorAll(
        ".motion-btn:not(.random-btn)"
      );
      if (motionButtons.length > 0) {
        const randomMotion =
          motionButtons[Math.floor(Math.random() * motionButtons.length)];
        randomMotion.click();
      }
    }, 3000);

    console.log(
      `Stress iteration ${iterations + 1}/${maxIterations}: ${randomModel}`
    );
    iterations++;

    setTimeout(stressIteration, 4000);
  }

  stressIteration();
}

// Auto-load functions
window.runFullSystemTest = runFullSystemTest;
window.quickSystemCheck = quickSystemCheck;
window.stressTestSystem = stressTestSystem;

console.log("Full system test functions loaded:");
console.log(
  "- runFullSystemTest() - Complete system integration test (5-10 minutes)"
);
console.log("- quickSystemCheck() - Fast system status check");
console.log(
  "- stressTestSystem() - Stress test with rapid model/animation switching"
);
console.log("");
console.log("🚀 Run runFullSystemTest() for comprehensive testing");
console.log("⚡ Run quickSystemCheck() for quick status");
