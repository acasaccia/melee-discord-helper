let currentRequest = null;
let messageParts = [];

async function copyToClipboard(partIndex) {
  const text = messageParts[partIndex];
  const feedback = document.getElementById(`copyFeedback-${partIndex}`);

  // Try modern clipboard API first (requires HTTPS)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      feedback.classList.add("show");
      setTimeout(() => {
        feedback.classList.remove("show");
      }, 2000);
      return;
    } catch (err) {
      console.log("Clipboard API failed, trying fallback:", err);
    }
  }

  // Fallback for HTTP (insecure context)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      feedback.classList.add("show");
      setTimeout(() => {
        feedback.classList.remove("show");
      }, 2000);
    } else {
      throw new Error("execCommand failed");
    }
  } catch (err) {
    console.error("Failed to copy:", err);
    alert("Failed to copy to clipboard");
  }
}

async function fetchData(command) {
  const tournamentId = document.getElementById("tournamentId").value.trim();
  const outputDiv = document.getElementById("output");
  const buttons = document.querySelectorAll("button");

  if (!tournamentId) {
    outputDiv.innerHTML =
      '<div class="error">Please enter a tournament ID</div>';
    return;
  }

  // Cancel any pending request
  if (currentRequest) {
    currentRequest.abort();
  }

  // Disable buttons and show loading
  buttons.forEach((btn) => (btn.disabled = true));
  outputDiv.innerHTML =
    '<div class="loading"><div class="spinner"></div>Loading...</div>';

  // Create abort controller for this request
  const controller = new AbortController();
  currentRequest = controller;

  try {
    const response = await fetch(`/api/${command}/${tournamentId}`, {
      signal: controller.signal,
    });
    const data = await response.json();

    if (data.error) {
      outputDiv.innerHTML = `<div class="error">${data.error}</div>`;
      messageParts = [];
    } else if (data.messageParts && data.messageParts.length > 0) {
      // Store the message parts
      messageParts = data.messageParts;

      // Build HTML for multiple parts
      let html = "";
      messageParts.forEach((part, index) => {
        const escapedMessage = part
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        html += `
          <div class="message-part">
            <div class="part-header">
              <span class="part-label">Part ${index + 1}</span>
              <div>
                <span class="copy-feedback" id="copyFeedback-${index}">Copied!</span>
                <button class="btn-copy-part" onclick="copyToClipboard(${index})">
                  📋 Copy Part ${index + 1}
                </button>
              </div>
            </div>
            <textarea class="output-textarea" readonly>${escapedMessage}</textarea>
          </div>
        `;
      });

      outputDiv.innerHTML = html;
    } else {
      outputDiv.innerHTML =
        '<div class="error">Unexpected response format</div>';
    }
  } catch (error) {
    if (error.name === "AbortError") {
      // Request was cancelled, do nothing
      return;
    }
    outputDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
  } finally {
    // Re-enable buttons
    buttons.forEach((btn) => (btn.disabled = false));
    currentRequest = null;
  }
}

// Allow Enter key to trigger the last clicked button or default to participants
document
  .getElementById("tournamentId")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      fetchData("participants");
    }
  });

// Focus on input on page load
document.getElementById("tournamentId").focus();
