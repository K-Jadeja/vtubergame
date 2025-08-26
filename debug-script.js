// Quick debug script - run this in browser console after loading a model
function debugLive2DModel() {
    if (!window.app) {
        console.log('❌ PixiJS app not found');
        return;
    }
    
    if (!window.app.stage.children.length) {
        console.log('❌ No children in stage');
        return;
    }
    
    const model = window.app.stage.children.find(child => child.constructor.name.includes('Live2D'));
    
    if (!model) {
        console.log('❌ No Live2D model found in stage');
        console.log('Stage children:', window.app.stage.children.map(c => c.constructor.name));
        return;
    }
    
    console.log('✅ Live2D Model Found!');
    console.log('Position:', { x: model.x, y: model.y });
    console.log('Scale:', { x: model.scale.x, y: model.scale.y });
    console.log('Anchor:', { x: model.anchor?.x || 0, y: model.anchor?.y || 0 });
    console.log('Visible:', model.visible);
    console.log('Alpha:', model.alpha);
    console.log('Bounds:', model.getBounds());
    console.log('Canvas size:', { width: window.app.view.width, height: window.app.view.height });
    
    // Check if model is within canvas bounds
    const bounds = model.getBounds();
    const canvas = window.app.view;
    
    const withinBounds = {
        left: bounds.x >= 0,
        right: bounds.x + bounds.width <= canvas.width,
        top: bounds.y >= 0,
        bottom: bounds.y + bounds.height <= canvas.height
    };
    
    console.log('Within canvas bounds:', withinBounds);
    
    if (!withinBounds.left || !withinBounds.right || !withinBounds.top || !withinBounds.bottom) {
        console.log('⚠️  Model is positioned outside visible canvas area!');
    }
    
    // Test model visibility by moving it to center
    console.log('🔧 Moving model to center for testing...');
    model.x = canvas.width / 2;
    model.y = canvas.height / 2;
    model.anchor.set(0.5, 0.5);
    console.log('Model moved to center. Is it visible now?');
}

// Run debug function
debugLive2DModel();
