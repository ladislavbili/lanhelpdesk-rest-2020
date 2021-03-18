import moment from 'moment';
const minute = 60 * 1000;
const restingTime = 10 * minute;
/*
maxWaitingPeriod - time after which datetimer will reset
minWaitingPeriod - time that is acceptable to be directly watched
acceptableDelay - extra time difference that it might take for a message to come
*/
export default class TriggerableTimer {
  id: any;
  startAt: number;
  repeatEvery: number;
  triggerFunctions: any[];

  maxWaitingPeriod: number;
  minWaitingPeriod: number;
  acceptableDelay: number;
  timeLeft: number;
  timeoutID: any;
  removeFunction: any;

  constructor(id, startAt, repeatEvery, triggerFunctions, maxWaitingPeriod = 30, minWaitingPeriod = 1, acceptableDelay = 0) {
    this.id = id;
    this.startAt = startAt;
    this.repeatEvery = repeatEvery * minute;
    this.triggerFunctions = triggerFunctions;

    this.maxWaitingPeriod = maxWaitingPeriod * minute;
    this.minWaitingPeriod = minWaitingPeriod * minute;
    this.acceptableDelay = acceptableDelay * minute;
    this.timeLeft = null;
    this.timeoutID = null;
    this.removeFunction = () => { };
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

  restartAfterTimeout() {
    this.timeoutID = null;
    //console.log(`Resting for ${restingTime / minute} minutes.`);

    this.timeoutID = setTimeout(() => {
      this.timeoutID = null;
      this.restart();
    }, restingTime);
  }

  restart() {
    this.timeLeft = null;
    this.runTimeout();
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
    //if remaining time is bigger than maxWaitingPeriod
    if (this.timeLeft > this.maxWaitingPeriod) {
      return { timeout: this.maxWaitingPeriod, shouldTrigger: false };
    }
    //if remaining time is smaller than minimum time, trigger it
    if (this.timeLeft < this.minWaitingPeriod) {
      return { timeout: this.timeLeft, shouldTrigger: true };
    }
    //otherwise return half of the current waiting time
    return { timeout: ~~(this.timeLeft / 2), shouldTrigger: false };
  }
  //ak novy timeleft je vacsi ako predosly, trigger
  runTimeout() {
    if (this.timeLeft === null) {
      this.timeLeft = this.getRemainingTime();
    }
    console.log(`remaining time ${this.timeLeft / minute} minutes.`);

    let timer = this.getWaitTime();
    this.timeoutID = setTimeout(() => {
      let newTimeLeft = this.getRemainingTime();
      //ak sa ma triggernut alebo delay sposobil ze timer je prekroceny, alebo je timer nepodstatny
      if (timer.shouldTrigger || newTimeLeft >= this.timeLeft) {
        this.triggerFunctions.forEach((func) => func());
        this.restartAfterTimeout();
      } else {
        this.timeLeft = newTimeLeft;
        this.runTimeout();
      }
    }, timer.timeout);
  }
}
