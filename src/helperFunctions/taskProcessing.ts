import { createDoesNoExistsError } from '@/configs/errors';
import moment from 'moment';
import { timestampToString } from './timeManipulations';
import { filterUnique } from './arrayManipulations';
import { models } from '@/models';
import { sendEmail } from '@/services/smtp';
import { Op } from 'sequelize';

export const createTaskAttributesChangeMessages = async (args, Task) => {
  return (<any[]>await Promise.all(
    [
      { key: 'important', name: 'Important' },
      { key: 'deadline', name: 'Deadline' },
      { key: 'title', name: 'Title' },
      { key: 'description', name: 'Description' },
      { key: 'overtime', name: 'Overtime' },
      { key: 'pausal', name: 'Pausal' },
      { key: 'invoiced', name: 'Invoiced' },
    ].map((attr) => {
      return (
        args[attr.key] !== undefined ?
          createChangeMessage(attr.key, null, attr.name, args[attr.key], Task.get(attr.key)) :
          null
      )
    })
  )).filter((response) => response !== null)
}


export const createChangeMessage = async (type, model, name, newValue, OriginalItem, attribute = 'title') => {
  if (['TaskType', 'Company', 'Milestone', 'Requester', 'Project', 'Status'].includes(type)) {
    let NewItem = await model.findByPk(newValue);
    if (!NewItem && newValue !== null) {
      throw createDoesNoExistsError(model.name, newValue);
    }

    return {
      type,
      originalValue: OriginalItem ? OriginalItem.get('id') : null,
      newValue: newValue,
      message: `${name} was changed from ${OriginalItem ? OriginalItem.get(attribute) : 'Nothing'} to ${NewItem ? NewItem.get(attribute) : 'Nothing'}.`,
    }
  } else if (['Tags', 'AssignedTo'].includes(type)) {
    const NewItem = await model.findAll({ where: { id: newValue } });
    return {
      type,
      originalValue: OriginalItem.map((Item) => Item.get('id')).join(','),
      newValue: newValue.join(','),
      message: `${name} were changed from ${OriginalItem.map((Item) => Item.get(attribute)).join(', ')} to ${NewItem.map((Item) => Item.get(attribute)).join(', ')}.`,
    }
  } else if (['CloseDate', 'PendingDate', 'deadline'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem ? OriginalItem.getTime() : null,
      newValue: newValue,
      message: `${name} were changed from ${OriginalItem ? timestampToString(OriginalItem) : 'none'} to ${newValue ? timestampToString(newValue) : 'none'}.`,
    }
  } else if (['PendingChangable', 'important', 'overtime', 'pausal', 'invoiced'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem.toString(),
      newValue: newValue.toString(),
      message: `${name} were changed from ${OriginalItem.toString()} to ${newValue.toString()}.`,
    }
  } else if (['title'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem,
      newValue: newValue,
      message: `${name} were changed from ${OriginalItem} to ${newValue}.`,
    }
  } else if (['description'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem,
      newValue: newValue,
      message: `${name} were changed from "${OriginalItem.substring(0, 50)}..." to "${newValue.substring(0, 50)}."`,
    }
  }
}

export const sendNotifications = async (User, notifications, Task, assignedTos = []) => {
  const AssignedTos = Task.get('assignedTos');
  const ids = [Task.get('requesterId'), ...(AssignedTos ? AssignedTos.map((assignedTo) => assignedTo.get('id')) : assignedTos)];
  const uniqueIds = filterUnique(ids).filter((id) => User === null || User.get('id') !== id);
  if (uniqueIds.length === 0) {
    return;
  }
  const Users = await models.User.findAll({ where: { id: uniqueIds, receiveNotifications: true } });
  if (Users.length === 0) {
    return;
  }
  sendEmail(
    `In task with id ${Task.get('id')} and current title ${Task.get('title')} was changed at ${moment().format('HH:mm DD.MM.YYYY')}.
    Recorded notifications by ${User === null ? 'system' : (`user ${User.get('fullName')}(${User.get('email')})`)} as follows:
    ${
    notifications.length === 0 ?
      `Non-specified change has happened.
      ` :
      notifications.reduce((acc, notification) => acc + ` ${notification}
      `, ``)
    }
    This is an automated message.If you don't wish to receive this kind of notification, please log in and change your profile setting.
    `,
    "",
    `[${Task.get('id')}]Task ${Task.get('title')} was changed notification at ${moment().format('HH:mm DD.MM.YYYY')} `,
    Users.map((User) => User.get('email')),
    'lanhelpdesk2019@gmail.com'
  );
}

export const filterToWhere = (filter, userId) => {
  let {
    taskType,

    statusDateFrom,
    statusDateFromNow,
    statusDateTo,
    statusDateToNow,

    pendingDateFrom,
    pendingDateFromNow,
    pendingDateTo,
    pendingDateToNow,

    closeDateFrom,
    closeDateFromNow,
    closeDateTo,
    closeDateToNow,

    deadlineFrom,
    deadlineFromNow,
    deadlineTo,
    deadlineToNow,
  } = filter;
  let where = {};

  if (taskType) {
    where = {
      ...where,
      TaskTypeId: taskType
    }
  }



  //STATUS DATE
  let statusDateConditions = {};
  if (statusDateFromNow) {
    statusDateFrom = moment().toDate();
  }
  if (statusDateToNow) {
    statusDateTo = moment().toDate();
  }

  if (statusDateFrom) {
    statusDateConditions = { ...statusDateConditions, [Op.gte]: statusDateFrom }
  }
  if (statusDateTo) {
    statusDateConditions = { ...statusDateConditions, [Op.lte]: statusDateTo }
  }
  if (statusDateFrom || statusDateTo) {
    where = {
      ...where,
      statusChange: {
        [Op.and]: statusDateConditions
      }
    }
  }

  //PENDING DATE
  let pendingDateConditions = {};
  if (pendingDateFromNow) {
    pendingDateFrom = moment().toDate();
  }
  if (pendingDateToNow) {
    pendingDateTo = moment().toDate();
  }

  if (pendingDateFrom) {
    pendingDateConditions = { ...pendingDateConditions, [Op.gte]: pendingDateFrom }
  }
  if (pendingDateTo) {
    pendingDateConditions = { ...pendingDateConditions, [Op.lte]: pendingDateTo }
  }
  if (pendingDateFrom || pendingDateTo) {
    where = {
      ...where,
      pendingDate: {
        [Op.and]: pendingDateConditions
      }
    }
  }

  //CLOSE DATE
  let closeDateConditions = {};
  if (closeDateFromNow) {
    closeDateFrom = moment().toDate();
  }
  if (closeDateToNow) {
    closeDateTo = moment().toDate();
  }

  if (closeDateFrom) {
    closeDateConditions = { ...closeDateConditions, [Op.gte]: closeDateFrom }
  }
  if (closeDateTo) {
    closeDateConditions = { ...closeDateConditions, [Op.lte]: closeDateTo }
  }
  if (closeDateFrom || closeDateTo) {
    where = {
      ...where,
      closeDate: {
        [Op.and]: closeDateConditions
      }
    }
  }


  //DEADLINE
  let deadlineConditions = {};
  if (deadlineFromNow) {
    deadlineFrom = moment().toDate();
  }
  if (deadlineToNow) {
    deadlineTo = moment().toDate();
  }

  if (deadlineFrom) {
    deadlineConditions = { ...deadlineConditions, [Op.gte]: deadlineFrom }
  }
  if (deadlineTo) {
    deadlineConditions = { ...deadlineConditions, [Op.lte]: deadlineTo }
  }
  if (deadlineFrom || deadlineTo) {
    where = {
      ...where,
      deadline: {
        [Op.and]: deadlineConditions
      }
    }
  }

  return where;
}

export const filterByOneOf = (filter, userId, companyId, tasks) => {
  let {
    assignedTo,
    assignedToCur,
    requester,
    requesterCur,
    company,
    companyCur,
    oneOf
  } = filter;

  if (assignedToCur) {
    assignedTo = userId;
  }
  if (requesterCur) {
    requester = userId;
  }
  if (companyCur) {
    company = companyId;
  }
  return tasks.filter((task) => {
    let oneOfConditions = [];
    if (assignedTo) {
      if (oneOf.includes('assigned')) {
        oneOfConditions.push(task.get('assignedTos').some((user) => user.get('id') === assignedTo))
      } else if (!task.get('assignedTos').some((user) => user.get('id') === assignedTo)) {
        return false;
      }
    }
    if (requester) {
      if (oneOf.includes('requester')) {
        oneOfConditions.push(task.get('requesterId') === requester)
      } else if (task.get('requesterId') !== requester) {
        return false;
      }
    }
    if (company) {
      if (oneOf.includes('company')) {
        oneOfConditions.push(task.get('CompanyId') === company)
      } else if (task.get('CompanyId') !== company) {
        return false;
      }
    }
    return oneOfConditions.length === 0 || oneOfConditions.every((cond) => cond);
  })

}
