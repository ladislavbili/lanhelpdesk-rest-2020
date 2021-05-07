import pino from 'pino';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { splitArrayByFilter } from '@/helperFunctions';
import saveEmailOrCreateTask from './saveEmailOrCreateTask';
const silentLogger = pino();
silentLogger.level = 'silent';

export default class ImapData {
  Imap: any;
  id: number;
  user: string;
  pass: string;
  host: string;
  port: number;
  tls: boolean;
  rejectUnauthorized: boolean;

  destination: string;
  ignoredRecievers: string;
  ignoredRecieversDestination: string;
  stopped: boolean;
  imapFlow: any;
  reconnectTried: boolean;

  onError: any;
  onClose: any;
  imapWorks: any;
  mailboxClose: any;

  constructor(
    Imap,
    onError,
    onClose,
    imapWorks,
    mailboxClose,
  ) {
    const imap = Imap.get();
    this.Imap = Imap;
    this.id = imap.id;
    this.user = imap.username;
    this.pass = imap.password;
    this.host = imap.host;
    this.port = imap.port;
    this.tls = imap.tls;
    this.rejectUnauthorized = imap.rejectUnauthorized;
    this.destination = imap.destination;
    this.ignoredRecievers = imap.ignoredRecievers;
    this.ignoredRecieversDestination = imap.ignoredRecieversDestination;
    this.stopped = true;
    this.imapFlow = null;
    this.reconnectTried = false;

    this.onError = onError.bind(this);
    this.onClose = onClose.bind(this);
    this.imapWorks = imapWorks.bind(this);
    this.mailboxClose = mailboxClose.bind(this);
    this.start();
  }

  set(Imap = null) {
    if (Imap !== null) {
      const imap = Imap.get();
      this.Imap = Imap;
      this.user = imap.username;
      this.pass = imap.password;
      this.host = imap.host;
      this.port = imap.port;
      this.tls = imap.tls;
      this.rejectUnauthorized = imap.rejectUnauthorized;
      this.destination = imap.destination;
      this.ignoredRecievers = imap.ignoredRecievers;
      this.ignoredRecieversDestination = imap.ignoredRecieversDestination;
    }
  }

  getData(filtered = true) {
    return ({
      id: this.id,
      user: this.user,
      pass: this.pass,
      host: this.host,
      port: this.port,
      tls: this.tls,
      rejectUnauthorized: this.rejectUnauthorized,
      destination: this.destination,
      ignoredRecievers: this.ignoredRecievers,
      ignoredRecieversDestination: this.ignoredRecieversDestination,
      stopped: this.stopped,
      imapFlow: filtered ? null : this.imapFlow,
    })
  }

  async start() {
    if (!this.stopped) {
      this.stop();
    }

    this.imapFlow = new ImapFlow(
      {
        logger: silentLogger,
        host: this.host,
        port: this.port,
        auth: {
          user: this.user,
          pass: this.pass,
        },
        secure: this.tls,
        tls: { //remove before release
          rejectUnauthorized: this.rejectUnauthorized
        }
      },
    );
    this.imapFlow.on('error', this.onError);
    this.imapFlow.on('close', this.onClose);
    //this.imapFlow.on('mailboxOpen', this.mailboxOpen);
    //this.imapFlow.on('mailboxClose', this.mailboxClose);
    this.imapFlow.on('exists', data => {
      console.log(`${data.count} messages in ${this.host}`);
      this.processEmails();
    });
    this.preparationChecks();
  }

  preparationChecks() {
    this.imapFlow.connect().then(() => {
      this.imapWorks();
      this.checkAndCreateDestination();
    }).catch(this.onError)
  }

  checkAndCreateDestination() {
    this.imapFlow.mailboxOpen(this.destination).then(() => {
      this.imapFlow.mailboxClose();
      this.checkAndCreateServiceDestination();
    }).catch(() => {
      this.imapFlow.mailboxCreate(this.destination).then(() => {
        this.checkAndCreateServiceDestination();
      }).catch(this.onError);
    })
  };

  checkAndCreateServiceDestination() {
    this.imapFlow.mailboxOpen(this.ignoredRecieversDestination).then(() => {
      this.imapFlow.mailboxClose();
      this.imapFlow.mailboxOpen('INBOX').then(() => {
        this.processEmails();
      }).catch(this.onError);
    }).catch(() => {
      this.imapFlow.mailboxCreate(this.ignoredRecieversDestination).then(() => {
        this.imapFlow.mailboxOpen('INBOX').then(() => {
          this.processEmails();
        }).catch(this.onError);
      }).catch(this.onError);
    })
  }

  async processEmails() {
    const ignoredRecievers = this.ignoredRecievers.split(' ');
    let messages = [];
    for await (
      let msg of this.imapFlow.fetch(
        '1:*',
        {
          uid: true,
          envelope: true,
          source: true,
        }
      )
    ) {
      messages.push(msg);
    }

    const [serviceMessages, otherMessages] = splitArrayByFilter(messages, (message) => message.envelope.from.some((email) => ignoredRecievers.includes(email.address)));
    if (serviceMessages.length > 0) {
      this.imapFlow.messageMove(serviceMessages.map((message) => message.uid), this.ignoredRecieversDestination, { uid: true })
    }

    if (otherMessages.length > 0) {
      let messagesData = <any[]>await Promise.all(otherMessages.map((message) => simpleParser(message.source, {})));
      messagesData.forEach((messageData) => {
        saveEmailOrCreateTask({
          from: messageData.from.value,
          subject: messageData.subject,
          text: messageData.text,
          html: messageData.html ? messageData.html : messageData.textAsHtml,
          attachments: messageData.attachments
        }, this.Imap);
        this.imapFlow.messageMove(otherMessages.map((message) => message.uid), this.destination, { uid: true })
      });
    }
  }

  stop() {
    if (this.imapFlow && !this.stopped) {
      this.imapFlow.logout()
      this.imapFlow = null;
      this.stopped = true;
    }
  }
}
