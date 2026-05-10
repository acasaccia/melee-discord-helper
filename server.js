#!/usr/bin/env node
require("dotenv").config();
const express = require("express");
const path = require("path");

// Import API functions
const {
  getParticipants,
  getCurrentMatches,
  getStandings,
  getTournament,
  getParticipantInfo,
} = require("./utils/api");

const { splitMessage } = require("./utils/messageFormatter");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Helper function to format participants data
async function formatParticipants(tournamentId) {
  const response = await getParticipants(tournamentId);

  if (!response || !response.Content || response.Content.length === 0) {
    return { error: "No participants found for this tournament." };
  }

  let message = ":loudspeaker: **Tournament participants:** :loudspeaker:\n";
  response.Content.forEach((player) => {
    const discordUsername = player.DiscordUsername
      ? player.DiscordUsername.replace(/#\d+$/, "")
      : player.Username || "Unknown";

    if (player.Decklists && player.Decklists.length > 0) {
      const decklist = player.Decklists[0];
      const deckName =
        decklist.AdminGivenName || decklist.DecklistName || "Unknown Deck";
      const deckUrl = `https://melee.gg/Decklist/View/${decklist.Guid}`;
      message += `- @${discordUsername} - [${deckName}](${deckUrl})\n`;
    } else {
      message += `- @${discordUsername} - No decklist submitted\n`;
    }
  });

  return { message };
}

// Helper function to format pairings data
async function formatPairings(tournamentId) {
  const [matchesResponse, participantMap, tournamentData] = await Promise.all([
    getCurrentMatches(tournamentId),
    getParticipantInfo(tournamentId),
    getTournament(tournamentId),
  ]);

  if (
    !matchesResponse ||
    !matchesResponse.Content ||
    matchesResponse.Content.length === 0
  ) {
    return { error: "No current pairings found for this tournament." };
  }

  const firstMatch = matchesResponse.Content[0];
  const currentRoundNumber = firstMatch?.RoundNumber || 1;

  let pairingTitle = `Round ${currentRoundNumber} Pairings`;
  if (tournamentData && tournamentData.Phases && firstMatch?.PhaseId) {
    const currentPhase = tournamentData.Phases.find(
      (phase) => phase.ID === firstMatch.PhaseId,
    );

    if (currentPhase) {
      const phaseIndex = tournamentData.Phases.indexOf(currentPhase);
      const isSecondPhase = phaseIndex === 1;

      if (isSecondPhase) {
        pairingTitle = `Double Elimination Bracket`;
      } else {
        const totalRounds = currentPhase.Rounds
          ? currentPhase.Rounds.length
          : "?";
        pairingTitle = `Round ${currentRoundNumber} of ${totalRounds} Pairings`;
      }
    }
  }

  let message = `:loudspeaker: **${pairingTitle}** :loudspeaker:\n`;

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

  // Display BYE matches
  byeMatches.forEach((match) => {
    const player = match.Competitors[0].Team.Players[0];
    const playerDiscord = player.DiscordUsername
      ? player.DiscordUsername.replace(/#\d+$/, "")
      : player.Username || "Unknown";

    let deckInfo = null;
    if (match.Competitors[0].Decklists && match.Competitors[0].Decklists[0]) {
      const playerDeck = match.Competitors[0].Decklists[0];
      deckInfo = {
        name: playerDeck.DecklistName,
        url: `https://melee.gg/Decklist/View/${playerDeck.DecklistId}`,
      };
    } else {
      const participantInfo = participantMap.get(player.ID);
      deckInfo = participantInfo?.deck;
    }

    const deckDisplay = deckInfo
      ? `([${deckInfo.name}](${deckInfo.url}))`
      : "(No deck info)";
    const playerInfo = `@${playerDiscord} ${deckDisplay}`;
    message += `- ${playerInfo} - BYE\n`;
  });

  // Display regular matches
  regularMatches.forEach((match) => {
    const player1 = match.Competitors[0].Team.Players[0];
    const player2 = match.Competitors[1].Team.Players[0];

    const player1Discord = player1.DiscordUsername
      ? player1.DiscordUsername.replace(/#\d+$/, "")
      : player1.Username || "Unknown";
    const player2Discord = player2.DiscordUsername
      ? player2.DiscordUsername.replace(/#\d+$/, "")
      : player2.Username || "Unknown";

    let player1DeckInfo = null;
    let player2DeckInfo = null;

    if (match.Competitors[0].Decklists && match.Competitors[0].Decklists[0]) {
      const player1Deck = match.Competitors[0].Decklists[0];
      player1DeckInfo = {
        name: player1Deck.DecklistName,
        url: `https://melee.gg/Decklist/View/${player1Deck.DecklistId}`,
      };
    } else {
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
    message += `- ${player1Info} vs ${player2Info}\n`;
  });

  return { message };
}

// Helper function to format standings data
async function formatStandings(tournamentId) {
  const [standingsResponse, tournamentData, participantMap] = await Promise.all(
    [
      getStandings(tournamentId),
      getTournament(tournamentId),
      getParticipantInfo(tournamentId),
    ],
  );

  if (
    !standingsResponse ||
    !standingsResponse.Content ||
    standingsResponse.Content.length === 0
  ) {
    return { error: "No current standings found for this tournament." };
  }

  let currentRoundInfo = "Current";
  if (standingsResponse.Content && standingsResponse.Content.length > 0) {
    const currentRound = standingsResponse.Content[0]?.RoundNumber;
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

  const sortedStandings = standingsResponse.Content.sort((a, b) => {
    return (a.Rank || a.Position || 999) - (b.Rank || b.Position || 999);
  });

  sortedStandings.forEach((standing, index) => {
    const position = standing.Rank || standing.Position || index + 1;

    const playerId = standing.Team?.Players?.[0]?.ID;
    const participantInfo = playerId ? participantMap.get(playerId) : null;
    const discordHandle = participantInfo?.discord || "Unknown Player";
    const playerName =
      discordHandle !== "Unknown Player" ? `@${discordHandle}` : discordHandle;

    const matchWins = standing.MatchWins || 0;
    const matchLosses = standing.MatchLosses || 0;
    const matchDraws = standing.MatchDraws || 0;

    let matchRecord = `${matchWins}-${matchLosses}`;
    if (matchDraws > 0) {
      matchRecord += `-${matchDraws}`;
    }

    const gameWins = standing.GameWins || 0;
    const gameLosses = standing.GameLosses || 0;
    const gameDraws = standing.GameDraws || 0;

    let gameRecord = `${gameWins}-${gameLosses}`;
    if (gameDraws > 0) {
      gameRecord += `-${gameDraws}`;
    }

    const omw = standing.OpponentMatchWinPercentage || 0;
    const omwPercentage = `${(omw * 100).toFixed(1)}%`;

    message += `${position}. ${playerName} (${matchRecord}, ${gameRecord}, ${omwPercentage})\n`;
  });

  return { message };
}

// API Routes
app.get("/api/participants/:tournamentId", async (req, res) => {
  try {
    const result = await formatParticipants(req.params.tournamentId);
    if (result.message) {
      result.messageParts = splitMessage(result.message);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/pairings/:tournamentId", async (req, res) => {
  try {
    const result = await formatPairings(req.params.tournamentId);
    if (result.message) {
      result.messageParts = splitMessage(result.message);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/standings/:tournamentId", async (req, res) => {
  try {
    const result = await formatStandings(req.params.tournamentId);
    if (result.message) {
      result.messageParts = splitMessage(result.message);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Melee Discord Helper Web Interface running at http://0.0.0.0:${PORT}`,
  );
  console.log(
    `Make sure CLIENT_ID and CLIENT_SECRET are set in your .env file`,
  );
});
