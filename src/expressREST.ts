import express from 'express';
import eGraphql from 'express-graphql';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from '@/graph/types';
import resolvers from '@/graph/resolvers';
import schemaDirectives from '@/graph/directives';
import { models } from '@/models';
import { verifyAccToken, verifyRefToken, createAccessToken, createRefreshToken } from '@/configs/jwt';
import jwt_decode from 'jwt-decode';
import cookieParser from 'cookie-parser';
import http from 'http';
import { randomString, checkIfHasProjectRights } from '@/helperFunctions';
import cors from 'cors';
import axios from 'axios';
import checkResolver from '@/graph/resolvers/checkResolver';
import multer from 'multer';
import fs from 'fs';
import fileUpload from 'express-fileupload';
import moment from 'moment';
import pathResolver from 'path';
const upload = multer();

const maxAge = 7 * 24 * 60 * 60 * 1000;

var running: boolean = false;
const port = 4000;
var whitelist = ['https://lanhelpdesk2019.lansystems.sk', 'http://lanhelpdesk2019.lansystems.sk', 'http://localhost:3000', 'http://test2020.lanhelpdesk.com']
var corsOptions = {
  origin: function(origin, callback) {
    callback(null, true)
    return;
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback('Not allowed by CORS', false)
    }
  },
  credentials: true
}


export const startRest = () => {
  if (running) return;
  running = true;
  const server = new ApolloServer({
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

  const app = express();
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(fileUpload({
    createParentPath: true, preserveExtension: true, limits: { fileSize: 50 * 1024 * 1024 },
  }));
  server.applyMiddleware({ app, cors: false });

  app.get('/', function(req, res) {
    res.end(JSON.stringify({ message: 'Teeest.' }));
  });

  app.post('/upload-attachments', async function(req, res) {
    const timestamp = moment().valueOf();

    const { token, taskId } = req.body;
    let files = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        files = req.files.file;
      } else {
        files = [req.files.file];
      }
    }

    if (!token || !files || !taskId || files.length === 0) {
      return res.send({ ok: false, error: 'Upload failed, either no files were send, taskId is missing or token is missing' })
    }
    let User = null;
    let Task = null;
    try {
      User = await checkResolver({ headers: { authorization: token } });
      const checkData = await checkIfHasProjectRights(User.get('id'), taskId, "write");
      Task = checkData.Task;
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }
    await Promise.all(files.map((file) => file.mv(`files/task-attachments/${taskId}/${timestamp}-${file.name}`)));

    await Promise.all(files.map((file) => Task.createTaskAttachment(
      {
        filename: file.name,
        mimetype: file.mimetype,
        encoding: file.encoding,
        path: `files/task-attachments/${taskId}/${timestamp}-${file.name}`,
      }
    )
    ))
    return res.send({ ok: true, error: null })
  });

  app.get('/get-attachments', async function(req, res) {
    if (!req.query) {
      return res.send({ ok: false, error: 'no parameters' })
    }
    let taskId = req.query.taskId;
    let path = req.query.path as string;
    if (!taskId || !path) {
      return res.send({ ok: false, error: 'One of parameters taskId or path missing' })
    }
    try {
      const User = await checkResolver(req);
      await checkIfHasProjectRights(User.get('id'), taskId);
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }

    res.sendFile(pathResolver.join(__dirname, `../${path}`));

  });


  app.post('/refresh_token', async (req, res) => {

    //get refresh token
    let refToken = req.cookies.jid;

    if (!refToken) {

      //res.cookie( 'jid', 'Invalid token', { httpOnly: true, expires: new Date() });
      return res.send({ ok: false, accessToken: '', error: 'no refresh token' })
    }
    let userData = null;
    //verify refresh token
    try {
      userData = await verifyRefToken(refToken, models.User);
    } catch (error) {
      //not valid refresh token
      userData = jwt_decode(refToken);
      if (userData.loginKey) {
        await models.Token.destroy({ where: { key: userData.loginKey } })
      }

      //res.cookie( 'jid', 'Invalid token', { httpOnly: true, expires: new Date() });
      return res.send({ ok: false, accessToken: '', error: 'not valid refresh token' })
    }

    const User = await models.User.findByPk(userData.id);
    //send new data
    const Token = await models.Token.findOne({ where: { key: userData.loginKey, UserId: userData.id } })
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Token.update({ expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, userData.loginKey),
      { httpOnly: true, maxAge }
    );
    res.send({ ok: true, accessToken: await createAccessToken(User, userData.loginKey) })
  })
  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);
  httpServer.listen({ port }, () => {
    console.log(`Now browse to http://localhost:${port}${server.graphqlPath}`)
  });
}
