/**
 * Mock Streaming TTS for testing when Kokoro model is not available
 * This simulates the streaming behavior for UI and integration testing
 */
export class MockStreamingTTS {
    constructor(audioPlayer) {
        this.audioPlayer = audioPlayer;
        this.isStreamingActive = false;
        this.isInitialized = true; // Always available for testing
        this.callbacks = {};
    }

    async startStreamingTTS(text, options = {}) {
        if (this.isStreamingActive) {
            console.warn("MockStreamingTTS: Already streaming");
            return false;
        }

        const {
            voice = "af_nicole",
            volume = 0.8,
            expression = null,
            resetExpression = true,
            onFinish,
            onError
        } = options;

        try {
            this.isStreamingActive = true;
            this.callbacks = { onFinish, onError };

            console.log("MockStreamingTTS: Starting mock streaming for:", text);

            // Set expression if specified
            if (expression !== null && this.audioPlayer.live2dModel) {
                this.setExpression(expression);
            }

            // Trigger talking motion
            this.triggerTalkingMotion();

            // Simulate streaming with mock lip sync
            this.startMockLipSync();

            // Simulate completion after 2 seconds
            setTimeout(() => {
                this.stopMockLipSync();
                this.isStreamingActive = false;
                
                if (resetExpression && this.audioPlayer.live2dModel) {
                    this.audioPlayer.live2dModel.expression(0);
                }
                
                if (onFinish) onFinish();
            }, 2000);

            return true;

        } catch (error) {
            console.error("MockStreamingTTS: Failed to start streaming:", error);
            this.isStreamingActive = false;
            if (onError) onError(error);
            return false;
        }
    }

    startMockLipSync() {
        if (!this.audioPlayer.live2dModel) return;

        this.lipSyncActive = true;
        let animationPhase = 0;
        
        const updateMockLipSync = () => {
            if (this.lipSyncActive) {
                // Simulate mouth movement
                animationPhase += 0.3;
                const mouthOpen = (Math.sin(animationPhase) + 1) / 4; // 0 to 0.5
                const mouthForm = Math.sin(animationPhase * 1.3) * 0.3;
                
                try {
                    const coreModel = this.audioPlayer.live2dModel.internalModel?.coreModel;
                    if (coreModel) {
                        coreModel.setParameterValueById('ParamMouthOpenY', mouthOpen);
                        if (coreModel.getParameterIndex('ParamMouthForm') !== -1) {
                            coreModel.setParameterValueById('ParamMouthForm', mouthForm);
                        }
                    }
                } catch (error) {
                    // Ignore parameter errors
                }
                
                setTimeout(updateMockLipSync, 50); // 20fps
            } else {
                this.resetMouthParameters();
            }
        };
        
        updateMockLipSync();
    }

    stopMockLipSync() {
        this.lipSyncActive = false;
        this.resetMouthParameters();
    }

    resetMouthParameters() {
        try {
            const coreModel = this.audioPlayer.live2dModel?.internalModel?.coreModel;
            if (coreModel) {
                coreModel.setParameterValueById('ParamMouthOpenY', 0);
                if (coreModel.getParameterIndex('ParamMouthForm') !== -1) {
                    coreModel.setParameterValueById('ParamMouthForm', 0);
                }
            }
        } catch (error) {
            // Ignore parameter errors
        }
    }

    stopStreaming() {
        this.lipSyncActive = false;
        this.isStreamingActive = false;
        this.resetMouthParameters();
    }

    setExpression(expression) {
        if (!this.audioPlayer.live2dModel?.internalModel?.expressionManager) return;

        const expressions = this.audioPlayer.live2dModel.internalModel.expressionManager.definitions || [];
        if (expressions.length === 0) return;

        let expressionIndex;
        if (typeof expression === "string") {
            expressionIndex = expressions.findIndex(exp => exp.name === expression);
            if (expressionIndex === -1) expressionIndex = 0;
        } else {
            expressionIndex = Math.min(Math.max(0, expression), expressions.length - 1);
        }

        this.audioPlayer.live2dModel.expression(expressionIndex);
    }

    triggerTalkingMotion() {
        const talkingGroups = ["tap_body", "talk", "speaking", "idle", "Idle"];
        
        for (const group of talkingGroups) {
            if (this.audioPlayer.triggerRandomMotion?.(group)) {
                break;
            }
        }
    }

    // Public interface
    isStreamingSupported() {
        return this.isInitialized;
    }

    isCurrentlyStreaming() {
        return this.isStreamingActive;
    }

    dispose() {
        this.stopStreaming();
    }
}