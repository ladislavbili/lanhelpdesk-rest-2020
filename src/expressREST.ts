import express from 'express';
import eGraphql from 'express-graphql';
import { models } from 'models';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from 'graph/types';
import resolvers from 'graph/resolvers';


var running:boolean = false;
const port = 3100;

export const startRest = () => {
  if(running) return;
  running = true;
  const server = new ApolloServer({ typeDefs, resolvers, context: { models } });

  const app = express();
  server.applyMiddleware({ app });

  app.listen({ port }, () => console.log(`Now browse to http://localhost:${port}${server.graphqlPath}`) );
}
