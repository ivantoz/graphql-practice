const { nodeEnv } = require('./util');
console.log(`Running in ${nodeEnv} mode...`);

const DataLoader = require('dataloader');

const pg = require('pg');
const pgConfig = require('../config/pg')[nodeEnv];
const pgPool = new pg.Pool(pgConfig);
const pgdb = require('../database/pgdb')(pgPool);

const app = require('express')();

const ncSchema = require('../schema');
const graphqlHTTP = require('express-graphql');

const { MongoClient, Logger } = require('mongodb');
const assert = require('assert');
const mConfig = require('../config/mongo')[nodeEnv];

MongoClient.connect(mConfig.url, (err, mPool) => {
  assert.equal(err, null);

  Logger.setLevel('debug');
  Logger.filter('class', ['Server']);

  const mdb = require('../database/mdb')(mPool);


  app.use('/graphql', (req, res) => {
    const loaders = {
      usersByIds: new DataLoader(pgdb.getUsersByIds),
      usersByApiKeys: new DataLoader(pgdb.getUsersByApiKeys),
      namesForContestIds: new DataLoader(pgdb.getNamesForContestIds),
      contestsForUserIds: new DataLoader(pgdb.getContestsForUserIds),
      totalVotesByNameIds: new DataLoader(pgdb.getTotalVotesByNameIds),
      activitiesForUserIds: new DataLoader(pgdb.getActivitiesForUserIds),
      mdb: {
        usersByIds: new DataLoader(mdb.getUsersById)
      }

    };
    graphqlHTTP({
      schema: ncSchema,
      graphiql: true,
      context: {pgPool, mPool, loaders}
    })(req, res);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
