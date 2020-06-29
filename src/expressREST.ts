import express from 'express';
import eGraphql from 'express-graphql';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from 'graph/types';
import { resolvers } from 'graph/resolvers';

var running:boolean = false;

export const startRest = () => {
  if(running) return;
  running = true;
  const server = new ApolloServer({ typeDefs, resolvers });

  const app = express();
  server.applyMiddleware({ app });

  app.listen({ port: 3100 }, () => console.log('Now browse to http://localhost:3100' + server.graphqlPath) );
}
