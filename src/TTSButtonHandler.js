import { updateProgress } from "./updateProgress.js";

export class TTSButtonHandler {
  constructor(worker, audioPlayer, streamingExtension = null) {
    this.worker = worker;
    this.audioPlayer = audioPlayer;
    this.streamingExtension = streamingExtension; // NEW: Streaming extension
    this.isProcessing = false;
    this.mode = "none";

    // Bind methods to maintain 'this' context
    this.handleSpeakButtonClick = this.handleSpeakButtonClick.bind(this);
  }

  init() {
    document
      .getElementById("speak-btn")
      .addEventListener("click", this.handleSpeakButtonClick);
  }

  showButtonContent(button, contentType) {
    // Hide all content spans first
    const allContents = button.querySelectorAll(".btn-content");
    allContents.forEach((content) => {
      content.style.display = "none";
    });

    let contentClass;
    switch (contentType) {
      case "play":
        contentClass = ".play-content";
        break;
      case "stop":
        contentClass = ".stop-content";
        break;
      case "loading":
        contentClass = ".loading-content";
        break;
      default:
        console.error("Unknown content type:", contentType);
        return;
    }

    const contentToShow = button.querySelector(contentClass);
    if (contentToShow) {
      contentToShow.style.display = "inline-flex";
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
      
      // Stop both streaming and regular audio
      if (this.streamingExtension) {
        this.streamingExtension.stopStreaming();
      }
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

      // Try streaming TTS first if available (NEW FEATURE)
      if (this.streamingExtension && this.streamingExtension.isStreamingSupported()) {
        console.log("🚀 Using streaming TTS for ultra-fast response");
        updateProgress(10, "Starting streaming speech...");
        
        const success = await this.streamingExtension.startStreamingTTS(text, {
          voice: "af_nicole",
          volume: 0.8,
          onFinish: () => {
            updateProgress(100, "⚡ Streaming speech completed successfully!");
            this.onComplete();
          },
          onError: (error) => {
            console.warn("Streaming TTS failed, falling back to chunking:", error);
            updateProgress(30, "Falling back to chunking method...");
            this.fallbackToChunking(text);
          }
        });

        if (success) {
          updateProgress(20, "🎵 Streaming audio in real-time...");
          this.updateToStopState();
          return; // Success - exit early, no fallback needed
        } else {
          // If streaming failed to start, fall back to chunking
          console.log("Streaming failed to start, using legacy chunking TTS method");
          updateProgress(15, "Using chunking method...");
          this.fallbackToChunking(text);
        }
      } else {
        // Fallback to chunking method (EXISTING FUNCTIONALITY)
        console.log("Streaming not supported, using legacy chunking TTS method");
        updateProgress(15, "Using chunking method...");
        this.fallbackToChunking(text);
      }

    } catch (error) {
      console.error("Error starting speech generation:", error);
      updateProgress(100, "Error starting speech generation!");
      this.enableButton();
      this.isProcessing = false;
    }
  }

  /**
   * Fallback to the original chunking method
   */
  fallbackToChunking(text) {
    try {
      // Set estimated chunks based on text length
      this.audioPlayer.setTotalChunks(Math.ceil(text.length / 300));
      this.audioPlayer.reset();

      // Set a timeout for the entire process (30 seconds) - only for complete failure
      this.currentTimeoutId = setTimeout(() => {
        if (this.isProcessing && this.mode === "live2d") {
          console.log("TTS timeout reached - Kokoro model failed to respond");
          this.onError(
            "Kokoro TTS failed to generate audio. Model may not be loaded properly."
          );
        }
      }, 160000); // Increased timeout to 160 seconds

      // Send text to worker for processing
      this.worker.postMessage({
        type: "generate",
        text: text,
        voice: "af_nicole", // Default voice
      });
    } catch (error) {
      console.error("Error in fallback chunking method:", error);
      this.onError("Failed to start speech generation");
    }
  }

  // This method is removed - no more browser TTS fallback
  // Kokoro TTS should be the only audio generation method

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
    updateProgress(100, `Speech generation failed: ${error}`);
    this.enableButton();
  }
}
