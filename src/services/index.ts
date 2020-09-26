import startRepeatTasks from './repeatTasks';
import startReadEmails from './imap/readEmails';

export default function startServices() {
  startRepeatTasks();
  startReadEmails();
}
