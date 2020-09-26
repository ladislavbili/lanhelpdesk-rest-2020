import simpleImap from 'imap-simple';
import { simpleParser } from 'mailparser';
import ImapData from './ImapData';
import lodash from 'lodash';
import events from 'events';
import { models } from '@/models';
import saveEmailOrCreateTask from './saveEmailOrCreateTask';

export const imapEvent = new events.EventEmitter();

let imaps = [];
export function readEmails() {
  imapEvent.on('add', addImap);
  imapEvent.on('update', updateImap);
  imapEvent.on('delete', deleteImap);
  models.Imap.findAll().then((imapResponse) => {
    console.log('imaps', imapResponse.length);
    imapResponse.forEach((imap) => addImap(imap));
  });
}

function addImap(Imap) {
  console.log('adding imap');
  const imap = Imap.get();
  simpleImap.connect({
    imap: {
      user: imap.username,
      password: imap.password,
      host: imap.host,
      port: imap.port,
      tls: imap.tls,
      tlsOptions: { //remove before release
        rejectUnauthorized: imap.rejectUnauthorized
      },
      authTimeout: 18000
    },
    onmail: (numNewMail) => {
      getMails(Imap);
    }
  }).then((connection) => {
    if (!imap.working) {
      Imap.update({
        currentlyTested: false,
        working: true,
        errorMessage: null,
      });
    }
    imaps.push(new ImapData(imap, connection));
    connection.openBox('INBOX');
  }).catch((error) => {
    Imap.update({
      currentlyTested: false,
      working: false,
      errorMessage: error.message
    });
  })
}

async function updateImap(Imap) {
  console.log('updating imap');
  deleteImap(Imap.get('id'));
  addImap(Imap);
}

async function deleteImap(id) {
  console.log('deleting imap');
  const imapData = imaps.find((existingImap) => existingImap.id === id);
  if (imapData) {
    imapData.stop()
  }
  imaps = imaps.filter((existingImap) => existingImap.id !== id);
}

function getMails(Imap) {
  const imap = Imap.get();
  const ignoredRecievers = imap.ignoredRecievers.split(' ');
  simpleImap.connect({
    imap: {
      user: imap.username,
      password: imap.password,
      host: imap.host,
      port: imap.port,
      tls: imap.tls,
      tlsOptions: {
        rejectUnauthorized: imap.rejectUnauthorized
      },
      authTimeout: 9000
    }
  }).then((connection) => {
    connection.openBox('INBOX').then((err, boxname) => {
      const searchCriteria = ["ALL"];
      const fetchOptions = { bodies: [''] };
      // retrieve only the headers of the messages
      return connection.search(searchCriteria, fetchOptions);
    }).then((messages) => {
      if (messages.length === 0) {
        connection.end();
      }
      let finished = 0;
      console.log(`we have ${messages.length} new message`);

      messages.map((message) => {
        const all = lodash.find(message.parts, { "which": "" });
        const id = message.attributes.uid;
        const idHeader = "Imap-Id: " + id + "\r\n";
        simpleParser(idHeader + all.body, {})
          .then(parsed => {
            if (parsed.from.value.some((from) => ignoredRecievers.includes(from.address))) {
              connection.moveMessage(message.attributes.uid, imap.ignoredRecieversDestination, (e) => {
                finished++;
                if (finished === messages.length) {
                  connection.end();
                }
              })
            } else {
              saveEmailOrCreateTask(
                {
                  from: parsed.from.value,
                  subject: parsed.subject,
                  text: parsed.text,
                  html: parsed.html ? parsed.html : parsed.textAsHtml,
                  attachments: parsed.attachments
                },
                Imap
              )
              connection.moveMessage(message.attributes.uid, imap.destination, (e) => {
                finished++;
                if (finished === messages.length) {
                  connection.end();
                }
                //console.log('Moved');
              })
            }
          })
          .catch(err => {
          });
      })
    })
  })
}
