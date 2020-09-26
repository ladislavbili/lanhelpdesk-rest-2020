import startRepeatTasks from './repeatTasks';
import { readEmails as startReadEmails } from './imap';

export default function startServices() {
  startRepeatTasks();
  startReadEmails();
}
