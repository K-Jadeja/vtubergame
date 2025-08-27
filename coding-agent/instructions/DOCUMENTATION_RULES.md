# Documentation Rules for Coding Agents

## 🎯 MANDATORY: Always Update Documentation

Every code change REQUIRES documentation updates. No exceptions.

## 📚 Documentation Structure

```
docs/
├── index.md              # Main overview
├── getting-started.md    # Setup and basic usage
├── architecture.md       # System design and structure
├── api.md               # API reference and usage
├── examples.md          # Code examples and patterns
├── troubleshooting.md   # Common issues and solutions
└── development.md       # Development guidelines
```

## 📝 What to Document

### When Adding New Features:

- [ ] **API Reference** (`api.md`) - Add new API methods
- [ ] **Examples** (`examples.md`) - Show how to use the feature
- [ ] **Architecture** (`architecture.md`) - Explain how it fits in the system
- [ ] **Getting Started** (`getting-started.md`) - Update if it affects setup

### When Fixing Bugs:

- [ ] **Troubleshooting** (`troubleshooting.md`) - Add the issue and solution
- [ ] **API Reference** (`api.md`) - Update if API behavior changed
- [ ] **Examples** (`examples.md`) - Update if examples were affected

### When Modifying Existing Features:

- [ ] **API Reference** (`api.md`) - Update changed methods
- [ ] **Examples** (`examples.md`) - Update affected examples
- [ ] **Troubleshooting** (`troubleshooting.md`) - Update known issues

## ✍️ Documentation Writing Guidelines

### 1. Use Clear Structure

````markdown
# Main Heading

Brief description of what this section covers.

## Subsection

More specific information.

### Code Examples

```javascript
// Always include working code examples
const example = "like this";
```
````

### 2. Include Working Examples

- All code examples MUST work when copied
- Test examples before documenting
- Show both success and error cases

### 3. Explain the "Why"

- Don't just show how, explain why
- Include context about when to use features
- Mention limitations and gotchas

### 4. Keep It Current

- Update examples when code changes
- Remove outdated information
- Verify links and references work

## 📋 Documentation Checklist

For every code change, ask:

### API Documentation (`api.md`)

- [ ] Are new methods/functions documented?
- [ ] Are parameter types and descriptions accurate?
- [ ] Are return values documented?
- [ ] Are error conditions explained?
- [ ] Are examples provided?

### Examples (`examples.md`)

- [ ] Do existing examples still work?
- [ ] Are new examples needed?
- [ ] Do examples show real-world usage?
- [ ] Are edge cases covered?

### Troubleshooting (`troubleshooting.md`)

- [ ] Is the issue documented if it was hard to solve?
- [ ] Is the solution step-by-step?
- [ ] Are common variations of the problem covered?
- [ ] Are prevention tips included?

### Architecture (`architecture.md`)

- [ ] Does the system diagram need updating?
- [ ] Are new components explained?
- [ ] Are data flows documented?
- [ ] Are integration points clear?

## 🎯 Specific Documentation Requirements

### For Live2D Features:

- Document which Cubism versions are supported
- Explain differences between model types
- Provide examples for each model type
- Include troubleshooting for common model issues

### For TTS Features:

- Document voice options available
- Explain configuration options
- Provide examples of usage
- Include troubleshooting for audio issues

### For UI Features:

- Document user interactions
- Explain state management
- Provide styling examples
- Include accessibility considerations

## 🚨 Documentation Anti-Patterns (AVOID)

### ❌ Don't Do This:

```markdown
## Function X

This function does stuff.
```

### ✅ Do This Instead:

````markdown
## setupExpressionControls()

Sets up UI controls for Live2D model expressions, handling different Cubism versions.

**Parameters:**

- `expressionManager` (Object) - The model's expression manager

**Behavior:**

- For Cubism 4 models: Uses `expressionManager.definitions`
- For Cubism 2.1 models: Falls back to `internalModel.settings.expressions`
- Creates clickable buttons for each expression
- Includes error handling and logging

**Example:**

```javascript
// Called automatically when model loads
setupExpressionControls(model.internalModel.expressionManager);
```
````

**Troubleshooting:**

- If no buttons appear, check console for "Found X expressions via..." message
- Verify model has expressions defined in model.json file

````

## 📄 Documentation Templates

### New Feature Template:
```markdown
## [Feature Name]

### Overview
Brief description of what this feature does and why it's useful.

### Usage
```javascript
// Basic usage example
````

### Configuration

| Option  | Type   | Default   | Description           |
| ------- | ------ | --------- | --------------------- |
| option1 | string | "default" | What this option does |

### Examples

```javascript
// Common use case
// Edge case
// Error handling
```

### Troubleshooting

- **Issue**: Common problem description
  - **Solution**: Step-by-step fix
  - **Prevention**: How to avoid this issue

````

### Bug Fix Template:
```markdown
#### ❌ [Issue Description]

**Symptoms:**
- What users see
- Error messages
- Unexpected behavior

**Diagnosis:**
```javascript
// How to identify this issue
console.log("Debug commands to run");
````

**Solution:**

1. Step-by-step fix
2. Code changes made
3. Verification steps

**Prevention:**

- How to avoid this issue in the future

```

## ✅ Documentation Success Criteria

Documentation is complete when:
- [ ] A new developer can understand the feature from docs alone
- [ ] All code examples work when copied
- [ ] Common issues are covered in troubleshooting
- [ ] The feature's place in the overall architecture is clear
- [ ] Future modifications are guided by the documentation

**Remember: Good documentation saves hours of debugging for future developers!**
```
