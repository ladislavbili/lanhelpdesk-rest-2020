import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import https from 'https';

import fs from 'fs';

import cors from 'cors';
import fileUpload from 'express-fileupload';
import corsOptions from './corsOptions';
import ApolloServer from './ApolloServer';
import {
  test,
  uploadAttachments,
  uploadProjectAttachments,
  getAttachments,
  refreshToken,
  sendComment,
  sendEmail,
  uploadRepeatTemplateAttachments,
  getLWFile,
  lwUploadTextImages,
  cmdbUploadScheme,
  cmdbUploadTextImages,
  getCMDBFile,
} from './rest';
import {
  useHttps,
  port
} from '@/configs/constants';
import {
  logWithDate
} from '@/helperFunctions';

var running: boolean = false;

export const startRest = () => {
  if (running) return;
  //Setup
  running = true;
  const server = ApolloServer;
  const app = express();
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(cors(corsOptions));
  app.use(fileUpload({
    createParentPath: true, preserveExtension: true, limits: { fileSize: 50 * 1024 * 1024 },
  }));
  server.applyMiddleware({ app, cors: false });

  //REST stuff
  test(app);
  uploadAttachments(app);
  uploadProjectAttachments(app);
  getAttachments(app);
  refreshToken(app);
  sendComment(app);
  sendEmail(app);
  uploadRepeatTemplateAttachments(app);
  getLWFile(app);
  lwUploadTextImages(app);
  cmdbUploadScheme(app);
  cmdbUploadTextImages(app);
  getCMDBFile(app);

  let httpServer = null;
  if (useHttps) {
    const credentials = {
      key: fs.readFileSync('./cert/privkey.pem', 'utf8'),
      cert: fs.readFileSync('./cert/cert.pem', 'utf8'),
      requestCert: false,
      rejectUnauthorized: false
    }
    httpServer = https.createServer(credentials, app);
  } else {
    httpServer = http.createServer(app);
  }
  server.installSubscriptionHandlers(httpServer);
  httpServer.listen({ port }, () => {
    logWithDate(`Now browse to ${useHttps ? 'https' : 'http'}://localhost:${port}${server.graphqlPath}`)
  });
}
