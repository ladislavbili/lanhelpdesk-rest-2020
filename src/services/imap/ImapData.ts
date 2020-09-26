export default class ImapData {
  id: number;
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  rejectUnauthorized: boolean;
  connection: any;

  constructor(imap, connection) {
    this.id = imap.id;
    this.user = imap.user;
    this.password = imap.password;
    this.host = imap.host;
    this.port = imap.port;
    this.tls = imap.tls;
    this.rejectUnauthorized = imap.rejectUnauthorized;
    this.connection = connection;
  }

  set(imap = null, connection = null) {
    if (imap !== null) {
      this.user = imap.user;
      this.password = imap.password;
      this.host = imap.host;
      this.port = imap.port;
      this.tls = imap.tls;
      this.rejectUnauthorized = imap.rejectUnauthorized;
    }
    this.connection = connection;
  }

  stop() {
    if (this.connection) {
      this.connection.end()
      this.connection = null;
    }
  }
}
