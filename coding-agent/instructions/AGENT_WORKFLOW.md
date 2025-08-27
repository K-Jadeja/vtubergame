# Agent Workflow - Step-by-Step Process

## 🎯 MANDATORY WORKFLOW

Every coding agent MUST follow this exact workflow for any task:

## Phase 1: Research & Understanding (REQUIRED)

### Step 1: Read Documentation First

- [ ] Check `/docs/` for relevant files
- [ ] Read architecture overview in `/docs/architecture.md`
- [ ] Review API documentation in `/docs/api.md`
- [ ] Check troubleshooting guide `/docs/troubleshooting.md`
- [ ] Look for examples in `/docs/examples.md`

### Step 2: Understand Current State

- [ ] Run `npm run dev` to start development server
- [ ] Open browser and manually test current functionality
- [ ] Run existing tests from `/coding-agent/tests/`
- [ ] Document current behavior before making changes

## Phase 2: Planning (REQUIRED)

### Step 3: Plan Your Changes

- [ ] Identify which files need modification
- [ ] Understand dependencies between components
- [ ] Plan testing strategy for your changes
- [ ] Consider impact on existing functionality

## Phase 3: Implementation

### Step 4: Make Changes Incrementally

- [ ] Make small, focused changes
- [ ] Test after each significant change
- [ ] Use console.log for debugging during development
- [ ] Follow existing code patterns and conventions

### Step 5: Test Continuously

- [ ] Run relevant tests after each change
- [ ] Test in browser manually
- [ ] Check console for errors
- [ ] Verify all existing functionality still works

## Phase 4: Validation (REQUIRED)

### Step 6: Comprehensive Testing

- [ ] Run ALL relevant tests from `/coding-agent/tests/`
- [ ] Test edge cases and error conditions
- [ ] Verify performance hasn't degraded
- [ ] Test on different models (Shizuku, Haru, Cyan)

### Step 7: Documentation Update

- [ ] Update relevant files in `/docs/`
- [ ] Add code comments for complex logic
- [ ] Create examples if adding new features
- [ ] Update troubleshooting guide if needed

## Phase 5: Final Validation (REQUIRED)

### Step 8: Full System Test

- [ ] Run complete system test
- [ ] Verify all models load correctly
- [ ] Test all major features (motions, expressions, TTS)
- [ ] Check browser console for any errors
- [ ] Ensure no regressions introduced

## 🚨 FAILURE POINTS - DO NOT SKIP

### If You Skip Documentation Reading:

- You may duplicate existing solutions
- You may break existing patterns
- You may miss critical context
- Your solution may not integrate properly

### If You Skip Testing:

- You may break existing functionality
- Users will experience bugs
- Other agents will waste time fixing your bugs
- The system becomes unreliable

### If You Skip Documentation Updates:

- Future agents will lack context
- Knowledge will be lost
- Maintenance becomes difficult
- Integration becomes harder

## 📝 Workflow Checklist Template

Copy this checklist for every task:

```
## Task: [Your task description]

### Phase 1: Research ✅
- [ ] Read relevant docs in /docs/
- [ ] Understand current system state
- [ ] Run existing tests
- [ ] Document current behavior

### Phase 2: Planning ✅
- [ ] Identified files to change
- [ ] Understood dependencies
- [ ] Planned testing approach
- [ ] Considered impact analysis

### Phase 3: Implementation ✅
- [ ] Made incremental changes
- [ ] Tested after each change
- [ ] Followed code patterns
- [ ] Added debug logging

### Phase 4: Validation ✅
- [ ] Ran all relevant tests
- [ ] Tested edge cases
- [ ] Verified performance
- [ ] Tested all models

### Phase 5: Documentation ✅
- [ ] Updated docs in /docs/
- [ ] Added code comments
- [ ] Created examples
- [ ] Updated troubleshooting

### Phase 6: Final Check ✅
- [ ] Full system test passed
- [ ] All models working
- [ ] All features functional
- [ ] No console errors
- [ ] No regressions
```

## 🎯 Success Criteria

A task is complete ONLY when:

1. ✅ All existing functionality works
2. ✅ New functionality works as specified
3. ✅ All tests pass
4. ✅ Documentation is updated
5. ✅ No console errors exist
6. ✅ Performance is maintained

**Remember: Taking shortcuts leads to technical debt and broken systems!**
