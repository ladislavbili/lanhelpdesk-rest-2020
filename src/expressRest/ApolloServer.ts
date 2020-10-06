import { ApolloServer } from 'apollo-server-express';
import typeDefs from '@/graph/types';
import resolvers from '@/graph/resolvers';
import schemaDirectives from '@/graph/directives';
import checkResolver from '@/graph/resolvers/checkResolver';
import jwt_decode from 'jwt-decode';

export default new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives,
  subscriptions: {
    onConnect: async (connectionParams, webSocket) => {
      await checkResolver({ headers: connectionParams });
      return { headers: connectionParams };
    },
  },
  context: async ({ req, res, connection }) => {
    let userID = null;
    if (connection) {
      try {
        const authorization = connection.context.headers.authorization as String;
        userID = await jwt_decode(authorization.replace('Bearer ', '')).id;
      } catch (error) {
        //not authentificated
      }

      return {
        req,
        res,
        userID
      }
    }
    const authorization = req.headers.authorization as String;
    if (authorization) {
      try {
        userID = await jwt_decode(authorization.replace('Bearer ', '')).id;
      } catch (error) {
        //not authentificated
      }
    }
    return ({
      req,
      res,
      userID
    })
  },
  formatError: (err) => {
    //manipulate errors here
    return err;
  },
});
