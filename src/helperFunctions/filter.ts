import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { capitalizeFirstLetter } from './stringManipulations';

export const filterObjectToFilter = (Filter) => ({
  assignedToCur: Filter.assignedToCur,
  assignedTos: Filter.assignedTos === null ? null : Filter.assignedTos.get('id'),
  requesterCur: Filter.requesterCur,
  requesters: Filter.requesters === null ? null : Filter.requesters.get('id'),
  companyCur: Filter.companyCur,
  companies: Filter.companies === null ? null : Filter.companies.get('id'),
  taskTypes: Filter.taskTypes === null ? null : Filter.taskTypes.get('id'),
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
  scheduledFrom: Filter.scheduledFrom,
  scheduledFromNow: Filter.scheduledFromNow,
  scheduledTo: Filter.scheduledTo,
  scheduledToNow: Filter.scheduledToNow,
  createdAtFrom: Filter.createdAtFrom,
  createdAtFromNow: Filter.createdAtFromNow,
  createdAtTo: Filter.createdAtTo,
  createdAtToNow: Filter.createdAtToNow,
})

export const filterToTaskWhere = (filter, userId, companyId) => {
  let where = {};

  // bool attributes
  [
    {
      key: 'important',
      value: filter.important,
      withRight: false,
    },
    {
      key: 'invoiced',
      value: filter.invoiced,
      withRight: false,
    },
    {
      key: 'pausal',
      value: filter.pausal,
      withRight: true,
      right: 'pausalRead'
    },
    {
      key: 'overtime',
      value: filter.overtime,
      withRight: true,
      right: 'overtimeRead'
    },
  ].forEach((attribute) => {
    if (attribute.value !== null && attribute.value !== undefined) {
      if (attribute.withRight) {
        let rightPath = `$Project.ProjectGroups.ProjectGroupRight.${attribute.right}$`;
        where = {
          ...where,
          [Op.or]: [
            { [attribute.key]: attribute.value },
            { [rightPath]: false },
          ],
        };
      } else {
        where[attribute.key] = attribute.value
      }
    }
  });

  //multiple attributes
  [
    {
      key: 'TaskTypeId',
      value: filter.taskTypes,
      withRight: true,
      right: 'typeRead',
    },
    {
      key: 'CompanyId',
      value: filter.companyCur ? [...filter.companies, companyId] : filter.companies,
      withRight: true,
      right: 'companyRead',
    },
    {
      key: 'requesterId',
      value: filter.requesterCur ? [...filter.requesters, userId] : filter.requesters,
      withRight: true,
      right: 'requesterRead',
    },
  ].forEach((attribute) => {
    if (attribute.value.length > 0) {
      if (attribute.withRight) {
        let rightPath = `$Project.ProjectGroups.ProjectGroupRight.${attribute.right}$`;
        where = {
          ...where,
          [Op.or]: [
            { [attribute.key]: attribute.value },
            { [rightPath]: false },
          ],
        };
      } else {
        where[attribute.key] = attribute.value
      }
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
      withRight: true,
      right: 'statusRead',
    },
    {
      target: 'pendingDate',
      fromNow: filter.pendingDateFromNow,
      toNow: filter.pendingDateToNow,
      from: filter.pendingDateFrom,
      to: filter.pendingDateTo,
      withRight: false,
    },
    {
      target: 'closeDate',
      fromNow: filter.closeDateFromNow,
      toNow: filter.closeDateToNow,
      from: filter.closeDateFrom,
      to: filter.closeDateTo,
      withRight: true,
      right: 'statusRead',
    },
    {
      target: 'deadline',
      fromNow: filter.deadlineFromNow,
      toNow: filter.deadlineToNow,
      from: filter.deadlineFrom,
      to: filter.deadlineTo,
      withRight: true,
      right: 'deadlineRead',
    },
    {
      target: 'createdAt',
      fromNow: filter.createdAtFrom,
      toNow: filter.createdAtFromNow,
      from: filter.createdAtTo,
      to: filter.createdAtToNow,
      withRight: false,
    },
  ].forEach((dateFilter) => {
    let {
      target,
      fromNow,
      toNow,
      from,
      to,
      withRight,
      right
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
      if (withRight) {
        let rightPath = `$Project.ProjectGroups.ProjectGroupRight.${right}$`;
        where = {
          ...where,
          [Op.or]: [
            { [target]: condition },
            { [rightPath]: false },
          ],
        };
      } else {
        where[target] = {
          [Op.and]: condition
        }
      }
    }
  });

  return { ...where, ...getScheduledWhere(filter), ...getAssignedTosWhere(filter, userId) };
}

const getAssignedTosWhere = (filter, userId) => {
  const ids = filter.assignedToCur ? [...filter.assignedTos, userId] : filter.assignedTos;
  if (ids.length > 0) {
    return {
      [Op.or]: [
        { '$assignedTosFilter.id$': ids },
        { '$Project.ProjectGroups.ProjectGroupRight.assignedRead$': false },
      ]
    }
  }
  return {}
}

const getScheduledWhere = (filter) => {
  let {
    scheduledFrom: from,
    scheduledFromNow: fromNow,
    scheduledTo: to,
    scheduledToNow: toNow,
  } = filter;

  if (fromNow) {
    from = moment().toDate();
  }
  if (toNow) {
    to = moment().toDate();
  }
  if (!from && !to) {
    return {}
  }

  let conditions = {}

  if (from) {
    conditions[Op.gte] = from;
  }
  if (to) {
    conditions[Op.lte] = to;
  }


  //for attribustes from to, if one of them is between
  return {
    [Op.or]: [
      { '$ScheduledTasks.from$': conditions },
      { '$ScheduledTasks.to$': conditions },
      { '$Project.ProjectGroups.ProjectGroupRight.scheduledRead$': false },
    ]
  }
}

const allStringFilters = [
  'id',
  'title',

  'overtime',
  'pausal',

  'deadline',
  'createdAt',

  'status',
  'company',
  'project',
  'taskType',
  'milestone',

  'requester',


  'assignedTo',
  'tags',
]

export const stringFilterToTaskWhere = (search, stringFilter) => {
  let where = {};
  if (search !== undefined && search !== null && search.length !== 0) {
    where = {
      ...where,
      [Op.or]: {
        title: {
          [Op.substring]: search,
        },
        id: {
          [Op.substring]: search,
        },
      }
    }
  }
  if (stringFilter) {
    const filterItems = allStringFilters.map((key) => ({ value: stringFilter[key], key }))
      .filter((filterItem) => filterItem.value !== undefined && filterItem.value !== null && filterItem.value.length !== 0);
    filterItems.forEach((filterItem) => {
      switch (filterItem.key) {
        case 'id': case 'title': {
          where = {
            ...where,
            [filterItem.key]: { [Op.substring]: filterItem.value },
          }
          break;
        }
        case 'overtime': case 'pausal': {
          where = {
            ...where,
            [filterItem.key]: 'ánoanoyes'.includes(filterItem.value.toLowerCase()) && filterItem.value.toLowerCase() !== 'no',
          }
          break;
        }
        case 'deadline': case 'createdAt': {
          where = {
            ...where,
            [filterItem.key]: Sequelize.literal(`DATE_FORMAT(Task.${filterItem.key}, "%H:%i %d.%m.%Y") LIKE '%${filterItem.value}%'`),
          }
          break;
        }
        case 'status': case 'company': case 'project': case 'taskType': case 'milestone': {
          const filterPath = `$${capitalizeFirstLetter(filterItem.key)}.title$`
          where = {
            ...where,
            [filterPath]: { [Op.substring]: filterItem.value },
          }
          break;
        }
        case 'requester': {
          let forms = [filterItem.value, ...filterItem.value.split(' ')].filter((str) => str.length > 0);
          where = {
            ...where,
            [Op.or]: [
              ...forms.map((form) => {
                return {
                  '$requester.name$': { [Op.substring]: form },
                }
              }),
              ...forms.map((form) => {
                return {
                  '$requester.surname$': { [Op.substring]: form },
                }
              }),
            ]
          }
          break;
        }
        case 'assignedTo': {
          let forms = [filterItem.value, ...filterItem.value.split(' ')].filter((str) => str.length > 0);
          where = {
            ...where,
            [Op.or]: [
              ...forms.map((form) => {
                return {
                  '$assignedTosFilter.name$': { [Op.substring]: form },
                }
              }),
              ...forms.map((form) => {
                return {
                  '$assignedTosFilter.surname$': { [Op.substring]: form },
                }
              }),
            ]
          }
          break;
        }
        case 'tags': {
          where = {
            ...where,
            '$tagsFilter.title$': { [Op.substring]: filterItem.value },
          }
          break;
        }
        default:
          break;
      }
    })
  }
  return where;
}
