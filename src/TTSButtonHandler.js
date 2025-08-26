import { updateProgress } from "./updateProgress.js";

export class TTSButtonHandler {
    constructor(worker, audioPlayer) {
        this.worker = worker;
        this.audioPlayer = audioPlayer;
        this.isProcessing = false;
        this.mode = "none";

        // Bind methods to maintain 'this' context
        this.handleSpeakButtonClick = this.handleSpeakButtonClick.bind(this);
    }

    init() {
        document.getElementById("speak-btn").addEventListener("click", this.handleSpeakButtonClick);
    }

    showButtonContent(button, contentType) {
        // Hide all content spans first
        const allContents = button.querySelectorAll('.btn-content');
        allContents.forEach(content => {
            content.style.display = 'none';
        });

        let contentClass;
        switch (contentType) {
            case 'play':
                contentClass = '.play-content';
                break;
            case 'stop':
                contentClass = '.stop-content';
                break;
            case 'loading':
                contentClass = '.loading-content';
                break;
            default:
                console.error('Unknown content type:', contentType);
                return;
        }

        const contentToShow = button.querySelector(contentClass);
        if (contentToShow) {
            contentToShow.style.display = 'inline-flex';
        }
    }

    enableButton() {
        const speakBtn = document.getElementById("speak-btn");
        speakBtn.disabled = false;
        speakBtn.classList.remove("loading");
        this.showButtonContent(speakBtn, "play");
    }

    disableButton() {
        const speakBtn = document.getElementById("speak-btn");
        speakBtn.disabled = true;
        speakBtn.classList.remove("loading");
        this.showButtonContent(speakBtn, "play");
    }

    setLoadingState() {
        const speakBtn = document.getElementById("speak-btn");
        speakBtn.disabled = false;
        speakBtn.classList.add("loading");
        this.showButtonContent(speakBtn, "loading");
    }

    setStopState() {
        const speakBtn = document.getElementById("speak-btn");
        speakBtn.disabled = false;
        speakBtn.classList.remove("loading");
        this.showButtonContent(speakBtn, "stop");
    }

    async handleSpeakButtonClick() {
        if (this.isProcessing) {
            // Stop current processing
            this.mode = "none";
            this.isProcessing = false;
            this.audioPlayer.stop();
            updateProgress(100, "Speech stopped");
            setTimeout(() => {
                this.enableButton();
            }, 50);
            return;
        }

        const text = document.getElementById("tts-text").value.trim();
        if (!text) {
            alert("Please enter text to speak");
            return;
        }

        if (!this.audioPlayer.live2dModel) {
            alert("Please load a Live2D model first!");
            return;
        }

        this.setLoadingState();
        this.mode = "live2d";
        this.isProcessing = true;

        try {
            updateProgress(0, "Initializing speech generation...");

            // Set estimated chunks based on text length
            this.audioPlayer.setTotalChunks(Math.ceil(text.length / 300));
            this.audioPlayer.reset();

            // Set a timeout for the entire process (10 seconds)
            this.currentTimeoutId = setTimeout(() => {
                if (this.isProcessing) {
                    console.log("TTS timeout reached, falling back to browser TTS");
                    this.fallbackToBrowserTTS(text);
                }
            }, 10000);

            // Send text to worker for processing
            this.worker.postMessage({ 
                type: "generate", 
                text: text, 
                voice: 'af_heart' // Default voice 
            });

        } catch (error) {
            console.error("Error starting speech generation:", error);
            updateProgress(100, "Error starting speech generation!");
            this.enableButton();
            this.isProcessing = false;
        }
    }

    async fallbackToBrowserTTS(text) {
        try {
            console.log("Using browser TTS fallback with animation");
            updateProgress(80, "Using browser TTS fallback...");
            
            // Clear any existing timeouts
            if (this.currentTimeoutId) {
                clearTimeout(this.currentTimeoutId);
                this.currentTimeoutId = null;
            }

            const utterance = new SpeechSynthesisUtterance(text);

            // Get available voices
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                const femaleVoice = voices.find(
                    (voice) =>
                        voice.name.toLowerCase().includes("female") ||
                        voice.name.toLowerCase().includes("woman") ||
                        voice.name.toLowerCase().includes("zira") ||
                        voice.name.toLowerCase().includes("hazel")
                );
                if (femaleVoice) {
                    utterance.voice = femaleVoice;
                }
            }

            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                console.log("Browser TTS started");
                updateProgress(90, "Speaking with browser TTS...");
                
                // Trigger talking motions
                this.audioPlayer.triggerRandomMotion("tap_body") ||
                    this.audioPlayer.triggerRandomMotion("idle") ||
                    this.audioPlayer.triggerRandomMotion("Idle");
            };

            utterance.onend = () => {
                console.log("Browser TTS ended");
                updateProgress(100, "Speech completed successfully!");
                this.onComplete();
            };

            utterance.onerror = (event) => {
                console.error("Browser TTS error:", event);
                updateProgress(100, "Speech failed!");
                this.onComplete();
            };

            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);

        } catch (error) {
            console.error("Fallback TTS error:", error);
            updateProgress(100, "Speech failed!");
            this.onComplete();
        }
    }

    getMode() {
        return this.mode;
    }

    setMode(newMode) {
        this.mode = newMode;
    }

    isCurrentlyProcessing() {
        return this.isProcessing;
    }

    setProcessing(state) {
        this.isProcessing = state;
    }

    // Called when streaming starts
    updateToStopState() {
        if (this.isProcessing) {
            this.setStopState();
        }
    }

    // Called when processing completes
    onComplete() {
        // Clear timeout if it exists
        if (this.currentTimeoutId) {
            clearTimeout(this.currentTimeoutId);
            this.currentTimeoutId = null;
        }
        
        this.isProcessing = false;
        this.mode = "none";
        this.enableButton();
    }

    // Called when there's an error
    onError(error) {
        console.error("TTS error:", error);
        
        // Clear timeout if it exists
        if (this.currentTimeoutId) {
            clearTimeout(this.currentTimeoutId);
            this.currentTimeoutId = null;
        }
        
        this.isProcessing = false;
        this.mode = "none";
        updateProgress(100, "Speech generation failed!");
        this.enableButton();
    }
}