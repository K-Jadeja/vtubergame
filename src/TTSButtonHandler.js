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
      console.error("Error starting speech generation:", error);
      updateProgress(100, "Error starting speech generation!");
      this.enableButton();
      this.isProcessing = false;
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
  onError(error, errorData = null) {
    console.error("TTS error:", error);

    // Clear timeout if it exists
    if (this.currentTimeoutId) {
      clearTimeout(this.currentTimeoutId);
      this.currentTimeoutId = null;
    }

    this.isProcessing = false;
    this.mode = "none";
    
    // Show detailed error message with download instructions if available
    if (errorData && errorData.errorType === "model_loading") {
      this.showModelDownloadInstructions(errorData);
    } else {
      updateProgress(100, `Speech generation failed: ${error}`);
    }
    
    this.enableButton();
  }
  
  // Show detailed instructions for downloading the model manually
  showModelDownloadInstructions(errorData) {
    updateProgress(100, "TTS Model Loading Failed - Manual Download Required");
    
    // Create a detailed error display
    const progressContainer = document.getElementById("progressContainer");
    if (progressContainer) {
      const instructionsHtml = `
        <div style="text-align: left; font-size: 13px; line-height: 1.4;">
          <p><strong>The Kokoro TTS model failed to load from HuggingFace Hub.</strong></p>
          
          <p><strong>Possible causes:</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${errorData.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
          </ul>
          
          <p><strong>${errorData.downloadInstructions.title}</strong></p>
          <ol style="margin: 8px 0; padding-left: 20px;">
            ${errorData.downloadInstructions.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
          
          <p><strong>Required files:</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px; font-family: monospace; font-size: 11px;">
            ${errorData.downloadInstructions.files.map(file => `<li>${file}</li>`).join('')}
          </ul>
          
          <p style="margin-top: 10px;">
            <strong>Alternative:</strong> You can test the lip sync detection without TTS by clicking expressions and using the manual test function <code>testLipSync()</code> in the browser console.
          </p>
        </div>
      `;
      
      const progressLabel = document.getElementById("progressLabel");
      if (progressLabel) {
        progressLabel.innerHTML = instructionsHtml;
      }
    }
  }
}
