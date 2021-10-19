# bradley

bradley is a Discord Bot that allows users to become the chaser and challenge others to a chase.

Use the `/chase` command to begin a chase.

Questions are provided by https://trivia.willfry.co.uk/

# Deploying the bot

Copy `.env.example` to `.env`. In `.env` provide your client ID, token, and guild ID.

Run `node deploy-commands.js` to deploy slash commands to the discord server identified by `GUILD_ID`

Run `node .` to begin the app.
