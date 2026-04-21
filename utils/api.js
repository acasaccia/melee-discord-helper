const https = require("https");

// Configuration from environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Helper function to make HTTP requests with Basic Auth
function makeApiRequest(path) {
  return new Promise((resolve, reject) => {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64",
    );

    const options = {
      hostname: "melee.gg",
      path: path,
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Request failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

// Get tournament participants with Basic Auth
async function getParticipants(tournamentId) {
  return makeApiRequest(`/api/player/list/${tournamentId}`);
}

// Get current matches/pairings for a tournament
async function getCurrentMatches(tournamentId) {
  return makeApiRequest(`/api/match/list/current/${tournamentId}`);
}

// Get tournament data with Basic Auth
async function getTournament(tournamentId) {
  return makeApiRequest(`/api/tournament/${tournamentId}`);
}

// Get current standings for a tournament
async function getStandings(tournamentId) {
  return makeApiRequest(`/api/standing/list/current/${tournamentId}`);
}

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

module.exports = {
  getParticipants,
  getCurrentMatches,
  getTournament,
  getStandings,
  getParticipantInfo,
};
