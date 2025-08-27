# Testing Protocol for Coding Agents

## 🎯 MANDATORY: Test Everything

All coding agents MUST run tests before and after making changes. No exceptions.

## 🧪 Testing Strategy

### 1. Pre-Change Testing

- Run existing tests to establish baseline
- Document current behavior
- Identify any existing issues

### 2. During Development Testing

- Test after each significant change
- Use browser console for real-time debugging
- Verify functionality incrementally

### 3. Post-Change Testing

- Run all relevant tests
- Test edge cases and error conditions
- Verify no regressions introduced

## 📋 Test Categories

### Core Functionality Tests

- [ ] Model loading (all model types)
- [ ] Motion controls (all motion groups)
- [ ] Expression controls (all expression types)
- [ ] TTS system (generation and playback)
- [ ] UI responsiveness

### Cross-Platform Tests

- [ ] Different Live2D model versions (Cubism 2.1, 4)
- [ ] Different model types (Shizuku, Haru, Cyan)
- [ ] Different browsers (Chrome, Firefox, Safari)
- [ ] Different screen sizes

### Performance Tests

- [ ] Model loading speed
- [ ] TTS generation speed
- [ ] Memory usage
- [ ] Animation smoothness

## 🔧 Test Scripts Usage

All test scripts are in `/coding-agent/tests/`. Copy and paste into browser console.

### Basic Test Sequence:

1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:5174/`
3. Open browser console (F12)
4. Copy and run test scripts

### Test Script Order:

```javascript
// 1. First, test model loading
// Copy from: coding-agent/tests/model-loading-test.js

// 2. Then test expressions
// Copy from: coding-agent/tests/expression-test.js

// 3. Then test motions
// Copy from: coding-agent/tests/motion-test.js

// 4. Then test TTS
// Copy from: coding-agent/tests/tts-test.js

// 5. Finally, run full system test
// Copy from: coding-agent/tests/full-system-test.js
```

## 🎯 Test Requirements by Feature

### Live2D Model Changes:

**Required Tests:**

- [ ] Model loading test (all models)
- [ ] Expression test (all models)
- [ ] Motion test (all models)
- [ ] Full system test

**Success Criteria:**

- All models load without errors
- All expressions work on all models
- All motions work on all models
- No console errors

### TTS System Changes:

**Required Tests:**

- [ ] TTS test (all voices)
- [ ] Audio playback test
- [ ] Lipsync test (with models)
- [ ] Full system test

**Success Criteria:**

- TTS generates audio successfully
- Audio plays without errors
- Lipsync works with Live2D models
- No audio glitches or delays

### UI Changes:

**Required Tests:**

- [ ] Model loading test
- [ ] Full system test
- [ ] Responsiveness test
- [ ] Cross-browser test

**Success Criteria:**

- UI elements respond correctly
- All buttons work as expected
- Layout is correct on different screen sizes
- No visual glitches

## 🚨 Test Failure Protocol

### When Tests Fail:

1. **Don't Ignore Failures**

   - Every test failure must be investigated
   - Document the failure and its cause
   - Fix the issue before proceeding

2. **Isolate the Problem**

   - Run individual tests to narrow down the issue
   - Check browser console for error messages
   - Use debug logging to trace the problem

3. **Check Documentation**

   - Review `/docs/troubleshooting.md` for known issues
   - Check `/docs/api.md` for correct usage
   - Look at `/docs/examples.md` for working patterns

4. **Document New Issues**
   - Add new issues to troubleshooting guide
   - Include step-by-step solutions
   - Add prevention tips

## 📊 Test Results Documentation

### Test Report Template:

```markdown
## Test Results - [Date] - [Feature/Change]

### Environment:

- Browser: Chrome/Firefox/Safari
- Model tested: Shizuku/Haru/Cyan
- Server: http://localhost:5174/

### Tests Run:

- [ ] Model loading: ✅/❌
- [ ] Expressions: ✅/❌
- [ ] Motions: ✅/❌
- [ ] TTS: ✅/❌
- [ ] Full system: ✅/❌

### Issues Found:

1. **Issue**: Description
   - **Impact**: High/Medium/Low
   - **Status**: Fixed/To Fix
   - **Solution**: What was done

### Console Output:
```

[Any relevant console logs or errors]

```

### Conclusion:
All tests passing ✅ / Issues remain ❌
```

## 🔍 Manual Testing Checklist

In addition to automated tests, manually verify:

### Model Loading:

- [ ] Click each model button
- [ ] Model appears correctly positioned
- [ ] Model animates smoothly
- [ ] Info panel updates correctly

### Expressions:

- [ ] Expression buttons appear for each model
- [ ] Clicking buttons changes model expression
- [ ] Reset button works
- [ ] No errors in console

### Motions:

- [ ] Motion buttons appear for each model
- [ ] Clicking buttons triggers motions
- [ ] Random buttons work
- [ ] Motions play smoothly

### TTS:

- [ ] Enter text in TTS field
- [ ] Click Speak button
- [ ] Audio generates and plays
- [ ] Model lips sync with audio
- [ ] Stop button works

## ⚡ Quick Test Commands

### Test All Models:

```javascript
["load-shizuku", "load-haru", "load-cyan"].forEach((buttonId, index) => {
  setTimeout(() => {
    document.getElementById(buttonId).click();
    console.log(`Loaded model: ${buttonId}`);
  }, index * 3000);
});
```

### Test All Expressions:

```javascript
// After loading a model
const expressionBtns = document.querySelectorAll(
  ".expression-btn:not(.reset-btn)"
);
expressionBtns.forEach((btn, index) => {
  setTimeout(() => btn.click(), index * 1000);
});
```

### Test TTS:

```javascript
document.getElementById("tts-text").value = "Testing TTS system";
document.getElementById("speak-btn").click();
```

## ✅ Testing Success Criteria

Tests are successful when:

- [ ] All automated tests pass
- [ ] All manual checks pass
- [ ] No errors in browser console
- [ ] Performance is acceptable
- [ ] All models work correctly
- [ ] All features function as expected

**Remember: Thorough testing prevents bugs from reaching users!**
