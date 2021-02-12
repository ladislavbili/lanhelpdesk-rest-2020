import moment from 'moment';
import { createIncorrectDateError } from '@/configs/errors';

export const firstDateSameOrAfter = (date1, date2) => {
  let firstDate = null;
  if (date1 === 'now') {
    firstDate = moment();
  } else {
    firstDate = moment(date1);
  }
  let secondDate = null;
  if (date2 === 'now') {
    secondDate = moment();
  } else {
    secondDate = moment(date2);
  }
  return firstDate.unix() >= secondDate.unix();
}

export const taskCheckDate = (fromNow, filterFromDate, toNow, filterToDate, taskDate) => (
  (
    (fromNow && firstDateSameOrAfter('now', taskDate)) ||
    (!fromNow && (filterFromDate === null || firstDateSameOrAfter(taskDate, filterFromDate)))
  ) &&
  (
    (toNow && firstDateSameOrAfter(taskDate, 'now')) ||
    (!toNow && (filterToDate === null || firstDateSameOrAfter(filterToDate, taskDate)))
  )
)

export const extractDatesFromObject = (data, dates, controlDates = true, ignoreUndefined = true): any => {
  let result = {};
  dates.forEach((date) => {
    let newDate = data[date];
    if (newDate === undefined || newDate === null) {
      if (!ignoreUndefined && newDate === undefined) {
        result[date] = newDate;
      } else if (newDate === null) {
        result[date] = newDate;
      }
    } else {
      newDate = isNaN(parseInt(newDate)) ? moment(newDate).valueOf() : parseInt(newDate);
      if (controlDates && (isNaN(newDate) || newDate < 0)) {
        throw createIncorrectDateError(date, data[date], newDate);
      }
      result[date] = newDate;
    }
  })
  return result;
}

export const timestampToString = (timestamp) => {
  return moment(parseInt(timestamp)).format('HH:mm DD.MM.YYYY');
}

const multipliers = {
  day: 24 * 60,
  week: 7 * 24 * 60,
  month: 30 * 24 * 60,
}

export const getMinutes = (repeatEvery, repeatInterval) => {
  let multiplier = multipliers[repeatInterval];
  if (multiplier === undefined || repeatEvery === 0) {
    return multipliers.day;
  }
  return multiplier * repeatEvery;
}
