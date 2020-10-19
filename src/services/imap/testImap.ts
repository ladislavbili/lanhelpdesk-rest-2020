import { ImapFlow } from 'imapflow';
import pino from 'pino';
const silentLogger = pino();
silentLogger.level = 'silent';

//TODO REWRITE TO NEW IMAP
export async function testImap(Imap, imap = null) {
  if (Imap !== null) {
    await Imap.update({
      currentlyTested: true,
      errorMessage: null,
    });
    imap = Imap.get();
  }

  const imapFlow = new ImapFlow(
    {
      logger: silentLogger,
      host: imap.host,
      port: imap.port,
      auth: {
        user: imap.username,
        pass: imap.password,
      },
      secure: imap.tls,
      tls: { //remove before release
        rejectUnauthorized: imap.rejectUnauthorized
      }
    },
  );
  imapFlow.on('error', (error) => testOnError(error, Imap));
  try {
    await imapFlow.connect();
    Imap.update({
      currentlyTested: false,
      working: true,
      errorMessage: null
    });
  } catch (error) {
    return testOnError(error, Imap)
  }
}

function testOnError(error, Imap) {
  if (Imap !== null) {
    Imap.update({
      currentlyTested: false,
      working: false,
      errorMessage: error.message
    });
  }
  return { error: true, message: error.message };
}
