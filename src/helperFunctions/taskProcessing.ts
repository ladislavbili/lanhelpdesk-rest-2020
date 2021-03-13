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

export const filterToTaskWhere = (filter, userId, companyId) => {
  let where = {};

  //attributes
  [
    {
      key: 'TaskTypeId',
      value: filter.taskType,
    },
    {
      key: 'CompanyId',
      value: filter.companyCur ? companyId : filter.company,
    },
    {
      key: 'requesterId',
      value: filter.requesterCur ? userId : filter.requester,
    },
  ].forEach((attribute) => {
    if (attribute.value) {
      where[attribute.key] = attribute.value
    }
  });

  //dates
  [
    {
      target: 'statusChange',
      fromNow: filter.statusDateFromNow,
      toNow: filter.statusDateToNow,
      from: filter.statusDateFrom,
      to: filter.statusDateTo,
    },
    {
      target: 'pendingDate',
      fromNow: filter.pendingDateFromNow,
      toNow: filter.pendingDateToNow,
      from: filter.pendingDateFrom,
      to: filter.pendingDateTo,
    },
    {
      target: 'closeDate',
      fromNow: filter.closeDateFromNow,
      toNow: filter.closeDateToNow,
      from: filter.closeDateFrom,
      to: filter.closeDateTo,
    },
    {
      target: 'deadline',
      fromNow: filter.deadlineFromNow,
      toNow: filter.deadlineToNow,
      from: filter.deadlineFrom,
      to: filter.deadlineTo,
    },
  ].forEach((dateFilter) => {
    let {
      target,
      fromNow,
      toNow,
      from,
      to
    } = dateFilter;
    let condition = {};
    if (fromNow) {
      from = moment().toDate();
    }
    if (toNow) {
      to = moment().toDate();
    }

    if (from) {
      condition = { ...condition, [Op.gte]: from }
    }
    if (to) {
      condition = { ...condition, [Op.lte]: to }
    }
    if (from || to) {
      where[target] = {
        [Op.and]: condition
      }
    }
  });
  return where;
}

export const getAssignedTosWhere = (filter, userId) => {
  const id = filter.assignedToCur ? userId : filter.assignedTo;
  if (id) {
    return {
      id
    }
  }
  return {}
}

export const transformSortToQuery = (sort) => {
  const last = sort.asc ? 'ASC' : 'DESC';
  switch (sort.key) {

    case 'assignedTo': {
      return [
        ['assignedTos', 'name', last],
        ['assignedTos', 'surname', last]
      ];
    }
    case 'status': {
      return [['Status', 'order', last]];
    }
    case 'requester': {
      return [
        ['requester', 'name', last],
        ['requester', 'surname', last]
      ];
    }
    case 'id': case 'title': case 'deadline': case 'createdAt': {
      return [[sort.key, last]];
    }
    default: {
      return [['id', last]];
    }
  }
}
