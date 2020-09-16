import events from 'events';

export default class EventfulStorage {
  emitter: any;
  constructor() {
    this.emitter = new events.EventEmitter()
  }

}
