// LipSyncMonitor.js - Monitor Live2D model for actual lip movement
export class LipSyncMonitor {
  constructor(live2dModel) {
    this.model = live2dModel;
    this.isMonitoring = false;
    this.lastMouthValues = { open: 0, form: 0 };
    this.movementThreshold = 0.05; // Minimum change to detect movement
    this.movementHistory = [];
    this.maxHistoryLength = 30; // Keep 30 frames of history
    this.onMovementChange = null; // Callback for movement state changes
    this.isMoving = false;
    this.animationFrame = null;
  }

  /**
   * Start monitoring lip movement
   * @param {Function} onMovementChange - Callback function(isMoving, mouthValues)
   */
  startMonitoring(onMovementChange = null) {
    if (!this.model || !this.model.internalModel) {
      console.warn("No Live2D model available for lip monitoring");
      return false;
    }

    this.onMovementChange = onMovementChange;
    this.isMonitoring = true;
    this.monitorLoop();
    console.log("Lip sync monitoring started");
    return true;
  }

  /**
   * Stop monitoring lip movement
   */
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    console.log("Lip sync monitoring stopped");
  }

  /**
   * Get current mouth parameter values
   */
  getCurrentMouthValues() {
    if (!this.model?.internalModel?.coreModel) {
      return { open: 0, form: 0 };
    }

    try {
      const open = this.model.internalModel.coreModel.getParameterValueById('ParamMouthOpenY') || 0;
      const form = this.model.internalModel.coreModel.getParameterValueById('ParamMouthForm') || 0;
      return { open, form };
    } catch (error) {
      // Fallback for different Live2D versions
      try {
        const params = this.model.internalModel.coreModel._model?._parameterValues || [];
        const mouthOpenIndex = this.model.internalModel.coreModel._model?._parameterIds?.indexOf('ParamMouthOpenY');
        const mouthFormIndex = this.model.internalModel.coreModel._model?._parameterIds?.indexOf('ParamMouthForm');
        
        return {
          open: mouthOpenIndex >= 0 ? (params[mouthOpenIndex] || 0) : 0,
          form: mouthFormIndex >= 0 ? (params[mouthFormIndex] || 0) : 0
        };
      } catch (fallbackError) {
        console.warn("Could not read mouth parameters:", error, fallbackError);
        return { open: 0, form: 0 };
      }
    }
  }

  /**
   * Check if lips are currently moving based on parameter changes
   */
  detectMovement(currentValues) {
    const openChange = Math.abs(currentValues.open - this.lastMouthValues.open);
    const formChange = Math.abs(currentValues.form - this.lastMouthValues.form);
    
    const isMoving = openChange > this.movementThreshold || formChange > this.movementThreshold;
    
    // Add to movement history
    this.movementHistory.push({
      timestamp: Date.now(),
      isMoving,
      openChange,
      formChange,
      values: { ...currentValues }
    });

    // Keep history within limits
    if (this.movementHistory.length > this.maxHistoryLength) {
      this.movementHistory.shift();
    }

    // Update last values
    this.lastMouthValues = { ...currentValues };

    return isMoving;
  }

  /**
   * Get movement statistics from recent history
   */
  getMovementStats() {
    if (this.movementHistory.length === 0) {
      return { movingFrames: 0, totalFrames: 0, movementPercentage: 0 };
    }

    const movingFrames = this.movementHistory.filter(frame => frame.isMoving).length;
    const totalFrames = this.movementHistory.length;
    const movementPercentage = (movingFrames / totalFrames) * 100;

    return { movingFrames, totalFrames, movementPercentage };
  }

  /**
   * Main monitoring loop
   */
  monitorLoop() {
    if (!this.isMonitoring) return;

    const currentValues = this.getCurrentMouthValues();
    const isCurrentlyMoving = this.detectMovement(currentValues);

    // Check if movement state changed
    if (isCurrentlyMoving !== this.isMoving) {
      this.isMoving = isCurrentlyMoving;
      if (this.onMovementChange) {
        this.onMovementChange(this.isMoving, currentValues, this.getMovementStats());
      }
    }

    // Schedule next frame
    this.animationFrame = requestAnimationFrame(() => this.monitorLoop());
  }

  /**
   * Get a summary of current lip sync status
   */
  getStatus() {
    const currentValues = this.getCurrentMouthValues();
    const stats = this.getMovementStats();
    
    return {
      isMonitoring: this.isMonitoring,
      isMoving: this.isMoving,
      currentMouthValues: currentValues,
      movementStats: stats,
      hasModel: !!this.model?.internalModel
    };
  }
}