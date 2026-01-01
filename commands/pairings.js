const {
  getCurrentMatches,
  getParticipants,
  getTournament,
} = require("../utils/api");

// Helper function to get participant info by ID
async function getParticipantInfo(tournamentId) {
  const participantsResponse = await getParticipants(tournamentId);
  const participantMap = new Map();

  if (participantsResponse && participantsResponse.Content) {
    participantsResponse.Content.forEach((player) => {
      const discordUsername = player.DiscordUsername
        ? player.DiscordUsername.replace(/#\d+$/, "")
        : player.Username || "Unknown";
      const deckInfo =
        player.Decklists && player.Decklists.length > 0
          ? {
              name:
                player.Decklists[0].AdminGivenName ||
                player.Decklists[0].DecklistName ||
                "Unknown Deck",
              url: `https://melee.gg/Decklist/View/${player.Decklists[0].Guid}`,
            }
          : null;

      participantMap.set(player.ID, {
        discord: discordUsername,
        deck: deckInfo,
      });
    });
  }

  return participantMap;
}

// Helper function to get number emoji
function getNumberEmoji(index) {
  const numberEmojis = [
    ":one:",
    ":two:",
    ":three:",
    ":four:",
    ":five:",
    ":six:",
    ":seven:",
    ":eight:",
    ":nine:",
    ":keycap_ten:",
  ];
  return numberEmojis[index] || `:${index + 1}:`;
}

// Command: pairings - Get current tournament pairings
async function pairingsCommand(tournamentId) {
  try {
    console.log(
      `Fetching current pairings for tournament ${tournamentId}...\n`
    );

    // Get matches, participant info, and tournament data
    const [matchesResponse, participantMap, tournamentData] = await Promise.all(
      [
        getCurrentMatches(tournamentId),
        getParticipantInfo(tournamentId),
        getTournament(tournamentId),
      ]
    );

    if (
      !matchesResponse ||
      !matchesResponse.Content ||
      matchesResponse.Content.length === 0
    ) {
      console.log("No current pairings found for this tournament.");
      return;
    }

    // Get current round info and determine phase information
    const firstMatch = matchesResponse.Content[0];
    const currentRoundNumber = firstMatch?.RoundNumber || 1;

    // Detect if we're in the second phase (double elimination bracket)
    let pairingTitle = `Round ${currentRoundNumber} Pairings`;
    if (tournamentData && tournamentData.Phases && firstMatch?.PhaseId) {
      const currentPhase = tournamentData.Phases.find(
        (phase) => phase.ID === firstMatch.PhaseId
      );

      if (currentPhase) {
        const phaseIndex = tournamentData.Phases.indexOf(currentPhase);
        const isSecondPhase = phaseIndex === 1; // Second phase (index 1)

        if (isSecondPhase) {
          pairingTitle = `Double Elimination Bracket`;
        } else {
          // First phase or other phases - show round X of Y format
          const totalRounds = currentPhase.Rounds
            ? currentPhase.Rounds.length
            : "?";
          pairingTitle = `Round ${currentRoundNumber} of ${totalRounds} Pairings`;
        }
      }
    }

    console.log(`:loudspeaker: **${pairingTitle}** :loudspeaker:\n`);

    // Separate BYE matches from regular matches
    const byeMatches = [];
    const regularMatches = [];

    matchesResponse.Content.forEach((match) => {
      if (
        match.Competitors &&
        match.Competitors.length === 1 &&
        match.ByeReason !== null
      ) {
        byeMatches.push(match);
      } else if (match.Competitors && match.Competitors.length === 2) {
        regularMatches.push(match);
      }
    });

    // Display BYE matches first
    byeMatches.forEach((match) => {
      const player = match.Competitors[0].Team.Players[0];
      const playerDiscord = player.DiscordUsername
        ? player.DiscordUsername.replace(/#\d+$/, "")
        : player.Username || "Unknown";

      // Get deck info from match or fallback to participant map
      let deckInfo = null;
      if (match.Competitors[0].Decklists && match.Competitors[0].Decklists[0]) {
        const playerDeck = match.Competitors[0].Decklists[0];
        deckInfo = {
          name: playerDeck.DecklistName,
          url: `https://melee.gg/Decklist/View/${playerDeck.DecklistId}`,
        };
      } else {
        // Fallback to participant map (first phase deck info)
        const participantInfo = participantMap.get(player.ID);
        deckInfo = participantInfo?.deck;
      }

      const deckDisplay = deckInfo
        ? `([${deckInfo.name}](${deckInfo.url}))`
        : "(No deck info)";
      const playerInfo = `@${playerDiscord} ${deckDisplay}`;
      console.log(`:white_check_mark: ${playerInfo} - BYE`);
    });

    // Display regular matches with numbering
    let pairingIndex = 0;
    regularMatches.forEach((match) => {
      const player1 = match.Competitors[0].Team.Players[0];
      const player2 = match.Competitors[1].Team.Players[0];

      const player1Discord = player1.DiscordUsername
        ? player1.DiscordUsername.replace(/#\d+$/, "")
        : player1.Username || "Unknown";
      const player2Discord = player2.DiscordUsername
        ? player2.DiscordUsername.replace(/#\d+$/, "")
        : player2.Username || "Unknown";

      // Get deck info from match or fallback to participant map
      let player1DeckInfo = null;
      let player2DeckInfo = null;

      if (match.Competitors[0].Decklists && match.Competitors[0].Decklists[0]) {
        const player1Deck = match.Competitors[0].Decklists[0];
        player1DeckInfo = {
          name: player1Deck.DecklistName,
          url: `https://melee.gg/Decklist/View/${player1Deck.DecklistId}`,
        };
      } else {
        // Fallback to participant map (first phase deck info)
        const participantInfo = participantMap.get(player1.ID);
        player1DeckInfo = participantInfo?.deck;
      }

      if (match.Competitors[1].Decklists && match.Competitors[1].Decklists[0]) {
        const player2Deck = match.Competitors[1].Decklists[0];
        player2DeckInfo = {
          name: player2Deck.DecklistName,
          url: `https://melee.gg/Decklist/View/${player2Deck.DecklistId}`,
        };
      } else {
        // Fallback to participant map (first phase deck info)
        const participantInfo = participantMap.get(player2.ID);
        player2DeckInfo = participantInfo?.deck;
      }

      const player1DeckDisplay = player1DeckInfo
        ? `([${player1DeckInfo.name}](${player1DeckInfo.url}))`
        : "(No deck info)";
      const player2DeckDisplay = player2DeckInfo
        ? `([${player2DeckInfo.name}](${player2DeckInfo.url}))`
        : "(No deck info)";

      const player1Info = `@${player1Discord} ${player1DeckDisplay}`;
      const player2Info = `@${player2Discord} ${player2DeckDisplay}`;

      console.log(
        `${getNumberEmoji(pairingIndex)} ${player1Info} vs ${player2Info}`
      );
      pairingIndex++;
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

module.exports = { pairingsCommand };
