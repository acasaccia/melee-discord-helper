// Discord's maximum message length
const DISCORD_MAX_LENGTH = 1800;

/**
 * Splits a message into chunks that fit within Discord's character limit.
 * Messages are split at newline boundaries to avoid breaking lines.
 *
 * @param {string} message - The message to split
 * @param {number} maxLength - Maximum length per message (default: 2000)
 * @returns {string[]} Array of message chunks
 */
function splitMessage(message, maxLength = DISCORD_MAX_LENGTH) {
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks = [];
  const lines = message.split("\n");
  let currentChunk = "";

  for (const line of lines) {
    // If a single line is longer than maxLength, we need to handle it specially
    if (line.length > maxLength) {
      // If we have content in currentChunk, save it first
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      // Split the long line at word boundaries
      let remainingLine = line;
      while (remainingLine.length > maxLength) {
        let splitIndex = maxLength;
        // Try to find a space to split at
        const lastSpace = remainingLine.lastIndexOf(" ", maxLength);
        if (lastSpace > maxLength / 2) {
          // Only use space if it's in the latter half
          splitIndex = lastSpace;
        }
        chunks.push(remainingLine.substring(0, splitIndex));
        remainingLine = remainingLine.substring(splitIndex).trim();
      }

      // Add the remaining part of the line to currentChunk
      if (remainingLine) {
        currentChunk = remainingLine + "\n";
      }
      continue;
    }

    // Check if adding this line would exceed the limit
    const potentialChunk = currentChunk + line + "\n";
    if (potentialChunk.length > maxLength) {
      // Save current chunk and start a new one
      if (currentChunk) {
        chunks.push(currentChunk.trimEnd());
      }
      currentChunk = line + "\n";
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk) {
    chunks.push(currentChunk.trimEnd());
  }

  return chunks;
}

/**
 * Prints message chunks to console, simulating Discord's multi-message behavior
 *
 * @param {string} message - The message to print
 * @param {number} maxLength - Maximum length per message (default: 2000)
 */
function printSplitMessage(message, maxLength = DISCORD_MAX_LENGTH) {
  const chunks = splitMessage(message, maxLength);
  chunks.forEach((chunk, index) => {
    console.log(chunk);
    // Add separator between chunks for visibility
    if (index < chunks.length - 1) {
      console.log("\n--- Message Split ---\n");
    }
  });
}

module.exports = {
  splitMessage,
  printSplitMessage,
  DISCORD_MAX_LENGTH,
};
