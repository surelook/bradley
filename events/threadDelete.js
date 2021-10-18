const { gamesInProgress } = require("../chase.js");

module.exports = {
  name: "threadDelete",
  async execute(thread) {
    const index = gamesInProgress.findIndex((game) => {
      return game.thread.id === thread.id;
    });

    if (index > -1) {
      gamesInProgress.splice(index, 1);
    }
  },
};
