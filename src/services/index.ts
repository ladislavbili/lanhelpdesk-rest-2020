import startRepeatTasks from './repeatTasks';
import { readEmails as startReadEmails } from './imap';
import { imaps, repeatTasks } from '@/configs/constants';

export default function startServices() {
  if (repeatTasks) {
    startRepeatTasks();
  }
  if (imaps) {
    startReadEmails();
  }
}
