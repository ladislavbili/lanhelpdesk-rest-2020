import events from 'events';

export default class EventfulStorage {
  constructor() {
    this.emmiter = new events.EventEmitter()
  }

}
