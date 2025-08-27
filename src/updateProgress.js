let progressStartTime = null;
let progressLastUpdate = null;
let progressLastPercent = 0;

export function updateProgress(percent, message = null, options = {}) {
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressStatus = document.getElementById("progressStatus");
  const progressLabel = document.getElementById("progressLabel");
  
  // Initialize timing for download speed calculation
  if (percent <= 0 || progressStartTime === null) {
    progressStartTime = Date.now();
    progressLastUpdate = Date.now();
    progressLastPercent = 0;
  }
  
  // Show the progress container with a fade-in effect
  if (progressContainer.style.display === "none" || progressContainer.style.display === "") {
    progressContainer.style.opacity = "0";
    progressContainer.style.display = "block";
    
    // Trigger reflow to make the transition work
    void progressContainer.offsetWidth;
    
    progressContainer.style.transition = "opacity 0.3s ease";
    progressContainer.style.opacity = "1";
  }
  
  // Round the percentage for display
  const roundedPercent = Math.round(percent);
  
  // Update the progress bar width with a smooth transition
  progressBar.style.width = `${percent}%`;
  
  // Calculate download speed and ETA for model downloads
  let statusText = `${roundedPercent}%`;
  const now = Date.now();
  const timeDiff = now - progressLastUpdate;
  
  // Only calculate speed for model downloads (when downloading large files)
  if (message && message.includes("Loading Kokoro model") && percent > 0 && percent < 95 && timeDiff > 1000) {
    const percentDiff = percent - progressLastPercent;
    const percentPerSecond = percentDiff / (timeDiff / 1000);
    
    if (percentPerSecond > 0) {
      const remainingPercent = 100 - percent;
      const etaSeconds = remainingPercent / percentPerSecond;
      
      if (etaSeconds < 60) {
        statusText = `${roundedPercent}% (${Math.round(etaSeconds)}s remaining)`;
      } else if (etaSeconds < 3600) {
        statusText = `${roundedPercent}% (${Math.round(etaSeconds / 60)}m ${Math.round(etaSeconds % 60)}s remaining)`;
      } else {
        statusText = `${roundedPercent}% (${Math.round(etaSeconds / 3600)}h remaining)`;
      }
    }
    
    progressLastUpdate = now;
    progressLastPercent = percent;
  }
  
  // Update the status text
  progressStatus.textContent = statusText;
  
  // Update the message if provided
  if (message) {
    // For large model downloads, enhance the message
    let displayMessage = message;
    if (message.includes("Loading Kokoro model") && options.totalSize) {
      const downloadedMB = Math.round((percent / 100) * options.totalSize);
      displayMessage = `${message} (${downloadedMB}MB / ${options.totalSize}MB)`;
    }
    
    progressLabel.textContent = displayMessage;
    
    // Add a small animation to the label when it changes
    progressLabel.style.transition = "transform 0.2s ease";
    progressLabel.style.transform = "translateY(-2px)";
    setTimeout(() => {
      progressLabel.style.transform = "translateY(0)";
    }, 200);
  }
  
  // Handle completion
  if (percent >= 100) {
    // Reset timing variables
    progressStartTime = null;
    progressLastUpdate = null;
    progressLastPercent = 0;
    
    // Change status text
    progressStatus.textContent = `Complete`;
    
    // Add success class to the progress bar
    progressBar.classList.add("success");
    
    // Fade out the progress container after a delay
    setTimeout(() => {
      progressContainer.style.transition = "opacity 0.5s ease";
      progressContainer.style.opacity = "0";
      
      // Hide after the transition completes
      setTimeout(() => {
        progressContainer.style.display = "none";
        progressBar.classList.remove("success");
      }, 500);
    }, 1500);
  }
}