const { SlashCommandBuilder } = require("@discordjs/builders");
const { Chase } = require("../chase.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chase")
    .setDescription("Starts a Chase"),
  async execute(interaction) {
    if (interaction.channel.isThread()) {
      await interaction.reply({
        content: "A new game cannot be started from within a thread.",
        ephemeral: true,
      });

      return;
    }

    await interaction.reply("A new chase has begun.");
    await new Chase(interaction);
  },
};
