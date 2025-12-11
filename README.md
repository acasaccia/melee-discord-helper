# Melee Discord Helper

A command-line tool for managing Magic: The Gathering Arena melee tournaments using the Melee.gg API. Generate Discord-formatted output for participants, pairings, and standings.

Install globally and use the convenient `mdh` command from anywhere on your system.

## Installation

### 1. Install Node.js

**Windows:**

- Download and install from [nodejs.org](https://nodejs.org/)
- Choose the LTS version (recommended)

**macOS:**

```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

**Linux (Ubuntu/Debian):**

```bash
# Using apt
sudo apt update
sudo apt install nodejs npm

# Or using NodeSource repository for latest version
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (CentOS/RHEL/Fedora):**

```bash
# Using dnf/yum
sudo dnf install nodejs npm

# Or using NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install nodejs
```

### 2. Install the CLI tool

```bash
# Clone or download this repository
git clone <repository-url>
cd melee-discord-helper

# Install dependencies and install globally
npm install
npm install -g .
```

After global installation, the `mdh` command will be available system-wide.

### 3. Configure API credentials

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Melee.gg API credentials:

```
CLIENT_ID=your_melee_client_id
CLIENT_SECRET=your_melee_client_secret
```

To get API credentials:

1. Contact Melee.gg support or check their API documentation
2. Request API access for tournament management

## Usage

The CLI provides three main commands for tournament management:

### Basic syntax

```bash
mdh <command> <tournament-id>
```

Or if not installed globally:

```bash
node melee-discord-helper.js <command> <tournament-id>
```

### Commands

#### 1. Participants

List all tournament participants with their deck information.

```bash
mdh participants 373107
```

**Example output:**

```
:loudspeaker: **Tournament participants:** :loudspeaker:

- @yawgmoth_ - [Esper Affinity](https://melee.gg/Decklist/View/fd2634b4-3b1f-4fcc-b1b1-b39101002259)
- @squee311 - [Mono Red Prowess](https://melee.gg/Decklist/View/80deff4b-f881-43c2-899b-b3920015585f)
- @tinyminer - [Rakdos Aggro](https://melee.gg/Decklist/View/5ad9bfac-e1d6-4e86-bbb0-b392017e11f8)
- @morbidmind - [Red Deck Wins](https://melee.gg/Decklist/View/c4e22087-0b8d-4f8f-9294-b39300c294d4)
```

#### 2. Pairings

Show current round pairings with match numbers. BYE matches are listed first.

```bash
mdh pairings 373107
```

**Example output:**

```
:loudspeaker: **Round 5 of 5 pairings** :loudspeaker:

**BYE Matches:**
:white_check_mark: @player1 - BYE

**Regular Matches:**
:one: @player2 vs @player3
:two: @player4 vs @player5
:three: @player6 vs @player7
```

#### 3. Standings

Display current tournament standings with match records, game records, and OMW.

```bash
mdh standings 373107
```

**Example output:**

````
:loudspeaker: **Standings After Round 9** :loudspeaker:

```
Rank Player          Match Game  OMW   
---------------------------------------
1    @yawgmoth_      8-1   17-4  63.3% 
2    @squee311       6-2   12-7  57.1% 
3    @tinyminer      3-2   7-5   58.7% 
3    @morbidmind     6-3   14-11 54.6% 
4    @fr.nwm         3-2   8-5   52.0% 
```
````

## Finding Tournament IDs

Tournament IDs can be found in the Melee.gg tournament URL:

- URL: `https://melee.gg/Tournament/View/373107`
- Tournament ID: `373107`

## Discord Integration

All output is formatted for Discord with:

- **Bold text** using `**text**`
- Emoji indicators (`:loudspeaker:`, `:white_check_mark:`, `:one:`, etc.)
- Markdown links `[text](url)` for deck lists
- Code blocks with proper formatting for standings tables

You can copy and paste the output directly into Discord channels.

## Contributing

Feel free to submit issues and pull requests to improve the tool.

## Disclaimer

This tool is provided as-is for educational and non-profit purposes only. The author disclaims all responsibility for any misuse of this tool or any consequences arising from its use. Users are solely responsible for ensuring their use of this tool complies with all applicable terms of service, including those of Melee.gg and Discord.

This is a non-commercial project created to assist the MTGA Artisan tournament community.

## License

ISC License - See LICENSE file for details.
