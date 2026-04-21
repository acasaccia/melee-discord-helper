const {
  getStandings,
  getTournament,
  getParticipantInfo,
} = require("../utils/api");
const { printSplitMessage } = require("../utils/messageFormatter");

// Command: standings - Get current tournament standings
async function standingsCommand(tournamentId) {
  try {
    // Get standings, tournament data, and participant info
    const [standingsResponse, tournamentData, participantMap] =
      await Promise.all([
        getStandings(tournamentId),
        getTournament(tournamentId),
        getParticipantInfo(tournamentId),
      ]);

    if (
      !standingsResponse ||
      !standingsResponse.Content ||
      standingsResponse.Content.length === 0
    ) {
      console.log("No current standings found for this tournament.");
      return;
    }

    // Get current round info from standings data
    let currentRoundInfo = "Current";
    if (standingsResponse.Content && standingsResponse.Content.length > 0) {
      const currentRound = standingsResponse.Content[0]?.RoundNumber;
      // For total rounds, we'll need to make an assumption or get it from tournament data
      // From the API structure, let's try to use the tournament data if available
      if (currentRound) {
        if (tournamentData?.Content?.NumberOfRounds) {
          const totalRounds = tournamentData.Content.NumberOfRounds;
          currentRoundInfo = `After Round ${currentRound} of ${totalRounds}`;
        } else {
          currentRoundInfo = `After Round ${currentRound}`;
        }
      }
    }

    let message = `:loudspeaker: **Standings ${currentRoundInfo}** :loudspeaker:\n`;
    message += `\n`;
    message += `(Match record, Game record, OMW%)\n`;

    // Sort standings by rank/position
    const sortedStandings = standingsResponse.Content.sort((a, b) => {
      return (a.Rank || a.Position || 999) - (b.Rank || b.Position || 999);
    });

    // Process each standing
    sortedStandings.forEach((standing, index) => {
      const position = standing.Rank || standing.Position || index + 1;

      // Get player info from participant map using Player ID
      const playerId = standing.Team?.Players?.[0]?.ID;
      const participantInfo = playerId ? participantMap.get(playerId) : null;
      const discordHandle = participantInfo?.discord || "Unknown Player";
      const playerName =
        discordHandle !== "Unknown Player"
          ? `@${discordHandle}`
          : discordHandle;

      // Get match record
      const matchWins = standing.MatchWins || 0;
      const matchLosses = standing.MatchLosses || 0;
      const matchDraws = standing.MatchDraws || 0;

      // Format match record
      let matchRecord = `${matchWins}-${matchLosses}`;
      if (matchDraws > 0) {
        matchRecord += `-${matchDraws}`;
      }

      // Get game record
      const gameWins = standing.GameWins || 0;
      const gameLosses = standing.GameLosses || 0;
      const gameDraws = standing.GameDraws || 0;

      // Format game record
      let gameRecord = `${gameWins}-${gameLosses}`;
      if (gameDraws > 0) {
        gameRecord += `-${gameDraws}`;
      }

      // Get OMW (Opponent Match Win percentage)
      const omw = standing.OpponentMatchWinPercentage || 0;
      const omwPercentage = `${(omw * 100).toFixed(1)}%`;

      // Add standing line in compact format
      message += `${position}. ${playerName} (${matchRecord}, ${gameRecord}, ${omwPercentage})\n`;
    });

    printSplitMessage(message);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

module.exports = { standingsCommand };
