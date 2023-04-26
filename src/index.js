const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 8080;

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
const { connection } = require("./connector");

app.get("/totalRecovered", async (req, res) => {
  const totalRecovered = data
    .map((recover) => recover.recovered)
    .reduce((acc, count) => acc + count, 0);
  const response = { data: { _id: "total", totalRecovered: totalRecovered } };
  res.status(200).send(response);
});

app.get("/totalActive", (req, res) => {
  const totalActive = data
    .map((active) => active.infected)
    .reduce((acc, count) => acc + count, 0);
  console.log(`Total number of infected patients: ${totalActive}`);

  const response = { data: { _id: "total", activeCases: totalActive } };
  res.status(200).send(response);
});
app.get("/totalDeath", (req, res) => {
  const totalDeath = data
    .map((active) => active.death)
    .reduce((acc, count) => acc + count, 0);
  console.log(`Total number of death patients: ${totalDeath}`);

  const response = { data: { _id: "total", totalDeath: totalDeath } };
  res.status(200).send(response);
});

app.get("/hotspotStates", async (req, res) => {
  const result = await connection.aggregate([
    {
      $addFields: {
        rate: {
          $round: [
            {
              $divide: [
                { $subtract: ["$infected", "$recovered"] },
                "$infected",
              ],
            },
            5,
          ],
        },
      },
    },
    { $match: { rate: { $gt: 0.1 } } },
    { $project: { _id: 0, state: 1, rate: 1 } },
  ]);
  res.json({ data: result });
});
app.get("/healthyStates", async (req, res) => {
  const result = await connection.aggregate([
    {
      $addFields: {
        mortality: { $round: [{ $divide: ["$death", "$infected"] }, 5] },
      },
    },
    { $match: { mortality: { $lt: 0.005 } } },
    { $project: { _id: 0, state: 1, mortality: 1 } },
  ]);
  res.json({ data: result });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports = app;
