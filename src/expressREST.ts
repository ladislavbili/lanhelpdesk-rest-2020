import express from 'express';
import eGraphql from 'express-graphql';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from 'graph/types';
import resolvers from 'graph/resolvers';
import schemaDirectives from 'graph/directives';
import { models } from 'models';
import { verifyAccToken, verifyRefToken, createAccessToken, createRefreshToken } from 'configs/jwt';
import jwt_decode from 'jwt-decode';
import cookieParser from 'cookie-parser';
import { randomString } from 'helperFunctions';

import axios from 'axios';

var running:boolean = false;
const port = 3100;

export const startRest = () => {
  if(running) return;
  running = true;
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives,
    context: async ({ req, res }) => {
      let userData = null;
      const authorization = req.headers.authorization as String;
      if( authorization ){
        try{
          userData = await jwt_decode( authorization.replace('Bearer ','') );
        }catch(error){
          //not authentificated
        }
      }
      return ({
        req,
        res,
        userData
      })
    },
    formatError: (err) => {
      //manipulate errors here
      return err;
    },
  });

  const app = express();
  app.use(cookieParser());
  server.applyMiddleware({ app });

  app.post('/refresh_token', async ( req, res ) => {
    const refToken = req.cookies.jid;
    if( !refToken ){
      return res.send({ ok: false, accessToken: '' })
    }
    let userID = null;
    try{
      userID = (await verifyRefToken( refToken, models.User )).id;
    }catch(error){
      //not valid refresh token
      return res.send({ ok: false, accessToken: '' })
    }
    const user = await models.User.findByPk(userID);
    let loginKey = randomString();
    res.cookie(
      'jid',
      await createRefreshToken(user, loginKey),
      { httpOnly: true }
    );
    res.send({ ok: true, accessToken: await createAccessToken(user, loginKey) })
  })

  app.listen({ port }, () =>{
    console.log(`Now browse to http://localhost:${port}${server.graphqlPath}`)
    /*
    axios.request({
    url: `http://localhost:${port}/refresh_token`,
    method: 'post',
    headers: {
    Cookie: "jid=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNTkzNzc5NTAxLCJleHAiOjE1OTQzODQzMDF9.zRK-ZXIgo7EwO71-Dl8125je2yGF42oknHpvgCsV2hU"
  }
}).then((response)=> console.log(response))
*/
});
}
