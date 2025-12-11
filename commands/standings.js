const { getStandings, getTournament } = require("../utils/api");

// Command: standings - Get current tournament standings
async function standingsCommand(tournamentId) {
  try {
    // Get standings and tournament data
    const [standingsResponse, tournamentData] = await Promise.all([
      getStandings(tournamentId),
      getTournament(tournamentId),
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

    console.log(
      `:loudspeaker: **Standings ${currentRoundInfo}** :loudspeaker:\n`
    );
    console.log("```");
    console.log("Rank\tPlayer\t\t\tMatch\tGame\t\tOMW");
    console.log("----\t------\t\t\t-----\t----\t\t---");

    // Sort standings by rank/position
    const sortedStandings = standingsResponse.Content.sort((a, b) => {
      return (a.Rank || a.Position || 999) - (b.Rank || b.Position || 999);
    });

    sortedStandings.forEach((standing, index) => {
      const position = standing.Rank || standing.Position || index + 1;

      // Get player info from Team.Players[0]
      const player = standing.Team?.Players?.[0];
      const playerName =
        player?.DisplayName || player?.Username || "Unknown Player";

      // Extract Discord username if available (remove #0 suffix)
      let discordName = playerName;
      if (player?.DiscordUsername) {
        discordName = player.DiscordUsername.replace(/#\d+$/, "");
      }

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
      const omwPercentage = (omw * 100).toFixed(1);

      // Pad username to align columns (truncate if too long)
      const paddedUsername = `@${discordName}`.padEnd(20).substring(0, 20);

      console.log(
        `${position}\t${paddedUsername}\t${matchRecord}\t${gameRecord}\t\t${omwPercentage}%`
      );
    });
    console.log("```");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

module.exports = { standingsCommand };
