// Live2D Motion Test Script
// Copy and paste this into browser console after loading the page

function testMotions() {
  console.log("=== TESTING LIVE2D MOTIONS ===");

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
      console.log("=== MOTION TEST RESULTS ===");
      results.forEach((result) => {
        console.log(`${result.model}: ${result.status}`);
        if (result.groups) {
          result.groups.forEach((group) => {
            console.log(`  ${group.name}: ${group.count} motions`);
          });
        }
      });
      console.log("=== ALL MOTION TESTS COMPLETED ===");
      return;
    }

    const test = tests[currentTest];
    console.log(`\n--- Testing ${test.name} ---`);

    // Load the model
    document.getElementById(test.buttonId).click();

    // Wait for model to load, then test motions
    setTimeout(() => {
      if (window.model) {
        console.log(`${test.name} loaded successfully`);

        // Check motion groups
        const motionManager = window.model.internalModel.motionManager;
        const motionGroups = motionManager?.definitions || {};
        const groupNames = Object.keys(motionGroups);

        console.log(`Found ${groupNames.length} motion groups:`, groupNames);

        if (groupNames.length > 0) {
          const groupDetails = groupNames.map((name) => ({
            name,
            count: Array.isArray(motionGroups[name])
              ? motionGroups[name].length
              : 0,
          }));

          console.log(`✅ ${test.name}: Motions detected!`);

          // Test first motion from first group
          const firstGroup = groupNames[0];
          const firstGroupMotions = motionGroups[firstGroup];
          if (
            Array.isArray(firstGroupMotions) &&
            firstGroupMotions.length > 0
          ) {
            console.log(`Testing motion: ${firstGroup}[0]`);
            try {
              window.model.motion(firstGroup, 0, 2);
              console.log("✅ Motion played successfully");
            } catch (error) {
              console.error("❌ Error playing motion:", error);
            }
          }

          results.push({
            model: test.name,
            status: "✅ PASS",
            groups: groupDetails,
          });
        } else {
          console.log(`❌ ${test.name}: No motion groups found`);
          results.push({
            model: test.name,
            status: "❌ FAIL - No motions",
            groups: [],
          });
        }
      } else {
        console.log(`❌ ${test.name}: Model failed to load`);
        results.push({
          model: test.name,
          status: "❌ FAIL - Model loading",
          groups: [],
        });
      }

      // Move to next test
      currentTest++;
      setTimeout(runNextTest, 3000);
    }, 3000);
  }

  runNextTest();
}

// Test all motions in current model
function testAllMotionsInCurrentModel() {
  console.log("=== TESTING ALL MOTIONS IN CURRENT MODEL ===");

  if (!window.model) {
    console.error("❌ No model loaded. Load a model first.");
    return;
  }

  const motionManager = window.model.internalModel.motionManager;
  const motionGroups = motionManager?.definitions || {};
  const groupNames = Object.keys(motionGroups);

  if (groupNames.length === 0) {
    console.error("❌ No motion groups found");
    return;
  }

  console.log(`Testing ${groupNames.length} motion groups...`);

  let groupIndex = 0;
  let motionIndex = 0;

  function testNextMotion() {
    if (groupIndex >= groupNames.length) {
      console.log("✅ All motions tested!");
      return;
    }

    const groupName = groupNames[groupIndex];
    const motions = motionGroups[groupName];

    if (!Array.isArray(motions) || motions.length === 0) {
      groupIndex++;
      motionIndex = 0;
      setTimeout(testNextMotion, 500);
      return;
    }

    if (motionIndex >= motions.length) {
      groupIndex++;
      motionIndex = 0;
      setTimeout(testNextMotion, 500);
      return;
    }

    console.log(`Testing: ${groupName}[${motionIndex}]`);
    try {
      window.model.motion(groupName, motionIndex, 2);
      console.log(`✅ ${groupName}[${motionIndex}] played successfully`);
    } catch (error) {
      console.error(`❌ ${groupName}[${motionIndex}] failed:`, error);
    }

    motionIndex++;
    setTimeout(testNextMotion, 2000); // Wait 2 seconds between motions
  }

  testNextMotion();
}

// Test motion buttons in UI
function testMotionButtons() {
  console.log("=== TESTING MOTION BUTTONS ===");

  const motionButtons = document.querySelectorAll(
    ".motion-btn:not(.random-btn)"
  );
  const randomButtons = document.querySelectorAll(".motion-btn.random-btn");

  console.log(`Found ${motionButtons.length} motion buttons`);
  console.log(`Found ${randomButtons.length} random motion buttons`);

  if (motionButtons.length === 0) {
    console.error("❌ No motion buttons found");
    return;
  }

  // Test individual motion buttons
  motionButtons.forEach((button, index) => {
    setTimeout(() => {
      console.log(`Testing button: ${button.textContent}`);
      button.click();
    }, index * 2000);
  });

  // Test random buttons after individual buttons
  setTimeout(() => {
    randomButtons.forEach((button, index) => {
      setTimeout(() => {
        console.log(`Testing random button: ${button.textContent}`);
        button.click();
      }, index * 2000);
    });
  }, motionButtons.length * 2000 + 1000);

  console.log("Motion button testing started...");
}

// Debug function for motion data
function debugMotions() {
  console.log("=== MOTION DEBUG INFO ===");

  if (!window.model) {
    console.error("❌ No model loaded");
    return;
  }

  const motionManager = window.model.internalModel.motionManager;
  console.log("Motion manager:", motionManager);
  console.log("Motion definitions:", motionManager?.definitions);

  const motionGroups = motionManager?.definitions || {};
  Object.entries(motionGroups).forEach(([groupName, motions]) => {
    console.log(`Group "${groupName}":`, motions);
    if (Array.isArray(motions)) {
      console.log(`  ${motions.length} motions available`);
    }
  });

  console.log("=== END DEBUG ===");
}

// Auto-run functions
window.testMotions = testMotions;
window.testAllMotionsInCurrentModel = testAllMotionsInCurrentModel;
window.testMotionButtons = testMotionButtons;
window.debugMotions = debugMotions;

console.log("Motion test functions loaded:");
console.log("- testMotions() - Test all models");
console.log(
  "- testAllMotionsInCurrentModel() - Test all motions in current model"
);
console.log("- testMotionButtons() - Test UI motion buttons");
console.log("- debugMotions() - Debug motion data");
console.log("Run testMotions() to start comprehensive test");
