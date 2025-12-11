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

    // Sort standings by rank/position
    const sortedStandings = standingsResponse.Content.sort((a, b) => {
      return (a.Rank || a.Position || 999) - (b.Rank || b.Position || 999);
    });

    // Prepare table data for column width calculation
    const tableData = [];
    const headers = ["Rank", "Player", "Match", "Game", "OMW"];

    // Add header row
    tableData.push(headers);

    // Process each standing and collect data
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
      const omwPercentage = `${(omw * 100).toFixed(1)}%`;

      // Add data row
      tableData.push([
        position.toString(),
        `@${discordName}`,
        matchRecord,
        gameRecord,
        omwPercentage,
      ]);
    });

    // Calculate column widths
    const columnWidths = headers.map((_, colIndex) => {
      return Math.max(
        ...tableData.map((row) => (row[colIndex] ? row[colIndex].length : 0))
      );
    });

    // Add some padding to columns
    const padding = [1, 2, 1, 1, 1]; // Extra padding per column
    columnWidths.forEach((width, index) => {
      columnWidths[index] = width + padding[index];
    });

    // Helper function to format a row
    const formatRow = (rowData) => {
      return rowData
        .map((cell, index) => {
          const cellStr = cell || "";
          return cellStr.padEnd(columnWidths[index]);
        })
        .join("");
    };

    // Print the formatted table
    console.log("```");

    // Print headers
    console.log(formatRow(headers));

    // Print separator line
    const separators = columnWidths.map((width) => "-".repeat(width));
    console.log(formatRow(separators));

    // Print data rows (skip header row)
    tableData.slice(1).forEach((row) => {
      console.log(formatRow(row));
    });

    console.log("```");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

module.exports = { standingsCommand };
