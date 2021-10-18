const { gamesInProgress } = require("../chase.js");

module.exports = {
  name: "threadUpdate",
  async execute(oldThread, newThread) {
    if (!newThread.archived) return;

    const index = gamesInProgress.findIndex((game) => {
      return game.thread.id === newThread.id;
    });

    if (index > -1) {
      gamesInProgress.splice(index, 1);
    }
  },
};
