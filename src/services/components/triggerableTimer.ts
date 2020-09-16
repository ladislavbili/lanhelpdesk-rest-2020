import moment from 'moment';
const minute = 60 * 1000;

/*
maxWaitingPeriod - time after which datetimer will reset
minWaitingPeriod - time that is acceptable to be directly watched
acceptableDelay - extra time difference that it might take for a message to come
*/
export default class TriggerableTimer {
  maxWaitingPeriod: number;
  minWaitingPeriod: number;
  acceptableDelay: number;
  triggerFunctions: any[];
  timeLeft: number;
  startAt: number;
  repeatEvery: number;
  id: any;
  timeoutID: any;
  removeFunction: any;
  constructor(startAt, repeatEvery, triggerFunctions, removeFunction, id = null, maxWaitingPeriod = 30, minWaitingPeriod = 1, acceptableDelay = 0) {
    this.maxWaitingPeriod = maxWaitingPeriod * minute;
    this.minWaitingPeriod = minWaitingPeriod * minute;
    this.acceptableDelay = acceptableDelay * minute;
    this.triggerFunctions = triggerFunctions;
    this.timeLeft = null;
    this.startAt = startAt;
    this.repeatEvery = repeatEvery * minute;
    this.id = id;
    this.timeoutID = null;
    this.removeFunction = removeFunction;
    this.runTimeout();
  }

  stopTimer() {
    if (this.timeoutID !== null) {
      clearTimeout(this.timeoutID)
    }
  }

  setTimer(startAt, repeatEvery, triggerFunctions = null, removeFunction = null, maxWaitingPeriod = null, minWaitingPeriod = null, acceptableDelay = null) {
    this.startAt = startAt;
    this.repeatEvery = repeatEvery * minute;
    if (triggerFunctions !== null) {
      this.triggerFunctions = triggerFunctions;
    }
    if (removeFunction !== null) {
      this.removeFunction = removeFunction;
    }
    if (maxWaitingPeriod !== null) {
      this.maxWaitingPeriod = maxWaitingPeriod;
    }
    if (minWaitingPeriod !== null) {
      this.minWaitingPeriod = minWaitingPeriod;
    }
    if (acceptableDelay !== null) {
      this.acceptableDelay = acceptableDelay;
    }
  }

  getRemainingTime() {
    let currentTime = moment().valueOf();
    if (currentTime > this.startAt) {
      return this.repeatEvery - (
        (currentTime - this.startAt) % this.repeatEvery
      );
    }
    return this.startAt - currentTime;
  }

  getWaitTime() {
    //if its bigger than maxWaitingPeriod
    if (~~(this.timeLeft / this.maxWaitingPeriod) > 1) {
      return { timeout: this.maxWaitingPeriod, shouldTrigger: false };
    }
    //if remaining time is smaller than minimum time, trigger it
    if (this.timeLeft < this.minWaitingPeriod) {
      return { timeout: this.timeLeft, shouldTrigger: true };
    }
    //otherwise return half of the current waiting time
    return { timeout: ~~(this.timeLeft / 2) + 10, shouldTrigger: false };
  }

  restart() {
    this.timeLeft = null;
    this.runTimeout();
  }

  runTimeout() {
    if (this.timeLeft === null) {
      this.timeLeft = this.getRemainingTime();
    }
    console.log('remaining time', this.timeLeft / minute);

    let timer = this.getWaitTime();
    this.timeoutID = setTimeout(() => {
      let newTimeLeft = this.getRemainingTime();
      //ak sa ma triggernut alebo delay sposobil ze timer je prekroceny, alebo je timer nepodstatny
      if (timer.shouldTrigger || newTimeLeft >= this.timeLeft) {
        this.triggerFunctions.forEach((func) => func());
        this.removeFunction();
      } else {
        this.timeLeft = newTimeLeft;
        this.runTimeout();
      }
    }, timer.timeout);
  }
}
