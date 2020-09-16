import { Op } from 'sequelize';
import { createDoesNoExistsError, InsufficientProjectAccessError, createIncorrectDateError } from '@/configs/errors';
import { ProjectRightInstance } from '@/models/instances';
import moment from 'moment';
import { models } from '@/models';

export const randomString = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const flattenObject = (object, prefix = '') => {
  let newObject = {};
  Object.keys(object).map((firstKey) => {
    Object.keys(object[firstKey]).map((secondKey) => {
      newObject[`${prefix}${prefix === '' ? firstKey : capitalizeFirstLetter(firstKey)}${capitalizeFirstLetter(secondKey)}`] = object[firstKey][secondKey];
    })
  })
  return newObject;
}

export const splitArrayByFilter = (array, filter) => {
  return array.reduce(([p, f], e) => (filter(e) ? [[...p, e], f] : [p, [...f, e]]), [[], []]);
}

export const capitalizeFirstLetter = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const logFunctionsOfModel = (model) => {
  Object.keys(model.associations).forEach((assoc) => {
    Object.keys(model.associations[assoc].accessors).forEach((accessor) => {
      console.log(model.name + '.' + model.associations[assoc].accessors[accessor] + '()');
    })
  })
}

export const idDoesExists = async (id: number, model) => {
  return (await model.findByPk(id) !== null);
}

export const multipleIdDoesExists = async (pairs) => {
  let promises = pairs.map((pair) => pair.model.findByPk(pair.id));
  let responses = await Promise.all(promises);
  return responses.some((response) => response === null);
}

export const idsDoExists = async (ids: number[], model) => {
  const count = await model.count({
    where: {
      id: ids
    },
  });
  return count === ids.length
}

export const idDoesExistsCheck = async (id: number, model) => {
  if (await model.findByPk(id) === null) {
    throw createDoesNoExistsError(model.name, id);
  }
}

export const multipleIdDoesExistsCheck = async (pairs) => {
  const promises = pairs.map((pair) => pair.model.findByPk(pair.id));
  const responses = await Promise.all(promises);
  if (responses.some((response) => response === null)) {
    const failedPairs = pairs.filter((pair, index) => responses[index] === null);
    throw createDoesNoExistsError(failedPairs.map((pair) => `${pair.model.name} - id:${pair.id}`).toString());
  }
}

export const idsDoExistsCheck = async (ids: number[], model) => {
  const responses = await Promise.all(ids.map((id) => model.findByPk(id)))
  if (responses.some((response) => response === null)) {
    const failedIds = ids.filter((id, index) => responses[index] === null);
    throw createDoesNoExistsError(model.name, failedIds);
  }
}

export const addApolloError = (source, error, userId = null, sourceId = null) => {
  return models.ErrorMessage.create({
    errorMessage: error.message,
    source,
    sourceId,
    type: error.extensions.code,
    userId
  })
}

export const checkIfHasProjectRights = async (userId, taskId, right = 'read') => {
  const User = await models.User.findByPk(userId, { include: [{ model: models.ProjectRight }] })
  const Task = await models.Task.findByPk(taskId);
  if (Task === null) {
    throw createDoesNoExistsError('Task', taskId);
  }
  const ProjectRight = (<ProjectRightInstance[]>User.get('ProjectRights')).find((ProjectRight) => ProjectRight.get('ProjectId') === Task.get('ProjectId'));
  if (ProjectRight !== undefined) {
  }
  if (ProjectRight === undefined || !ProjectRight.get(right)) {
    throw InsufficientProjectAccessError;
  }

  return { ProjectRight, Task, internal: ProjectRight.get('internal') };
}

export const filterObjectToFilter = (Filter) => ({
  assignedToCur: Filter.assignedToCur,
  assignedTo: Filter.assignedTo === null ? null : Filter.assignedTo.get('id'),
  requesterCur: Filter.requesterCur,
  requester: Filter.requester === null ? null : Filter.requester.get('id'),
  companyCur: Filter.companyCur,
  company: Filter.company === null ? null : Filter.company.get('id'),
  taskType: Filter.taskType === null ? null : Filter.taskType.get('id'),
  oneOf: Filter.oneOf,

  statusDateFrom: Filter.statusDateFrom,
  statusDateFromNow: Filter.statusDateFromNow,
  statusDateTo: Filter.statusDateTo,
  statusDateToNow: Filter.statusDateToNow,
  pendingDateFrom: Filter.pendingDateFrom,
  pendingDateFromNow: Filter.pendingDateFromNow,
  pendingDateTo: Filter.pendingDateTo,
  pendingDateToNow: Filter.pendingDateToNow,
  closeDateFrom: Filter.closeDateFrom,
  closeDateFromNow: Filter.closeDateFromNow,
  closeDateTo: Filter.closeDateTo,
  closeDateToNow: Filter.closeDateToNow,
  deadlineFrom: Filter.deadlineFrom,
  deadlineFromNow: Filter.deadlineFromNow,
  deadlineTo: Filter.deadlineTo,
  deadlineToNow: Filter.deadlineToNow,
})

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
      newDate = parseInt(newDate);
      if (controlDates && (isNaN(newDate) || newDate < 0)) {
        throw createIncorrectDateError(date, data[date], newDate);
      }
      result[date] = newDate;
    }
  })
  return result;
}
