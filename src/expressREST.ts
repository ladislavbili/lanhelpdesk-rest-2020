import express from 'express';
import eGraphql from 'express-graphql';
import { models } from 'models';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from 'graph/types';
import resolvers from 'graph/resolvers';
import { verifyAccToken, verifyRefToken, createAccessToken, createRefreshToken } from 'configs/jwt';
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
    context: async ({ req, res }) => {
      let userData = null;
      const authentification = req.headers.authentification as String;
      if( authentification ){
        try{
          const token = authentification.split(" ")[1];
          userData = await verifyAccToken( token, models.User );
        }catch(error){
          //not authentificated
        }
      }
      return ({
        req,
        res,
        models,
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
