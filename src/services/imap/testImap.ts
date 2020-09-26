import simpleImap from 'imap-simple';

export async function testImap(Imap, imap = null) {
  if (Imap !== null) {
    await Imap.update({
      currentlyTested: true,
      errorMessage: null,
    });
    imap = Imap.get();
  }

  await simpleImap.connect({
    imap: {
      user: imap.username,
      password: imap.password,
      host: imap.host,
      port: imap.port,
      tls: imap.tls,
      tlsOptions: {
        rejectUnauthorized: imap.rejectUnauthorized
      },
      authTimeout: 18000
    },
  }).then(async (connection) => {
    if (Imap !== null) {
      await Imap.update({
        currentlyTested: false,
        working: true,
      });
    }
    connection.end();
    return { error: false, message: null };
  }).catch(async (error) => {
    if (Imap !== null) {
      await Imap.update({
        currentlyTested: false,
        working: false,
        errorMessage: error.message
      });
    }
    return { error: true, message: error.message };
  })
}
