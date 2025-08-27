# Coding Agent Instructions & Testing

This directory contains essential instructions, tests, and documentation guidelines for AI coding agents working on this VTuber Game project.

## 📋 Before Starting Any Task

**MANDATORY:** All coding agents MUST:

1. **Read the documentation first** - Check `/docs/` folder for relevant information
2. **Run existing tests** - Ensure current functionality works before making changes
3. **Follow the testing protocol** - Use provided test scripts to validate changes
4. **Update documentation** - Document any new features or changes made

## 🗂️ Directory Structure

```
coding-agent/
├── README.md                 # This file
├── instructions/
│   ├── AGENT_WORKFLOW.md     # Step-by-step workflow for agents
│   ├── DOCUMENTATION_RULES.md # How to document changes
│   └── TESTING_PROTOCOL.md   # Testing requirements
└── tests/
    ├── expression-test.js    # Test Live2D expressions
    ├── motion-test.js        # Test Live2D motions
    ├── tts-test.js          # Test TTS functionality
    ├── model-loading-test.js # Test model loading
    └── full-system-test.js   # Complete system test
```

## 🚨 CRITICAL RULES

### Rule 1: Documentation First

- Always check `/docs/` before starting
- Read relevant documentation files
- Understand existing architecture

### Rule 2: Test Before & After

- Run tests BEFORE making changes
- Make your changes
- Run tests AFTER to ensure nothing broke
- Add new tests for new features

### Rule 3: Document Everything

- Update relevant docs in `/docs/`
- Add comments to complex code
- Create examples for new features

## 🔧 Quick Test Commands

**Test all expressions:**

```bash
# Open browser console and run:
# Copy from: coding-agent/tests/expression-test.js
```

**Test all motions:**

```bash
# Open browser console and run:
# Copy from: coding-agent/tests/motion-test.js
```

**Test TTS system:**

```bash
# Open browser console and run:
# Copy from: coding-agent/tests/tts-test.js
```

## 📚 Documentation to Read

Before working on specific features, read these docs:

- **Live2D Models**: `/docs/api.md` - Model loading and control
- **TTS System**: `/docs/api.md` - Kokoro TTS integration
- **Architecture**: `/docs/architecture.md` - Overall system design
- **Troubleshooting**: `/docs/troubleshooting.md` - Common issues and fixes

## 🎯 Common Tasks & Required Reading

| Task               | Required Reading                                       | Tests to Run            |
| ------------------ | ------------------------------------------------------ | ----------------------- |
| Live2D expressions | `/docs/api.md`, `/docs/troubleshooting.md`             | `expression-test.js`    |
| Live2D motions     | `/docs/api.md`, `/docs/examples.md`                    | `motion-test.js`        |
| TTS changes        | `/docs/api.md`, `/docs/architecture.md`                | `tts-test.js`           |
| Model loading      | `/docs/getting-started.md`, `/docs/troubleshooting.md` | `model-loading-test.js` |
| UI changes         | `/docs/examples.md`                                    | `full-system-test.js`   |

## ⚠️ NEVER SKIP

1. **Never skip reading docs** - They contain critical context
2. **Never skip testing** - Broken functionality affects users
3. **Never skip documenting** - Future agents need context
4. **Never assume** - Verify everything works as expected

## 🆘 If Tests Fail

1. Check `/docs/troubleshooting.md` first
2. Review your changes step by step
3. Compare with working examples in `/docs/examples.md`
4. Run individual component tests to isolate issues
5. Document any new issues found in troubleshooting

---

**Remember: Good agents read docs, test thoroughly, and document clearly!**
