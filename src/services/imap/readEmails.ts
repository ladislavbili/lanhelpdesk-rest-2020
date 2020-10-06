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
  models.Imap.findAll({ where: { active: true } }).then((imapResponse) => {
    console.log('Loaded imaps', imapResponse.length);
    imapResponse.forEach((imap) => addImap(imap));
  });
}

function addImap(Imap) {
  const imapData = new ImapData(
    Imap,
    //onError
    function(error) {
      console.log('error imap');
      Imap.update({
        currentlyTested: false,
        working: false,
        errorMessage: error.message
      });
      this.stopped = true;
      this.imapFlow = null;
      if (!this.reconnectTried) {
        this.reconnectTried = true;
        this.start();
      } else {
        imaps = imaps.filter((existingImap) => existingImap.id !== this.id);
      }
    },
    //onClose
    function(...args) {
      if (!this.stopped) {
        this.stop();
        this.start();
      }
    },
    //imap works
    function() {
      //console.log('imap works');
      this.reconnectTried = false;
      Imap.update({
        currentlyTested: false,
        working: true,
        errorMessage: null,
      });
    },
    //mailboxClose
    function() {
    },
  );
  //console.log(imapData.getData());
  imaps.push(imapData);
}

async function updateImap(Imap) {
  if (!Imap.get('active')) {
    deleteImap(Imap.get('id'));
    return;
  }
  const imapData = imaps.find((existingImap) => existingImap.id === Imap.get('id'));
  if (imapData) {
    imapData.stop();
    imapData.set(Imap);
    imapData.start();
  } else {
    addImap(Imap);
  }
}

async function deleteImap(id) {
  const imapData = imaps.find((existingImap) => existingImap.id === id);
  if (imapData) {
    imapData.stop()
  }
  imaps = imaps.filter((existingImap) => existingImap.id !== id);
}
