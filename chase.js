const { blockQuote } = require("@discordjs/builders");
const { MessageActionRow, MessageButton } = require("discord.js");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args)); // load ESM
const shuffleArray = require("./util/shuffleArray.js");
const wait = require("./util/wait.js");

const ANGRY_FACE = "😠";
const HAPPY_FACE = "😄";
const WHITE_SMALL_SQUARE = "▫️";
const GAME_LENGTH = 8;

const gamesInProgress = [];

class Chase {
  constructor(interaction) {
    gamesInProgress.push(this);
    this.chaser = interaction.user;

    const row = new MessageActionRow();

    row.addComponents(
      new MessageButton()
        .setCustomId("play")
        .setLabel("Accept")
        .setStyle("SECONDARY"),
      new MessageButton()
        .setCustomId("safe")
        .setLabel("Accept (Play it Safe)")
        .setStyle("SECONDARY"),
      new MessageButton()
        .setCustomId("risky")
        .setLabel("Accept (Play it Risky)")
        .setStyle("SECONDARY")
    );

    interaction.channel.threads
      .create({
        name: "The Chase",
      })
      .then(async (thread) => {
        this.thread = thread;
        let message = await thread.send({
          content: `${interaction.user} has started a Chase. Do you have what it takes to face The Chaser?`,
          components: [row],
        });

        const filter = (message) => {
          let result = message.user.id !== interaction.user.id;
          if (!result) {
            message.reply({
              content: `You can't accept your own challenge`,
              ephemeral: true,
            });
          }
          return result;
        };

        const collector = message.createMessageComponentCollector({
          filter,
          componentType: "BUTTON",
        });

        collector.on("collect", async (interaction) => {
          switch (interaction.customId) {
            case "safe":
              await interaction.reply({
                content: `The Chase is on! It's time for ${interaction.user.username} to face ${this.chaser.username}.`,
              });
              this.newGame(interaction.user, "safe");
              break;
            case "risky":
              await interaction.reply({
                content: `The Chase is on! It's time for ${interaction.user.username} to face ${this.chaser.username}.`,
              });
              this.newGame(interaction.user, "risky");
              break;
            default:
              await interaction.reply({
                content: `The Chase is on! It's time for ${interaction.user.username} to face ${this.chaser.username}.`,
              });
              this.newGame(interaction.user);
          }

          row.components.forEach((component) => component.setDisabled());

          await message.edit({
            content: message.content,
            components: [row],
          });
          return;
        });
      });
  }

  async newGame(contestant, risk = null) {
    this.contestant = contestant;
    this.risk = risk;

    this.chaserRemaining = GAME_LENGTH;

    switch (this.risk) {
      case "safe":
        this.contestantRemaining = 4;
        await this.thread.send(
          `${this.contestant.username} begins one step closer to home.`
        );
        break;
      case "risky":
        this.contestantRemaining = 6;
        await this.thread.send(
          `${this.contestant.username} begins one step closer to to The Chaser.`
        );
        break;
      default:
        this.contestantRemaining = 5;
    }

    await wait(1000);
    await this.thread.send(this.getBoard());

    await this.nextRound();
  }

  async nextRound() {
    const response = await fetch(
      "https://api.trivia.willfry.co.uk/questions?limit=1"
    );
    const data = await response.json();
    this.currentQuestion = await data[0];

    const incorrectAnswers = shuffleArray(
      this.currentQuestion.incorrectAnswers
    );

    const choices = [
      this.currentQuestion.correctAnswer,
      ...incorrectAnswers.slice(0, 2),
    ];
    choices.shuffle;
    const row = new MessageActionRow();
    choices.forEach((choice) => {
      row.addComponents(
        new MessageButton()
          .setCustomId(choice)
          .setLabel(choice)
          .setStyle("SECONDARY")
      );
    });

    await wait(1000);

    let message = await this.thread.send({
      content: blockQuote(`Question:\n${this.currentQuestion.question}`),
      components: [row],
    });

    let awaitingResponses = [this.chaser, this.contestant];
    const filter = (m) => awaitingResponses.content.includes(m.user);

    const collector = message.createMessageComponentCollector(filter);

    collector.on("collect", (interaction) => {
      interaction.reply(`${interaction.user.username} has answered.`);

      awaitingResponses.splice(awaitingResponses.indexOf(interaction.user), 1);

      if (awaitingResponses.length < 1) {
        collector.stop();
      }
      return;
    });

    collector.on("end", async (collected) => {
      let contestantCorrect, chaserCorrect, contestantAnswer, chaserAnswer;

      collected.forEach((interaction) => {
        if (interaction.user === this.chaser) {
          chaserAnswer = interaction.customId;
          if (interaction.customId === this.currentQuestion.correctAnswer) {
            this.chaserRemaining--;
            chaserCorrect = true;
          }
        }

        if (interaction.user === this.contestant) {
          contestantAnswer = interaction.customId;
          if (interaction.customId === this.currentQuestion.correctAnswer) {
            this.contestantRemaining--;
            contestantCorrect = true;
          }
        }
      });

      await wait(1000);
      await this.thread.send(
        `${this.contestant.username} answers ${contestantAnswer}.`
      );

      await wait(1000);
      await this.thread.send(
        `The correct answer is ${this.currentQuestion.correctAnswer}.`
      );

      await wait(1000);
      await this.thread.send(`The Chaser answers ${chaserAnswer}.`);

      if (
        chaserCorrect &&
        !contestantCorrect &&
        this.chaserRemaining - this.contestantRemaining > 1
      ) {
        await wait(1000);
        await this.thread.send(
          `The Chaser takes one step closer to ${this.contestant.username}`
        );
      }

      if (!chaserCorrect && contestantCorrect && this.contestantRemaining > 1) {
        await wait(1000);
        await this.thread.send(
          `${this.contestant.username} takes one step closer to safety`
        );
      }

      if (!chaserCorrect && !contestantCorrect) {
        await wait(1000);
        await this.thread.send(
          `Nobody gets it right and everyone stays where they are.`
        );
      }

      if (
        this.contestantRemaining > 1 &&
        this.chaserRemaining === this.contestantRemaining + 1
      ) {
        await wait(1000);
        await this.thread.send(
          `${this.contestant.username} needs to get this next one right to stay in the game.`
        );
      }

      if (this.contestantRemaining === 1) {
        await wait(1000);
        await this.thread.send(`${this.contestant.username} is one from home.`);
      }

      if (this.contestantRemaining < 1) {
        await wait(1000);
        await this.thread.send(`🥳 ${this.contestant} has beaten The Chaser!`);
        return;
      }

      if (this.contestantRemaining === this.chaserRemaining) {
        await wait(1000);
        await this.thread.send(
          `${this.contestant} has been beaten by The Chaser!`
        );
        return;
      }

      await wait(1000);
      await this.thread.send(this.getBoard());

      this.nextRound();
    });
  }

  getBoard() {
    const board = Array(GAME_LENGTH).fill(WHITE_SMALL_SQUARE);
    board[GAME_LENGTH - this.chaserRemaining] = ANGRY_FACE;
    board[GAME_LENGTH - this.contestantRemaining] = HAPPY_FACE;
    return `${blockQuote(board.join(" "))}`;
  }
}

module.exports = { Chase, gamesInProgress };
