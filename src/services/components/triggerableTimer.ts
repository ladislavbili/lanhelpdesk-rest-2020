import moment from 'moment';
import { models } from '@/models';
import { Op } from 'sequelize';

const minute = 60 * 1000;
const restingTime = 10 * minute;
/*
maxWaitingPeriod - time after which datetimer will reset
minWaitingPeriod - time that is acceptable to be directly watched
acceptableDelay - extra time difference that it might take for a message to come
*/
export default class TriggerableTimer {
  repeatId: any;
  repeatTimeId: any;
  alreadyTriggered: boolean;
  originalTrigger: any;
  triggersAt: any;
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
    this.repeatId = id;
    this.startAt = startAt;
    this.repeatEvery = repeatEvery * minute;
    this.triggerFunctions = triggerFunctions;

    this.maxWaitingPeriod = maxWaitingPeriod * minute;
    this.minWaitingPeriod = minWaitingPeriod * minute;
    this.acceptableDelay = acceptableDelay * minute;
    this.timeLeft = null;
    this.timeoutID = null;
    this.repeatTimeId = null;
    this.triggersAt = null;
    this.alreadyTriggered = false;
    this.originalTrigger = null;
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
    this.repeatTimeId = null;
    this.triggersAt = null;
    this.alreadyTriggered = false;
    this.originalTrigger = null;
    this.timeoutID = setTimeout(() => {
      this.timeoutID = null;
      this.restart();
    }, restingTime);
  }

  restart() {
    this.timeLeft = null;
    this.repeatTimeId = null;
    this.triggersAt = null;
    this.alreadyTriggered = false;
    this.originalTrigger = null;
    this.runTimeout();
  }

  async getRemainingTime() {
    let currentTime = moment().valueOf();
    if (this.repeatTimeId !== null) {
      return this.triggersAt - currentTime;
    }
    const remainingMiliseconds = this.getRemainingMiliseconds(currentTime);
    this.originalTrigger = currentTime + remainingMiliseconds;
    /*
    1. get RepeatTime thats closest to current time and wasnt done already and is before this trigger - do it
    2. if you cant find one, find the one for this time, if it exists, dont do this trigger - add but set to alreadyTriggered
    3. if this is the closest trigger without redirect, do it
    */

    // 1. get
    let RepeatTime = await models.RepeatTime.findOne({
      where: {
        RepeatId: this.repeatId,
        triggered: false,
        triggersAt: {
          [Op.between]: [currentTime, currentTime + remainingMiliseconds],
        }
      },
      order: [['triggersAt', 'ASC']],
    });

    if (RepeatTime === null) {
      // 2. get
      RepeatTime = await models.RepeatTime.findOne({
        where: {
          originalTrigger: currentTime + remainingMiliseconds,
          RepeatId: this.repeatId,
        }
      });
      //2. resolve
      if (RepeatTime) {
        this.alreadyTriggered = true;
      } else {
        this.alreadyTriggered = false;
      }
    } else {
      // 1. resolve
      //console.log('resolve 1', RepeatTime.get('originalTrigger').valueOf() === currentTime + remainingMiliseconds);
      this.alreadyTriggered = false;
      this.repeatTimeId = RepeatTime.get('id');
      this.triggersAt = (<number>RepeatTime.get('triggersAt').valueOf());
      return this.triggersAt - currentTime;
    }

    // 3. resolve
    return remainingMiliseconds;
  }

  getRemainingMiliseconds(currentTime) {
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
  async runTimeout() {
    if (this.timeLeft === null) {
      this.timeLeft = await this.getRemainingTime();
    }

    if (this.alreadyTriggered) {
      console.log(`waiting time ${this.timeLeft / minute} minutes.`);
    } else {
      console.log(`remaining time ${this.timeLeft / minute} minutes.`);
    }

    let timer = this.getWaitTime();
    this.timeoutID = setTimeout(async () => {
      let newTimeLeft = await this.getRemainingTime();
      //ak sa ma triggernut alebo delay sposobil ze timer je prekroceny, alebo je timer nepodstatny
      if (timer.shouldTrigger || newTimeLeft >= this.timeLeft) {
        if (this.alreadyTriggered) {
          this.triggerFunctions.forEach((func) => func(this.repeatTimeId, this.originalTrigger));
        }
        this.restartAfterTimeout();
      } else {
        this.timeLeft = newTimeLeft;
        this.runTimeout();
      }
    }, timer.timeout);
  }
}
