# VTuber Game Documentation

This directory contains the comprehensive documentation for the VTuber Game Live2D framework. The documentation is built using GitHub Pages with Jekyll.

## 📚 Documentation Structure

- **[index.md](index.md)** - Main documentation homepage
- **[getting-started.md](getting-started.md)** - Setup and quick start guide
- **[architecture.md](architecture.md)** - System architecture and design
- **[api.md](api.md)** - Complete API reference
- **[development.md](development.md)** - Developer guide and contribution instructions
- **[examples.md](examples.md)** - Practical examples and tutorials
- **[troubleshooting.md](troubleshooting.md)** - Common issues and solutions

## 🌐 Viewing the Documentation

### Online (GitHub Pages)
The documentation is automatically published to GitHub Pages:
- **URL**: `https://k-jadeja.github.io/vtubergame/`
- **Auto-deployment**: Commits to main branch trigger automatic updates

### Local Development

To run the documentation locally with Jekyll:

```bash
# Install Jekyll (requires Ruby)
gem install bundler jekyll

# Navigate to docs directory
cd docs

# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve

# View at http://localhost:4000
```

## 📝 Documentation Features

### GitHub Pages Configuration
- **Jekyll Theme**: Custom layout with navigation
- **SEO Optimization**: Meta tags and structured data
- **Responsive Design**: Mobile-friendly navigation
- **Syntax Highlighting**: Code blocks with proper highlighting
- **Navigation**: Breadcrumbs and site-wide navigation

### Content Features
- **Comprehensive API Reference**: All methods with examples
- **Architecture Documentation**: Detailed system design
- **Practical Examples**: Real-world implementation patterns
- **Troubleshooting Guide**: Common issues and debug tools
- **Developer Guide**: Contributing and extending the framework

### Interactive Elements
- **Code Examples**: Copy-pasteable code snippets
- **Debug Tools**: Browser console utilities
- **Performance Monitors**: Built-in profiling tools
- **Error Diagnostics**: Step-by-step troubleshooting

## 🔧 Configuration Files

- **[_config.yml](_config.yml)** - Jekyll site configuration
- **[_layouts/default.html](_layouts/default.html)** - Custom page layout
- **[pixi-2d-display-docs.md](pixi-2d-display-docs.md)** - Original library documentation

## 📖 Contributing to Documentation

### Adding New Pages

1. Create a new `.md` file in the docs directory
2. Add front matter with layout and title:
```yaml
---
layout: default
title: Your Page Title
permalink: /your-page/
---
```
3. Add the page to navigation in `_layouts/default.html`

### Updating Existing Content

1. Edit the relevant `.md` file
2. Test locally with `bundle exec jekyll serve`
3. Commit changes - GitHub Pages will auto-deploy

### Documentation Standards

- **Use clear headings** with emoji prefixes for sections
- **Include code examples** for all API methods
- **Add troubleshooting tips** for common issues
- **Link between related sections** for better navigation
- **Test all code examples** before committing

## 🎯 Documentation Goals

This documentation aims to:

1. **Enable Quick Setup**: Get developers running in minutes
2. **Explain Architecture**: Deep understanding of system design
3. **Provide Complete API**: Every method and property documented
4. **Facilitate Development**: Contributing and extending guidelines
5. **Solve Problems**: Comprehensive troubleshooting coverage

## 📊 Documentation Metrics

The documentation covers:
- **5+ Major Sections**: Complete framework coverage
- **100+ Code Examples**: Practical implementation patterns
- **API Reference**: All public methods and properties
- **Architecture Diagrams**: Visual system design
- **Troubleshooting**: Common issues and solutions

## 🔗 Related Resources

- **[Main README](../README.md)** - Project overview and quick start
- **[GitHub Repository](https://github.com/K-Jadeja/vtubergame)** - Source code
- **[Live Demo](https://k-jadeja.github.io/vtubergame/)** - Working example
- **[Original Library](https://github.com/RaSan147/pixi-live2d-display)** - Lipsync patch source

---

For questions about the documentation, please open an issue on GitHub or contribute improvements via pull request.