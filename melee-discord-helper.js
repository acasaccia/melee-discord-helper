#!/usr/bin/env node
require("dotenv").config();

// Import commands
const { participantsCommand } = require("./commands/participants");
const { pairingsCommand } = require("./commands/pairings");
const { standingsCommand } = require("./commands/standings");

// Configuration from environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const DEFAULT_TOURNAMENT_ID = process.env.TOURNAMENT_ID;

// Main function - Command router
async function main() {
  try {
    // Check for required environment variables
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error(
        "Error: CLIENT_ID and CLIENT_SECRET must be set in .env file"
      );
      process.exit(1);
    }

    // Get command and tournament ID from command line arguments
    const command = process.argv[2];
    const tournamentId = process.argv[3] || DEFAULT_TOURNAMENT_ID;

    if (!command) {
      console.error("Error: Command is required as the first argument");
      console.error("Usage: node melee.js <command> [tournament-id]");
      console.error("Available commands: participants, pairings, standings");
      console.error(
        "Note: tournament-id can be set via TOURNAMENT_ID environment variable"
      );
      process.exit(1);
    }

    // Route to appropriate command
    switch (command.toLowerCase()) {
      case "participants":
        if (!tournamentId) {
          console.error(
            "Error: Tournament ID is required for participants command"
          );
          console.error("Usage: node melee.js participants <tournament-id>");
          console.error("Or set TOURNAMENT_ID in .env file");
          process.exit(1);
        }
        await participantsCommand(tournamentId);
        break;
      case "pairings":
        if (!tournamentId) {
          console.error(
            "Error: Tournament ID is required for pairings command"
          );
          console.error("Usage: node melee.js pairings <tournament-id>");
          console.error("Or set TOURNAMENT_ID in .env file");
          process.exit(1);
        }
        await pairingsCommand(tournamentId);
        break;
      case "standings":
        if (!tournamentId) {
          console.error(
            "Error: Tournament ID is required for standings command"
          );
          console.error("Usage: node melee.js standings <tournament-id>");
          console.error("Or set TOURNAMENT_ID in .env file");
          process.exit(1);
        }
        await standingsCommand(tournamentId);
        break;
      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error("Available commands: participants, pairings, standings");
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
