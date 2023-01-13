const express = require("express");

const app = express();

app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeConnectionFromDbToServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http://localhost:3001");
    });
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
    process.exit(1);
  }
};
initializeConnectionFromDbToServer();

const convertPlayersObjToResponseObj = (playerObj) => {
  return {
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  };
};

const convertMatchObjToResponseObj = (matchObj) => {
  return {
    matchId: matchObj.match_id,
    match: matchObj.match,
    year: matchObj.year,
  };
};
//Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayersDetailsQuery = `
        SELECT
            *
        FROM
            player_details;`;
  const playersDetails = await database.all(getPlayersDetailsQuery);
  response.send(
    playersDetails.map((eachPlayer) =>
      convertPlayersObjToResponseObj(eachPlayer)
    )
  );
});

//Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
        *
    FROM
        player_details
    WHERE 
        player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayersObjToResponseObj(player));
});

//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};`;
  await database.run(updatePlayerDetailsQuery);
  response.send(`Player Details Updated`);
});

//Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
        *
    FROM 
        match_details
    WHERE 
        match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertMatchObjToResponseObj(match));
});

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetailsQuery = `
    SELECT
        *
    FROM 
        player_match_score
    NATURAL JOIN
        match_details
    WHERE
        player_id = ${playerId};`;
  const playerMatches = await database.all(getPlayerMatchDetailsQuery);
  response.send(
    playerMatches.map((eachMatch) => convertMatchObjToResponseObj(eachMatch))
  );
});

//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayersQuery = `
    SELECT 
        *
    FROM 
        player_match_score
    NATURAL JOIN
        player_details
    WHERE 
        match_id = ${matchId};`;
  const listOfPlayers = await database.all(getListOfPlayersQuery);
  response.send(
    listOfPlayers.map((eachPlayer) =>
      convertPlayersObjToResponseObj(eachPlayer)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerTotalScoreQuery = `
        SELECT 
            player_id AS playerId, 
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM 
            player_match_score
        NATURAL JOIN
            player_details
        WHERE
             player_id = ${playerId}`;
  const playerScoreDetails = await database.get(getPlayerTotalScoreQuery);
  response.send(playerScoreDetails);
});

module.exports = app;
