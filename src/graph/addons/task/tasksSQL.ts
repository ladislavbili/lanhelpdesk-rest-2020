import moment from 'moment';
import { capitalizeFirstLetter } from '@/helperFunctions';
import { allStringFilters } from '@/configs/taskConstants';
const rightsExists = `"Project->ProjectGroups->Users"."id" IS NOT NULL`;

export const transformSortToQueryString = (sort, main) => {
  const order = sort.asc ? "ASC" : "DESC";
  const separator = main ? '"."' : '.';
  let orderBy = '';
  switch (sort.key) {
    case 'assignedTo': {
      orderBy = `"assignedTos${separator}name" ${order}, "assignedTos${separator}surname" ${order}`;
      break;
    }
    case 'status': {
      orderBy = `"Status${separator}order" ${order}, "Project.title" ${order}`;
      break;
    }
    case 'requester': {
      orderBy = `"requester${separator}name" ${order}, "requester${separator}surname" ${order}`;
      break;
    }
    case 'id': case 'title': case 'deadline': case 'createdAt': {
      orderBy = `${main ? "Task" : "TaskData"}."${sort.key}" ${order}`;
      break;
    }
    default: {
      orderBy = `${main ? "Task" : "TaskData"}."id" ${order}`;
    }
  }
  return `${main ? "Task" : "TaskData"}."important" DESC, ${orderBy}, ${main ? "Task" : "TaskData"}."id" DESC`;
}

export const filterToTaskWhereSQL = (filter, userId, companyId, projectId) => {
  let where = [];
  // bool attributes
  [
    {
      key: 'important',
      value: filter.important,
      withRight: false,
      path: '"Task".',
    },
    {
      key: 'invoiced',
      value: filter.invoiced,
      withRight: false,
      path: '"Task".',
    },
    {
      key: 'pausal',
      value: filter.pausal,
      withRight: true,
      path: '"Task".',
      right: 'pausalRead'
    },
    {
      key: 'overtime',
      value: filter.overtime,
      withRight: true,
      path: '"Task".',
      right: 'overtimeRead'
    },
  ].forEach((attribute) => {
    if (attribute.value !== null && attribute.value !== undefined) {
      if (attribute.withRight && projectId) {
        let rightPath = `"Project->ProjectGroups->ProjectGroupRight"."${attribute.right}"`;
        where.push(
          `(
            ${attribute.path ? `${attribute.path}` : ""}"${attribute.key}" = '${attribute.value}' OR
            ( ${rightsExists} AND ${rightPath} = false )
          )`
        )
      } else {
        where.push(
          `${attribute.path ? attribute.path : ""}"${attribute.key}" = '${attribute.value}'`
        )
      }
    }
  });

  //multiple attributes
  [
    {
      key: 'TaskTypeId',
      value: filter.taskTypes,
      withRight: true,
      path: `"Task".`,
      right: 'typeRead',
    },
    {
      key: 'CompanyId',
      value: filter.companyCur ? [...filter.companies, companyId] : filter.companies,
      withRight: true,
      path: `"Task".`,
      right: 'companyRead',
    },
    {
      key: 'requesterId',
      value: filter.requesterCur ? [...filter.requesters, userId] : filter.requesters,
      withRight: true,
      path: `"Task".`,
      right: 'requesterRead',
    },
  ].forEach((attribute) => {
    if (attribute.value.length > 0) {
      if (attribute.withRight && projectId) {
        let rightPath = `"Project->ProjectGroups->ProjectGroupRight"."${attribute.right}"`;
        where.push(
          `(
              ${attribute.path}"${attribute.key}" IN (${attribute.value.toString()}) OR
              ( ${rightsExists} AND ${rightPath} = false )
            )`
        )
      } else {
        where.push(
          `${attribute.path}"${attribute.key}" IN (${attribute.value.toString()})`
        )
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
      path: '"Task".',
      withRight: true,
      right: 'statusRead',
    },
    {
      target: 'pendingDate',
      fromNow: filter.pendingDateFromNow,
      toNow: filter.pendingDateToNow,
      from: filter.pendingDateFrom,
      to: filter.pendingDateTo,
      path: '"Task".',
      withRight: false,
    },
    {
      target: 'closeDate',
      fromNow: filter.closeDateFromNow,
      toNow: filter.closeDateToNow,
      from: filter.closeDateFrom,
      to: filter.closeDateTo,
      path: '"Task".',
      withRight: true,
      right: 'statusRead',
    },
    {
      target: 'deadline',
      fromNow: filter.deadlineFromNow,
      toNow: filter.deadlineToNow,
      from: filter.deadlineFrom,
      to: filter.deadlineTo,
      path: '"Task".',
      withRight: true,
      right: 'deadlineRead',
    },
    {
      target: 'createdAt',
      fromNow: filter.createdAtFrom,
      toNow: filter.createdAtFromNow,
      from: filter.createdAtTo,
      to: filter.createdAtToNow,
      path: '"Task".',
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
      right,
      path,
    } = dateFilter;

    if (from) {
      from = new Date(from);
    }

    if (to) {
      to = new Date(to);
    }

    if (fromNow) {
      from = moment().toDate();
    }
    if (toNow) {
      to = moment().toDate();
    }

    let condition = [];
    if (from) {
      condition.push(`(${path ? path : ''}"${target}" >= '${from.toISOString().slice(0, 19).replace('T', ' ')}')`)
    }
    if (to) {
      condition.push(`(${path ? path : ''}"${target}" <= '${to.toISOString().slice(0, 19).replace('T', ' ')}')`)
    }
    if (from || to) {
      if (withRight && projectId) {
        let rightPath = `"Project->ProjectGroups->ProjectGroupRight"."${right}"`;
        where.push(`(
          ( ${condition.join(' AND ')} ) OR
          ( ${rightsExists} AND ${rightPath} = false )
        )`);
      } else {
        where.push(`( ${condition.join(' AND ')} )`);
      }
    }
  });

  const assignedWhere = getAssignedTosWhereSQL(filter, userId, projectId);
  if (assignedWhere !== null) {
    where.push(assignedWhere);
  }
  const tagsWhere = getTagsWhereSQL(filter, userId, projectId);
  if (tagsWhere !== null) {
    where.push(tagsWhere);
  }
  const scheduledWhere = getScheduledWhereSQL(filter, projectId);
  if (scheduledWhere !== null) {
    where.push(scheduledWhere);
  }
  return where;
}

const getAssignedTosWhereSQL = (filter, userId, projectId) => {
  const ids = filter.assignedToCur ? [...filter.assignedTos, userId] : filter.assignedTos;
  if (ids.length > 0) {
    return `(
      ${projectId ? `( ${rightsExists} AND "Project->ProjectGroups->ProjectGroupRight"."assignedRead" = false ) OR ` : ''}
      "assignedTosFilter"."id" IN (${ids.toString()})
    )
    `
  }
  return null;
}

const getTagsWhereSQL = (filter, userId, projectId) => {
  const ids = filter.tags;
  if (ids.length > 0) {
    return `(
      ${projectId ? `( ${rightsExists} AND "Project->ProjectGroups->ProjectGroupRight"."tagsRead" = false ) OR ` : ''}
      "tagsFilter"."id" IN (${ids.toString()})
    )
    `
  }
  return null;
}

const getScheduledWhereSQL = (filter, projectId) => {
  let {
    scheduledFrom: from,
    scheduledFromNow: fromNow,
    scheduledTo: to,
    scheduledToNow: toNow,
  } = filter;

  if (from) {
    from = new Date(from);
  }

  if (to) {
    to = new Date(to);
  }

  if (fromNow) {
    from = moment().toDate();
  }
  if (toNow) {
    to = moment().toDate();
  }
  if (!from && !to) {
    return null;
  }

  let conditions = []

  if (from) {
    //from plati ak FROM je vacsi alebo rovnaky alebo TO je vacsi alebo rovnaky
    conditions.push(`(
      ("ScheduledTasks"."from" >= '${from.toISOString().slice(0, 19).replace('T', ' ')}') OR
      ("ScheduledTasks"."to" >= '${from.toISOString().slice(0, 19).replace('T', ' ')}')
    )`)
  }
  if (to) {
    //to plati ak FROM je mensi alebo rovnaky alebo TO je mensi alebo rovnaky
    conditions.push(`(
      ("ScheduledTasks"."from" <= '${to.toISOString().slice(0, 19).replace('T', ' ')}') OR
      ("ScheduledTasks"."to" <= '${to.toISOString().slice(0, 19).replace('T', ' ')}')
    )`)
  }

  //podmienky platia ak CONDITION je splneny alebo nema pravo scheduled citat
  return `(
  ${projectId ? `( ${rightsExists} AND "Project->ProjectGroups->ProjectGroupRight"."assignedRead" = false ) OR ` : ''}
    (${conditions.join(' AND ')})
  )`;
}

export const stringFilterToTaskWhereSQL = (search, stringFilter) => {
  let where = [];
  if (search !== undefined && search !== null && search.length !== 0) {
    where.push(`(
      "Task"."id" LIKE '%${search}%' OR
      "Task"."title" LIKE '%${search}%'
      )`);
  }
  if (stringFilter) {
    const filterItems = allStringFilters.map((key) => ({ value: stringFilter[key], key }))
      .filter((filterItem) => filterItem.value !== undefined && filterItem.value !== null && filterItem.value.length !== 0);
    filterItems.forEach((filterItem) => {
      switch (filterItem.key) {
        case 'id': case 'title': {
          where.push(`
            "Task"."${filterItem.key}" LIKE '%${filterItem.value}%'
            `)
          break;
        }
        case 'overtime': case 'pausal': {
          where.push(`
            "Task"."${filterItem.key}" = ${'ánoanoyes'.includes(filterItem.value.toLowerCase()) && filterItem.value.toLowerCase() !== 'no'}
            `)
          break;
        }
        case 'deadline': case 'createdAt': {
          let filterString = filterItem.value;
          if (filterString.includes(":")) {
            filterString = filterString.split(":");
            if (filterString[0] && !isNaN(parseInt(filterString[0]))) {
              filterString[0] = parseInt(filterString[0]) - 1;
              filterString = filterString.join(':')
            }
          }
          where.push(`(
            DATE_FORMAT("Task"."${filterItem.key}", '%H:%i %e.%c.%Y') LIKE '%${filterString}%' OR
            DATE_FORMAT("Task"."${filterItem.key}", '%H:%i %d.%m.%Y') LIKE '%${filterString}%'
            )`)
          break;
        }
        case 'status': case 'company': case 'taskType': case 'milestone': {
          where.push(`
            "${capitalizeFirstLetter(filterItem.key)}"."title" LIKE '%${filterItem.value}%'
            `);
          break;
        }
        case 'project': {
          where.push(`
            "${capitalizeFirstLetter(filterItem.key)}.title" LIKE '%${filterItem.value}%'
            `);
          break;
        }
        case 'requester': {
          let forms = [filterItem.value, ...filterItem.value.split(' ')].filter((str) => str.length > 0);
          let orConditions = forms.reduce((acc, form) => {
            return [...acc, `"requester"."name" LIKE '%${form}%'`, `"requester"."surname" LIKE '%${form}%'`];
          }, []);
          where.push(`(
            ${orConditions.join(' OR ')}
            )`);
          break;
        }
        case 'assignedTo': {
          let forms = [filterItem.value, ...filterItem.value.split(' ')].filter((str) => str.length > 0);
          let orConditions = forms.reduce((acc, form) => {
            return [...acc, `"assignedTosFilter"."name" LIKE '%${form}%'`, `"assignedTosFilter"."surname" LIKE '%${form}%'`];
          }, []);
          where.push(`(
            ${orConditions.join(' OR ')}
            )`);
          break;
        }
        case 'tags': {
          where.push(`
            "tagsFilter"."title" LIKE '%${filterItem.value}%'
            `);
          break;
        }
        default:
          break;
      }
    })
  }
  return where;
}

export const generateTasksSQL = (projectId, userId, companyId, isAdmin, where, mainOrderBy, secondaryOrderBy, limit, offset) => {

  const notAdminWhere = `
  ${where.length > 0 ? 'AND ' : ''}(
    "Task"."createdById" = ${userId} OR
    "Task"."requesterId" = ${userId} OR
    "assignedTosFilter"."id" = ${userId} OR
    "Project->ProjectGroups->ProjectGroupRight"."allTasks" = true OR
    ("Project->ProjectGroups->ProjectGroupRight"."companyTasks" = true AND "Task"."CompanyId" = ${companyId})
  )
  `;

  //ORDER BY "Task"."important" DESC
  let sql = `
      ${outerSQLTop}
      ${baseSQL}
      ) AS "Task"
  `;
  sql = `
    ${sql}
     LEFT OUTER JOIN ( "task_assignedTo" AS "assignedTosFilter->task_assignedTo" INNER JOIN "users" AS "assignedTosFilter" ON "assignedTosFilter"."id" = "assignedTosFilter->task_assignedTo"."UserId") ON "Task"."id" = "assignedTosFilter->task_assignedTo"."TaskId"
     LEFT OUTER JOIN "scheduled_task" AS "ScheduledTasks" ON "Task"."id" = "ScheduledTasks"."TaskId"
     LEFT OUTER JOIN "companies" AS "Company" ON "Task"."CompanyId" = "Company"."id"
     LEFT OUTER JOIN "users" AS "createdBy" ON "Task"."createdById" = "createdBy"."id"
     LEFT OUTER JOIN "milestone" AS "Milestone" ON "Task"."MilestoneId" = "Milestone"."id"
     LEFT OUTER JOIN "users" AS "requester" ON "Task"."requesterId" = "requester"."id"
     LEFT OUTER JOIN "statuses" AS "Status" ON "Task"."StatusId" = "Status"."id"
     LEFT OUTER JOIN ( "task_has_tags" AS "tagsFilter->task_has_tags" INNER JOIN "tags" AS "tagsFilter" ON "tagsFilter"."id" = "tagsFilter->task_has_tags"."TagId") ON "Task"."id" = "tagsFilter->task_has_tags"."TaskId"
     LEFT OUTER JOIN "task_types" AS "TaskType" ON "Task"."TaskTypeId" = "TaskType"."id"
     LEFT OUTER JOIN "repeat" AS "Repeat" ON "Task"."RepeatId" = "Repeat"."id" LEFT OUTER JOIN "task_metadata" AS "TaskMetadata" ON "Task"."id" = "TaskMetadata"."TaskId"
     ${isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN "project_group" AS "Project->ProjectGroups" ON "Project.id" = "Project->ProjectGroups"."ProjectId"
     ${isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN "project_group_rights" AS "Project->ProjectGroups->ProjectGroupRight" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId"
     ${isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN ( "user_belongs_to_group" AS "Project->ProjectGroups->Users->user_belongs_to_group" INNER JOIN "users" AS "Project->ProjectGroups->Users" ON "Project->ProjectGroups->Users"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."UserId") ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AND "Project->ProjectGroups->Users"."id" = ${userId}
  `

  if (where) {
    sql = `
    ${sql}
    WHERE ${where} ${isAdmin ? '' : `${notAdminWhere}`}
    `
  }

  sql = `
  ${sql}
  GROUP BY "Task"."id"
  `

  if (mainOrderBy) {
    sql = `
    ${sql}
    ORDER BY ${mainOrderBy}
    `
  }

  if (limit) {
    sql = `
    ${sql}
    LIMIT ${offset},${limit}
    `
  }

  sql = `
  ${sql}
  ${outerSQLBottom}
  `

  if (secondaryOrderBy) {
    sql = `
    ${sql}
    ORDER BY ${secondaryOrderBy}
    `
  }

  return sql.replace(/"/g, '`');
}

const generateFullNameSQL = (source) => {
  return ` CONCAT( "${source}"."name", ' ' , "${source}"."surname" ) as "${source}.fullName",`;
}

const outerSQLTop = `
SELECT "TaskData".*,
"assignedTos"."id" AS "assignedTos.id", "assignedTos"."active" AS "assignedTos.active", "assignedTos"."username" AS "assignedTos.username", "assignedTos"."email" AS "assignedTos.email", "assignedTos"."name" AS "assignedTos.name", "assignedTos"."surname" AS "assignedTos.surname", ${generateFullNameSQL('assignedTos')} "assignedTos"."password" AS "assignedTos.password", "assignedTos"."receiveNotifications" AS "assignedTos.receiveNotifications", "assignedTos"."signature" AS "assignedTos.signature", "assignedTos"."tokenKey" AS "assignedTos.tokenKey", "assignedTos"."language" AS "assignedTos.language", "assignedTos"."tasklistLayout" AS "assignedTos.tasklistLayout", "assignedTos"."taskLayout" AS "assignedTos.taskLayout", "assignedTos"."createdAt" AS "assignedTos.createdAt", "assignedTos"."updatedAt" AS "assignedTos.updatedAt", "assignedTos"."RoleId" AS "assignedTos.RoleId", "assignedTos"."CompanyId" AS "assignedTos.CompanyId", "assignedTos->task_assignedTo"."createdAt" AS "assignedTos.task_assignedTo.createdAt", "assignedTos->task_assignedTo"."updatedAt" AS "assignedTos.task_assignedTo.updatedAt", "assignedTos->task_assignedTo"."UserId" AS "assignedTos.task_assignedTo.UserId", "assignedTos->task_assignedTo"."TaskId" AS "assignedTos.task_assignedTo.TaskId",
"Tags"."id" AS "Tags.id", "Tags"."title" AS "Tags.title", "Tags"."color" AS "Tags.color", "Tags"."order" AS "Tags.order", "Tags"."createdAt" AS "Tags.createdAt", "Tags"."updatedAt" AS "Tags.updatedAt", "Tags"."ProjectId" AS "Tags.ProjectId", "Tags"."ofProjectId" AS "Tags.ofProjectId", "Tags->task_has_tags"."createdAt" AS "Tags.task_has_tags.createdAt", "Tags->task_has_tags"."updatedAt" AS "Tags.task_has_tags.updatedAt", "Tags->task_has_tags"."TagId" AS "Tags.task_has_tags.TagId", "Tags->task_has_tags"."TaskId" AS "Tags.task_has_tags.TaskId"
FROM (
`;

const outerSQLBottom = `
) as TaskData LEFT OUTER JOIN ( "task_assignedTo" AS "assignedTos->task_assignedTo" INNER JOIN "users" AS "assignedTos" ON "assignedTos"."id" = "assignedTos->task_assignedTo"."UserId") ON "TaskData"."id" = "assignedTos->task_assignedTo"."TaskId"
LEFT OUTER JOIN ( "task_has_tags" AS "Tags->task_has_tags" INNER JOIN "tags" AS "Tags" ON "Tags"."id" = "Tags->task_has_tags"."TagId") ON "TaskData"."id" = "Tags->task_has_tags"."TaskId"
`;

const baseSQL = `SELECT "Task".*, COUNT(*) OVER () as count,
"assignedTosFilter"."id" AS "assignedTosFilter.id", "assignedTosFilter"."name" AS "assignedTosFilter.name", "assignedTosFilter"."surname" AS "assignedTosFilter.surname", "assignedTosFilter->task_assignedTo"."createdAt" AS "assignedTosFilter.task_assignedTo.createdAt", "assignedTosFilter->task_assignedTo"."updatedAt" AS "assignedTosFilter.task_assignedTo.updatedAt", "assignedTosFilter->task_assignedTo"."UserId" AS "assignedTosFilter.task_assignedTo.UserId", "assignedTosFilter->task_assignedTo"."TaskId" AS "assignedTosFilter.task_assignedTo.TaskId", "ScheduledTasks"."id" AS "ScheduledTasks.id", "Company"."id" AS "Company.id", "Company"."title" AS "Company.title", "Company"."dph" AS "Company.dph", "Company"."ico" AS "Company.ico", "Company"."dic" AS "Company.dic", "Company"."ic_dph" AS "Company.ic_dph", "Company"."country" AS "Company.country", "Company"."city" AS "Company.city", "Company"."street" AS "Company.street", "Company"."zip" AS "Company.zip", "Company"."email" AS "Company.email", "Company"."phone" AS "Company.phone", "Company"."description" AS "Company.description", "Company"."monthly" AS "Company.monthly", "Company"."monthlyPausal" AS "Company.monthlyPausal", "Company"."taskWorkPausal" AS "Company.taskWorkPausal", "Company"."taskTripPausal" AS "Company.taskTripPausal", "Company"."createdAt" AS "Company.createdAt", "Company"."updatedAt" AS "Company.updatedAt", "Company"."PricelistId" AS "Company.PricelistId", "createdBy"."id" AS "createdBy.id", "createdBy"."active" AS "createdBy.active", "createdBy"."username" AS "createdBy.username", "createdBy"."email" AS "createdBy.email", "createdBy"."name" AS "createdBy.name", "createdBy"."surname" AS "createdBy.surname", ${generateFullNameSQL('createdBy')} "createdBy"."password" AS "createdBy.password", "createdBy"."receiveNotifications" AS "createdBy.receiveNotifications", "createdBy"."signature" AS "createdBy.signature", "createdBy"."tokenKey" AS "createdBy.tokenKey", "createdBy"."language" AS "createdBy.language", "createdBy"."tasklistLayout" AS "createdBy.tasklistLayout", "createdBy"."taskLayout" AS "createdBy.taskLayout", "createdBy"."createdAt" AS "createdBy.createdAt", "createdBy"."updatedAt" AS "createdBy.updatedAt", "createdBy"."RoleId" AS "createdBy.RoleId", "createdBy"."CompanyId" AS "createdBy.CompanyId", "Milestone"."id" AS "Milestone.id", "Milestone"."title" AS "Milestone.title", "Milestone"."description" AS "Milestone.description", "Milestone"."startsAt" AS "Milestone.startsAt", "Milestone"."endsAt" AS "Milestone.endsAt", "Milestone"."createdAt" AS "Milestone.createdAt", "Milestone"."updatedAt" AS "Milestone.updatedAt", "Milestone"."ProjectId" AS "Milestone.ProjectId", "requester"."id" AS "requester.id", "requester"."active" AS "requester.active", "requester"."username" AS "requester.username", "requester"."email" AS "requester.email", "requester"."name" AS "requester.name", "requester"."surname" AS "requester.surname", ${generateFullNameSQL('requester')} "requester"."password" AS "requester.password", "requester"."receiveNotifications" AS "requester.receiveNotifications", "requester"."signature" AS "requester.signature", "requester"."tokenKey" AS "requester.tokenKey", "requester"."language" AS "requester.language", "requester"."tasklistLayout" AS "requester.tasklistLayout", "requester"."taskLayout" AS "requester.taskLayout", "requester"."createdAt" AS "requester.createdAt", "requester"."updatedAt" AS "requester.updatedAt", "requester"."RoleId" AS "requester.RoleId", "requester"."CompanyId" AS "requester.CompanyId", "Status"."id" AS "Status.id", "Status"."title" AS "Status.title", "Status"."order" AS "Status.order", "Status"."template" AS "Status.template", "Status"."color" AS "Status.color", "Status"."icon" AS "Status.icon", "Status"."action" AS "Status.action", "Status"."createdAt" AS "Status.createdAt", "Status"."updatedAt" AS "Status.updatedAt", "Status"."ProjectId" AS "Status.ProjectId", "Status"."defStatusId" AS "Status.defStatusId", "Status"."projectStatusId" AS "Status.projectStatusId",

"tagsFilter"."id" AS "tagsFilter.id", "tagsFilter"."title" AS "tagsFilter.title", "tagsFilter->task_has_tags"."createdAt" AS "tagsFilter.task_has_tags.createdAt", "tagsFilter->task_has_tags"."updatedAt" AS "tagsFilter.task_has_tags.updatedAt", "tagsFilter->task_has_tags"."TagId" AS "tagsFilter.task_has_tags.TagId", "tagsFilter->task_has_tags"."TaskId" AS "tagsFilter.task_has_tags.TaskId", "TaskType"."id" AS "TaskType.id", "TaskType"."title" AS "TaskType.title", "TaskType"."order" AS "TaskType.order", "TaskType"."createdAt" AS "TaskType.createdAt", "TaskType"."updatedAt" AS "TaskType.updatedAt", "Repeat"."id" AS "Repeat.id", "Repeat"."repeatEvery" AS "Repeat.repeatEvery", "Repeat"."repeatInterval" AS "Repeat.repeatInterval", "Repeat"."startsAt" AS "Repeat.startsAt", "Repeat"."active" AS "Repeat.active", "Repeat"."createdAt" AS "Repeat.createdAt", "Repeat"."updatedAt" AS "Repeat.updatedAt", "TaskMetadata"."id" AS "TaskMetadata.id", "TaskMetadata"."subtasksApproved" AS "TaskMetadata.subtasksApproved", "TaskMetadata"."subtasksPending" AS "TaskMetadata.subtasksPending", "TaskMetadata"."tripsApproved" AS "TaskMetadata.tripsApproved", "TaskMetadata"."tripsPending" AS "TaskMetadata.tripsPending", "TaskMetadata"."materialsApproved" AS "TaskMetadata.materialsApproved", "TaskMetadata"."materialsPending" AS "TaskMetadata.materialsPending", "TaskMetadata"."itemsApproved" AS "TaskMetadata.itemsApproved", "TaskMetadata"."itemsPending" AS "TaskMetadata.itemsPending", "TaskMetadata"."createdAt" AS "TaskMetadata.createdAt", "TaskMetadata"."updatedAt" AS "TaskMetadata.updatedAt", "TaskMetadata"."TaskId" AS "TaskMetadata.TaskId", "Project->ProjectGroups"."id" AS "Project.ProjectGroups.id", "Project->ProjectGroups"."title" AS "Project.ProjectGroups.title", "Project->ProjectGroups"."order" AS "Project.ProjectGroups.order", "Project->ProjectGroups"."createdAt" AS "Project.ProjectGroups.createdAt", "Project->ProjectGroups"."updatedAt" AS "Project.ProjectGroups.updatedAt", "Project->ProjectGroups"."ProjectId" AS "Project.ProjectGroups.ProjectId", "Project->ProjectGroups->ProjectGroupRight"."id" AS "Project.ProjectGroups.ProjectGroupRight.id", "Project->ProjectGroups->ProjectGroupRight"."assignedRead" AS "Project.ProjectGroups.ProjectGroupRight.assignedRead", "Project->ProjectGroups->ProjectGroupRight"."assignedWrite" AS "Project.ProjectGroups.ProjectGroupRight.assignedWrite", "Project->ProjectGroups->ProjectGroupRight"."companyRead" AS "Project.ProjectGroups.ProjectGroupRight.companyRead", "Project->ProjectGroups->ProjectGroupRight"."companyWrite" AS "Project.ProjectGroups.ProjectGroupRight.companyWrite", "Project->ProjectGroups->ProjectGroupRight"."deadlineRead" AS "Project.ProjectGroups.ProjectGroupRight.deadlineRead", "Project->ProjectGroups->ProjectGroupRight"."deadlineWrite" AS "Project.ProjectGroups.ProjectGroupRight.deadlineWrite", "Project->ProjectGroups->ProjectGroupRight"."milestoneRead" AS "Project.ProjectGroups.ProjectGroupRight.milestoneRead", "Project->ProjectGroups->ProjectGroupRight"."milestoneWrite" AS "Project.ProjectGroups.ProjectGroupRight.milestoneWrite", "Project->ProjectGroups->ProjectGroupRight"."overtimeRead" AS "Project.ProjectGroups.ProjectGroupRight.overtimeRead", "Project->ProjectGroups->ProjectGroupRight"."overtimeWrite" AS "Project.ProjectGroups.ProjectGroupRight.overtimeWrite", "Project->ProjectGroups->ProjectGroupRight"."pausalRead" AS "Project.ProjectGroups.ProjectGroupRight.pausalRead", "Project->ProjectGroups->ProjectGroupRight"."pausalWrite" AS "Project.ProjectGroups.ProjectGroupRight.pausalWrite", "Project->ProjectGroups->ProjectGroupRight"."projectRead" AS "Project.ProjectGroups.ProjectGroupRight.projectRead", "Project->ProjectGroups->ProjectGroupRight"."projectWrite" AS "Project.ProjectGroups.ProjectGroupRight.projectWrite", "Project->ProjectGroups->ProjectGroupRight"."projectPrimaryRead" AS "Project.ProjectGroups.ProjectGroupRight.projectPrimaryRead", "Project->ProjectGroups->ProjectGroupRight"."projectPrimaryWrite" AS "Project.ProjectGroups.ProjectGroupRight.projectPrimaryWrite", "Project->ProjectGroups->ProjectGroupRight"."repeatRead" AS "Project.ProjectGroups.ProjectGroupRight.repeatRead", "Project->ProjectGroups->ProjectGroupRight"."repeatWrite" AS "Project.ProjectGroups.ProjectGroupRight.repeatWrite", "Project->ProjectGroups->ProjectGroupRight"."requesterRead" AS "Project.ProjectGroups.ProjectGroupRight.requesterRead", "Project->ProjectGroups->ProjectGroupRight"."requesterWrite" AS "Project.ProjectGroups.ProjectGroupRight.requesterWrite", "Project->ProjectGroups->ProjectGroupRight"."rozpocetRead" AS "Project.ProjectGroups.ProjectGroupRight.rozpocetRead", "Project->ProjectGroups->ProjectGroupRight"."rozpocetWrite" AS "Project.ProjectGroups.ProjectGroupRight.rozpocetWrite", "Project->ProjectGroups->ProjectGroupRight"."scheduledRead" AS "Project.ProjectGroups.ProjectGroupRight.scheduledRead", "Project->ProjectGroups->ProjectGroupRight"."scheduledWrite" AS "Project.ProjectGroups.ProjectGroupRight.scheduledWrite", "Project->ProjectGroups->ProjectGroupRight"."statusRead" AS "Project.ProjectGroups.ProjectGroupRight.statusRead", "Project->ProjectGroups->ProjectGroupRight"."statusWrite" AS "Project.ProjectGroups.ProjectGroupRight.statusWrite", "Project->ProjectGroups->ProjectGroupRight"."tagsRead" AS "Project.ProjectGroups.ProjectGroupRight.tagsRead", "Project->ProjectGroups->ProjectGroupRight"."tagsWrite" AS "Project.ProjectGroups.ProjectGroupRight.tagsWrite", "Project->ProjectGroups->ProjectGroupRight"."taskAttachmentsRead" AS "Project.ProjectGroups.ProjectGroupRight.taskAttachmentsRead", "Project->ProjectGroups->ProjectGroupRight"."taskAttachmentsWrite" AS "Project.ProjectGroups.ProjectGroupRight.taskAttachmentsWrite", "Project->ProjectGroups->ProjectGroupRight"."taskDescriptionRead" AS "Project.ProjectGroups.ProjectGroupRight.taskDescriptionRead", "Project->ProjectGroups->ProjectGroupRight"."taskDescriptionWrite" AS "Project.ProjectGroups.ProjectGroupRight.taskDescriptionWrite", "Project->ProjectGroups->ProjectGroupRight"."taskShortSubtasksRead" AS "Project.ProjectGroups.ProjectGroupRight.taskShortSubtasksRead", "Project->ProjectGroups->ProjectGroupRight"."taskShortSubtasksWrite" AS "Project.ProjectGroups.ProjectGroupRight.taskShortSubtasksWrite", "Project->ProjectGroups->ProjectGroupRight"."typeRead" AS "Project.ProjectGroups.ProjectGroupRight.typeRead", "Project->ProjectGroups->ProjectGroupRight"."typeWrite" AS "Project.ProjectGroups.ProjectGroupRight.typeWrite", "Project->ProjectGroups->ProjectGroupRight"."vykazRead" AS "Project.ProjectGroups.ProjectGroupRight.vykazRead", "Project->ProjectGroups->ProjectGroupRight"."vykazWrite" AS "Project.ProjectGroups.ProjectGroupRight.vykazWrite", "Project->ProjectGroups->ProjectGroupRight"."addComments" AS "Project.ProjectGroups.ProjectGroupRight.addComments", "Project->ProjectGroups->ProjectGroupRight"."emails" AS "Project.ProjectGroups.ProjectGroupRight.emails", "Project->ProjectGroups->ProjectGroupRight"."history" AS "Project.ProjectGroups.ProjectGroupRight.history", "Project->ProjectGroups->ProjectGroupRight"."internal" AS "Project.ProjectGroups.ProjectGroupRight.internal", "Project->ProjectGroups->ProjectGroupRight"."projectSecondary" AS "Project.ProjectGroups.ProjectGroupRight.projectSecondary", "Project->ProjectGroups->ProjectGroupRight"."pausalInfo" AS "Project.ProjectGroups.ProjectGroupRight.pausalInfo", "Project->ProjectGroups->ProjectGroupRight"."taskTitleEdit" AS "Project.ProjectGroups.ProjectGroupRight.taskTitleEdit", "Project->ProjectGroups->ProjectGroupRight"."viewComments" AS "Project.ProjectGroups.ProjectGroupRight.viewComments", "Project->ProjectGroups->ProjectGroupRight"."companyTasks" AS "Project.ProjectGroups.ProjectGroupRight.companyTasks", "Project->ProjectGroups->ProjectGroupRight"."allTasks" AS "Project.ProjectGroups.ProjectGroupRight.allTasks",
"Project->ProjectGroups->ProjectGroupRight"."addTasks" AS "Project.ProjectGroups.ProjectGroupRight.addTasks",
"Project->ProjectGroups->ProjectGroupRight"."statistics" AS "Project.ProjectGroups.ProjectGroupRight.statistics",
 "Project->ProjectGroups->ProjectGroupRight"."deleteTasks" AS "Project.ProjectGroups.ProjectGroupRight.deleteTasks", "Project->ProjectGroups->ProjectGroupRight"."important" AS "Project.ProjectGroups.ProjectGroupRight.important", "Project->ProjectGroups->ProjectGroupRight"."createdAt" AS "Project.ProjectGroups.ProjectGroupRight.createdAt", "Project->ProjectGroups->ProjectGroupRight"."updatedAt" AS "Project.ProjectGroups.ProjectGroupRight.updatedAt", "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId" AS "Project.ProjectGroups.ProjectGroupRight.ProjectGroupId", "Project->ProjectGroups->Users"."id" AS "Project.ProjectGroups.Users.id", "Project->ProjectGroups->Users"."active" AS "Project.ProjectGroups.Users.active", "Project->ProjectGroups->Users"."username" AS "Project.ProjectGroups.Users.username", "Project->ProjectGroups->Users"."email" AS "Project.ProjectGroups.Users.email", "Project->ProjectGroups->Users"."name" AS "Project.ProjectGroups.Users.name", "Project->ProjectGroups->Users"."surname" AS "Project.ProjectGroups.Users.surname", "Project->ProjectGroups->Users"."password" AS "Project.ProjectGroups.Users.password", "Project->ProjectGroups->Users"."receiveNotifications" AS "Project.ProjectGroups.Users.receiveNotifications", "Project->ProjectGroups->Users"."signature" AS "Project.ProjectGroups.Users.signature", "Project->ProjectGroups->Users"."tokenKey" AS "Project.ProjectGroups.Users.tokenKey", "Project->ProjectGroups->Users"."language" AS "Project.ProjectGroups.Users.language", "Project->ProjectGroups->Users"."tasklistLayout" AS "Project.ProjectGroups.Users.tasklistLayout", "Project->ProjectGroups->Users"."taskLayout" AS "Project.ProjectGroups.Users.taskLayout", "Project->ProjectGroups->Users"."createdAt" AS "Project.ProjectGroups.Users.createdAt", "Project->ProjectGroups->Users"."updatedAt" AS "Project.ProjectGroups.Users.updatedAt", "Project->ProjectGroups->Users"."RoleId" AS "Project.ProjectGroups.Users.RoleId", "Project->ProjectGroups->Users"."CompanyId" AS "Project.ProjectGroups.Users.CompanyId", "Project->ProjectGroups->Users->user_belongs_to_group"."createdAt" AS "Project.ProjectGroups.Users.user_belongs_to_group.createdAt", "Project->ProjectGroups->Users->user_belongs_to_group"."updatedAt" AS "Project.ProjectGroups.Users.user_belongs_to_group.updatedAt", "Project->ProjectGroups->Users->user_belongs_to_group"."UserId" AS "Project.ProjectGroups.Users.user_belongs_to_group.UserId", "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AS "Project.ProjectGroups.Users.user_belongs_to_group.ProjectGroupId" FROM (SELECT "Task"."id", "Task"."title", "Task"."important", "Task"."closeDate", "Task"."deadline", "Task"."description", "Task"."overtime", "Task"."pausal", "Task"."pendingChangable", "Task"."pendingDate", "Task"."statusChange", "Task"."invoicedDate", "Task"."invoiced", "Task"."createdAt", "Task"."updatedAt", "Task"."UserId", "Task"."ProjectId", "Task"."TaskTypeId", "Task"."CompanyId", "Task"."StatusId", "Task"."MilestoneId", "Task"."createdById", "Task"."requesterId", "Task"."RepeatId", "Project"."id" AS "Project.id", "Project"."title" AS "Project.title", "Project"."description" AS "Project.description", "Project"."lockedRequester" AS "Project.lockedRequester", "Project"."autoApproved" AS "Project.autoApproved", "Project"."defAssignedToDef" AS "Project.defAssignedToDef", "Project"."defAssignedToFixed" AS "Project.defAssignedToFixed", "Project"."defAssignedToRequired" AS "Project.defAssignedToRequired", "Project"."defCompanyDef" AS "Project.defCompanyDef", "Project"."defCompanyFixed" AS "Project.defCompanyFixed", "Project"."defCompanyRequired" AS "Project.defCompanyRequired", "Project"."defOvertimeDef" AS "Project.defOvertimeDef", "Project"."defOvertimeFixed" AS "Project.defOvertimeFixed", "Project"."defOvertimeRequired" AS "Project.defOvertimeRequired", "Project"."defOvertimeValue" AS "Project.defOvertimeValue", "Project"."defPausalDef" AS "Project.defPausalDef", "Project"."defPausalFixed" AS "Project.defPausalFixed", "Project"."defPausalRequired" AS "Project.defPausalRequired", "Project"."defPausalValue" AS "Project.defPausalValue", "Project"."defRequesterDef" AS "Project.defRequesterDef", "Project"."defRequesterFixed" AS "Project.defRequesterFixed", "Project"."defRequesterRequired" AS "Project.defRequesterRequired", "Project"."defStatusDef" AS "Project.defStatusDef", "Project"."defStatusFixed" AS "Project.defStatusFixed", "Project"."defStatusRequired" AS "Project.defStatusRequired", "Project"."defTagDef" AS "Project.defTagDef", "Project"."defTagFixed" AS "Project.defTagFixed", "Project"."defTagRequired" AS "Project.defTagRequired", "Project"."defTaskTypeDef" AS "Project.defTaskTypeDef", "Project"."defTaskTypeFixed" AS "Project.defTaskTypeFixed", "Project"."defTaskTypeRequired" AS "Project.defTaskTypeRequired", "Project"."createdAt" AS "Project.createdAt", "Project"."updatedAt" AS "Project.updatedAt", "Project"."UserId" AS "Project.UserId", "Project"."defCompanyId" AS "Project.defCompanyId", "Project"."defRequesterId" AS "Project.defRequesterId", "Project"."defTaskTypeId" AS "Project.defTaskTypeId", "Project"."TaskTypeId" AS "Project.TaskTypeId", "Project"."CompanyId" AS "Project.CompanyId" FROM "tasks" AS "Task" INNER JOIN "projects" AS "Project" ON "Task"."ProjectId" = "Project"."id"`;

/*
HELPER EXAMPLES
Bottom
("Task"."pausal" = 'no' OR "Project->ProjectGroups->ProjectGroupRight"."pausalRead" = false)

("Task"."title" LIKE '%AAA%' OR "Task"."id" LIKE '%AAA%')
("assignedTosFilter"."id" IN (1, 2, 3, 447)
("assignedTosFilter"."id" IN (1, 2) OR "Project->ProjectGroups->ProjectGroupRight"."assignedRead" = false) - if not admin
("Task"."closeDate" >= '2021-03-24 15:06:54' OR "Project->ProjectGroups->ProjectGroupRight"."statusRead" = false)
("Task"."closeDate" <= '2021-03-24 15:22:34' OR "Project->ProjectGroups->ProjectGroupRight"."statusRead" = false)
("Task"."CompanyId" IN (1) OR "Project->ProjectGroups->ProjectGroupRight"."companyRead" = false)
("Task"."deadline" >= '2021-03-24 15:24:12' OR "Project->ProjectGroups->ProjectGroupRight"."deadlineRead" = false)
("Task"."deadline" <= '2021-03-24 15:24:12' OR "Project->ProjectGroups->ProjectGroupRight"."deadlineRead" = false)
("Task"."pendingDate" >= '2021-03-24 15:25:45')
("Task"."pendingDate" <= '2021-03-24 15:25:45')
("Task"."requesterId" IN (1) OR "Project->ProjectGroups->ProjectGroupRight"."requesterRead" = false)
("Task"."statusChange" >= '2021-03-24 15:27:08' OR "Project->ProjectGroups->ProjectGroupRight"."statusRead" = false)
("Task"."statusChange" <= '2021-03-24 15:27:08' OR "Project->ProjectGroups->ProjectGroupRight"."statusRead" = false)
("ScheduledTasks"."from" >= '2021-03-24 15:28:02' OR "ScheduledTasks"."to" >= '2021-03-24 15:28:02' OR "Project->ProjectGroups->ProjectGroupRight"."assignedRead" = false)
("ScheduledTasks"."from" <= '2021-03-24 15:28:02' OR "ScheduledTasks"."to" <= '2021-03-24 15:28:02' OR "Project->ProjectGroups->ProjectGroupRight"."assignedRead" = false)
("Task"."createdAt" <= '2021-03-24 15:28:39')
("Task"."createdAt" >= '2021-03-24 15:28:39')
("Task"."TaskTypeId" IN (1, 2) OR "Project->ProjectGroups->ProjectGroupRight"."typeRead" = false)


String Filter
"Task"."id" LIKE '%666%'
"Task"."title" LIKE '%666%'
"Task"."overtime" = false
"Task"."pausal" = false
DATE_FORMAT(Task.deadline, \"%H:%i %e.%c.%Y\") LIKE '%666%'
DATE_FORMAT(Task.createdAt, \"%H:%i %e.%c.%Y\") LIKE '%666%'
"Status"."title" LIKE '%666%'
"Company"."title" LIKE '%666%'
"Project"."title" LIKE '%666%'
"TaskType"."title" LIKE '%666%'
"Milestone"."title" LIKE '%666%'
("requester"."name" LIKE '%666%' OR "requester"."surname" LIKE '%666%')
("assignedTosFilter"."name" LIKE '%666%' OR "assignedTosFilter"."surname" LIKE '%666%')
"tagsFilter"."title" LIKE '%666%'
*/
