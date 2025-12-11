const { getParticipants } = require("../utils/api");

// Command: participants - Get tournament participants
async function participantsCommand(tournamentId) {
  try {
    console.info(`Fetching participants for tournament ${tournamentId}...\n`);
    const response = await getParticipants(tournamentId);

    if (!response || !response.Content || response.Content.length === 0) {
      console.log("No participants found for this tournament.");
      return;
    }

    console.log(":loudspeaker: **Tournament participants:** :loudspeaker:\n");
    response.Content.forEach((player) => {
      // Extract Discord username (remove the #0 suffix if present)
      const discordUsername = player.DiscordUsername
        ? player.DiscordUsername.replace(/#\d+$/, "")
        : player.Username || "Unknown";

      // Get the first decklist (assuming each player has one deck)
      if (player.Decklists && player.Decklists.length > 0) {
        const decklist = player.Decklists[0];
        const deckName =
          decklist.AdminGivenName || decklist.DecklistName || "Unknown Deck";
        const deckUrl = `https://melee.gg/Decklist/View/${decklist.Guid}`;

        console.log(`- @${discordUsername} - [${deckName}](${deckUrl})`);
      } else {
        console.log(`- @${discordUsername} - No decklist submitted`);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

module.exports = { participantsCommand };
