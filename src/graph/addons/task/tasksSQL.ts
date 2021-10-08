import moment from 'moment';
import { models } from '@/models';
import { capitalizeFirstLetter } from '@/helperFunctions';
import { allStringFilters } from '@/configs/taskConstants';

import {
  toDBDate,
  createModelAttributes,
  generateFullNameSQL,
  removeLastComma,
} from '../sqlFunctions';

const rightExists = (isAdmin, right) => {
  if (isAdmin) {
    return `(
      "Project->AdminProjectGroups->ProjectGroupRight"."${right}" = true OR
      "Project->ProjectGroups->ProjectGroupRight"."${right}" = true
    )`;
  }
  return `"Project->ProjectGroups->ProjectGroupRight"."${right}" = true`;
};

export const transformSortToQueryString = (sort, main, gantt = false) => {
  const order = sort.asc ? "ASC" : "DESC";
  const separator = main ? '"."' : '.';
  let orderBy = '';
  switch (sort.key) {
    case 'assignedTo': {
      orderBy = `ISNULL("assignedTos${separator}id") ASC, "assignedTos${separator}name" ${order}, "assignedTos${separator}surname" ${order}`;
      break;
    }
    case 'status': {
      orderBy = `ISNULL("Status${separator}id") ASC, "Status${separator}order" ${order}, "Project.title" ${order}`;
      break;
    }
    case 'requester': {
      orderBy = `ISNULL("requester${separator}id") ASC, "requester${separator}name" ${order}, "requester${separator}surname" ${order}`;
      break;
    }
    case 'id': case 'title': case 'deadline': case 'createdAt': case 'startsAt': case 'updatedAt': {
      orderBy = `ISNULL(${main ? "Task" : "TaskData"}."${sort.key}") ASC, ${main ? "Task" : "TaskData"}."${sort.key}" ${order}`;
      break;
    }
    case 'important': {
      orderBy = `${main ? "Task" : "TaskData"}."important" ${order}`;
      break;
    }
    default: {
      orderBy = `${main ? "Task" : "TaskData"}."id" ${order}`;
    }
  }
  if (gantt) {
    return `ISNULL("Milestone.order") ASC,"Milestone.order" ASC, ${orderBy}, ${main ? "Task" : "TaskData"}."id" DESC`;
  }

  return `${orderBy}, ${main ? "Task" : "TaskData"}."id" DESC`;
}

export const filterToTaskWhereSQL = (filter, userId, companyId, isAdmin) => {

  let where = [];
  // bool attributes
  [
    {
      key: 'important',
      value: filter.important,
      withRight: true,
      right: 'taskImportant'
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
      right: 'pausalView'
    },
    {
      key: 'overtime',
      value: filter.overtime,
      withRight: true,
      right: 'overtimeView'
    },
  ].forEach((attribute) => {

    if (attribute.value !== null && attribute.value !== undefined) {
      if (attribute.withRight) {
        where.push(
          `(
            "Task"."${attribute.key}" = ${attribute.value} AND
            ${rightExists(isAdmin, attribute.right)}
          )`
        )
      } else {
        where.push(
          `"Task"."${attribute.key}" = ${attribute.value}`
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
      right: 'taskTypeView',
    },
    {
      key: 'CompanyId',
      value: filter.companyCur ? [...filter.companies, companyId] : filter.companies,
      withRight: true,
      right: 'companyView',
    },
    {
      key: 'requesterId',
      value: filter.requesterCur ? [...filter.requesters, userId] : filter.requesters,
      withRight: true,
      right: 'requesterView',
    },
  ].forEach((attribute) => {
    if (attribute.value.length > 0) {
      if (attribute.withRight) {
        where.push(
          `(
              "Task"."${attribute.key}" IN (${attribute.value.toString()}) AND
              ${rightExists(isAdmin, attribute.right)}
            )`
        )
      } else {
        where.push(
          `"Task"."${attribute.key}" IN (${attribute.value.toString()})`
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
      withRight: true,
      right: 'statusView',
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
      right: 'statusView',
    },
    {
      target: 'deadline',
      fromNow: filter.deadlineFromNow,
      toNow: filter.deadlineToNow,
      from: filter.deadlineFrom,
      to: filter.deadlineTo,
      withRight: true,
      right: 'deadlineView',
    },
    {
      target: 'createdAt',
      fromNow: filter.createdAtFromNow,
      toNow: filter.createdAtToNow,
      from: filter.createdAtFrom,
      to: filter.createdAtTo,
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
      condition.push(`("Task"."${target}" >= '${from.toISOString().slice(0, 19).replace('T', ' ')}')`)
    }
    if (to) {
      condition.push(`("Task"."${target}" <= '${to.toISOString().slice(0, 19).replace('T', ' ')}')`)
    }
    if (from || to) {
      if (withRight) {
        where.push(`(
          ( ${condition.join(' AND ')} ) AND
          ${rightExists(isAdmin, right)}
        )`);
      } else {
        where.push(`( ${condition.join(' AND ')} )`);
      }
    }
  });

  const assignedWhere = getAssignedTosWhereSQL(filter, userId, isAdmin);
  if (assignedWhere !== null) {
    where.push(assignedWhere);
  }
  const tagsWhere = getTagsWhereSQL(filter, userId, isAdmin);
  if (tagsWhere !== null) {
    where.push(tagsWhere);
  }
  /*
  const scheduledWhere = getScheduledWhereSQL(filter);
  if (scheduledWhere !== null) {
    where.push(scheduledWhere);
  }
  */
  return where;
}

const getAssignedTosWhereSQL = (filter, userId, isAdmin) => {
  const ids = filter.assignedToCur ? [...filter.assignedTos, userId] : filter.assignedTos;
  if (ids.length > 0) {
    return `(
      "assignedTosFilter"."id" IN (${ids.toString()}) AND
      ${rightExists(isAdmin, 'assignedView')}
    )
    `
  }
  return null;
}

const getTagsWhereSQL = (filter, userId, isAdmin) => {
  const ids = filter.tags;
  if (ids.length > 0) {
    return `(
      "tagsFilter"."id" IN (${ids.toString()}) AND
      ${rightExists(isAdmin, 'tagsView')}
    )
    `
  }
  return null;
}

const getScheduledWhereSQL = (filter, isAdmin) => {
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
      ("ScheduledWorks"."from" >= '${from.toISOString().slice(0, 19).replace('T', ' ')}') OR
      ("ScheduledWorks"."to" >= '${from.toISOString().slice(0, 19).replace('T', ' ')}')
    )`)
  }
  if (to) {
    //to plati ak FROM je mensi alebo rovnaky alebo TO je mensi alebo rovnaky
    conditions.push(`(
      ("ScheduledWorks"."from" <= '${to.toISOString().slice(0, 19).replace('T', ' ')}') OR
      ("ScheduledWorks"."to" <= '${to.toISOString().slice(0, 19).replace('T', ' ')}')
    )`)
  }

  //podmienky platia ak CONDITION je splneny alebo nema pravo scheduled citat
  return `(
    (${conditions.join(' AND ')}) AND
    ${rightExists(isAdmin, 'assignedView')}
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
    const filterItems = allStringFilters.map((filter) => {
      if (filter.isDate) {
        if (stringFilter[filter.key + "From"] === null || stringFilter[filter.key + "To"] === null) {
          return {
            value: null,
            key: filter.key
          }
        }
        return {
          value: {
            from: stringFilter[filter.key + "From"],
            to: stringFilter[filter.key + "To"],
          },
          key: filter.key
        }
      }
      return { value: stringFilter[filter.key], key: filter.key }
    }).filter((filterItem) => filterItem.value !== undefined && filterItem.value !== null && filterItem.value.length !== 0);
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
        case 'startsAt': case 'deadline': case 'createdAt': {
          where.push(`(
            "Task"."${filterItem.key}" BETWEEN '${toDBDate(filterItem.value.from)}' AND '${toDBDate(filterItem.value.to)}'
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
        default: {
          break;
        }
      }
    })
  }
  return where;
}

export const generateTasksSQL = (userId, companyId, isAdmin, where, mainOrderBy, secondaryOrderBy, limit, offset) => {

  const outerSQLTop = (
    `
    SELECT "TaskData".*,
    "SubtaskCounts"."subtasksQuantity" as subtasksQuantity,
    "SubtaskCounts"."approvedSubtasksQuantity" as approvedSubtasksQuantity,
    "SubtaskCounts"."pendingSubtasksQuantity" as pendingSubtasksQuantity,
    "WorkTrips"."workTripsQuantity" as workTripsQuantity,
    "Materials"."materialsPrice" as materialsPrice,
    "Materials"."approvedMaterialsPrice" as approvedMaterialsPrice,
    "Materials"."pendingMaterialsPrice" as pendingMaterialsPrice,
    ${createModelAttributes("assignedTos", "assignedTos", models.User)}
    ${generateFullNameSQL('assignedTos')}
    ${createModelAttributes("assignedTos->task_assignedTo", "assignedTos.task_assignedTo", null, 'assignedTosTaskMapAttributes')}
    ${createModelAttributes("Tags", "Tags", models.Tag)}
    ${createModelAttributes("Subtasks", "Subtasks", models.Subtask)}
    ${createModelAttributes("Subtasks->User", "Subtasks.User", models.User)}
    ${generateFullNameSQL('Subtasks->User', 'Subtasks.User')}
    ${removeLastComma(createModelAttributes("Tags->task_has_tags", "Tags.task_has_tags", null, 'tagsTaskMapAttributes'))}

    FROM (
      `
  );

  const baseSQL = (
    `
      SELECT "Task".*,
      COUNT(*) OVER () as count,
      ${createModelAttributes("assignedTosFilter", "assignedTosFilter", models.User)}
      ${createModelAttributes("assignedTosFilter->task_assignedTo", "assignedTosFilter.task_assignedTo", null, 'assignedTosTaskMapAttributes')}
      ${createModelAttributes("Company", "Company", models.Company)}
      ${createModelAttributes("createdBy", "createdBy", models.User)}
      ${generateFullNameSQL('createdBy')}
      ${createModelAttributes("Milestone", "Milestone", models.Milestone)}
      ${createModelAttributes("requester", "requester", models.User)}
      ${generateFullNameSQL('requester')}
      ${createModelAttributes("Status", "Status", models.Status)}

      "tagsFilter"."id" AS "tagsFilter.id",
      "tagsFilter"."title" AS "tagsFilter.title",
      ${createModelAttributes("tagsFilter->task_has_tags", "tagsFilter.task_has_tags", null, 'tagsTaskMapAttributes')}
      ${createModelAttributes("TaskType", "TaskType", models.TaskType)}
      ${createModelAttributes("Repeat", "Repeat", models.Repeat)}
      ${createModelAttributes("TaskMetadata", "TaskMetadata", models.TaskMetadata)}
      ${ isAdmin ?
      `
        ${createModelAttributes("Project->AdminProjectGroups", "Project.AdminProjectGroup", models.ProjectGroup)}
        ${createModelAttributes("Project->AdminProjectGroups->ProjectGroupRight", "Project.AdminProjectGroup.ProjectGroupRight", models.ProjectGroupRights)}
      ` :
      ''
    }
      ${createModelAttributes("Project->ProjectGroups", "Project.ProjectGroups", models.ProjectGroup)}
      ${createModelAttributes("Project->ProjectGroups->ProjectGroupRight", "Project.ProjectGroups.ProjectGroupRight", models.ProjectGroupRights)}
      ${createModelAttributes("Project->ProjectGroups->Users", "Project.ProjectGroups.Users", models.User)}
      ${removeLastComma(createModelAttributes("Project->ProjectGroups->Users->user_belongs_to_group", "Project.ProjectGroups.Users.user_belongs_to_group", null, 'userBelongsToGroupAttributes'))}
      FROM (
        SELECT DISTINCT
        ${createModelAttributes("Task", null, models.Task)}
        ${removeLastComma(createModelAttributes("Project", "Project", models.Project))}
        FROM "tasks" AS "Task"
        INNER JOIN "projects" AS "Project" ON "Task"."ProjectId" = "Project"."id"
      ) AS "Task"
        `
  );

  const outerSQLBottom = (
    `
      ) as TaskData
      LEFT OUTER JOIN (
        "task_assignedTo" AS "assignedTos->task_assignedTo" INNER JOIN "users" AS "assignedTos" ON "assignedTos"."id" = "assignedTos->task_assignedTo"."UserId"
      ) ON "TaskData"."id" = "assignedTos->task_assignedTo"."TaskId"
      LEFT OUTER JOIN (
        "task_has_tags" AS "Tags->task_has_tags" INNER JOIN "tags" AS "Tags" ON "Tags"."id" = "Tags->task_has_tags"."TagId"
      ) ON "TaskData"."id" = "Tags->task_has_tags"."TaskId"
      LEFT OUTER JOIN "subtasks" AS "Subtasks" ON "TaskData"."id" = "Subtasks"."TaskId"
      LEFT OUTER JOIN "users" AS "Subtasks->User" ON "Subtasks"."UserId" = "Subtasks->User"."id"
      LEFT OUTER JOIN (
        SELECT
        "Subtasks"."TaskId",
        SUM( "Subtasks"."quantity" ) as subtasksQuantity,
        SUM( CASE WHEN "Subtasks"."approved" THEN "Subtasks"."quantity" ELSE 0 END ) as approvedSubtasksQuantity,
        SUM( CASE WHEN "Subtasks"."approved" THEN 0 ELSE "Subtasks"."quantity" END ) as pendingSubtasksQuantity
        FROM "subtasks" AS Subtasks GROUP BY "Subtasks"."TaskId"
      ) AS "SubtaskCounts" ON "SubtaskCounts"."TaskId" = "TaskData"."id"
      LEFT OUTER JOIN (
        SELECT "WorkTrips"."TaskId", COUNT( "WorkTrips"."id" ) as workTripsQuantity FROM "work_trips" AS WorkTrips GROUP BY "WorkTrips"."TaskId"
      ) AS "WorkTrips" ON "WorkTrips"."TaskId" = "TaskData"."id"
      LEFT OUTER JOIN (
        SELECT
        "Materials"."TaskId",
        SUM( "Materials"."quantity" * "Materials"."price" ) as materialsPrice,
        SUM( CASE WHEN "Materials"."approved" THEN "Materials"."quantity" * "Materials"."price" ELSE 0 END ) as approvedMaterialsPrice,
        SUM( CASE WHEN "Materials"."approved" THEN 0 ELSE "Materials"."quantity" * "Materials"."price" END ) as pendingMaterialsPrice
        FROM "materials" AS Materials GROUP BY "Materials"."TaskId"
      ) AS "Materials" ON "Materials"."TaskId" = "TaskData"."id"
      `
  );

  const notAdminWhere = (
    `
    ${where.length > 0 ? 'AND ' : ''}(
      "Task"."createdById" = ${userId} OR
      "Task"."requesterId" = ${userId} OR
      "assignedTosFilter"."id" = ${userId} OR
      "Project->ProjectGroups->ProjectGroupRight"."allTasks" = true OR
      ("Project->ProjectGroups->ProjectGroupRight"."companyTasks" = true AND "Task"."CompanyId" = ${companyId})
    ) AND
    (
      "Project->ProjectGroups->Users"."id" IS NOT NULL OR
      "Project->ProjectGroups->Companies"."CompanyId" IS NOT NULL
    )
    `
  );

  //ORDER BY "Task"."important" DESC
  let sql = `
      ${outerSQLTop}
      ${baseSQL}
  `;
  sql = (
    `
    ${sql}
    LEFT OUTER JOIN ( "task_assignedTo" AS "assignedTosFilter->task_assignedTo" INNER JOIN "users" AS "assignedTosFilter" ON "assignedTosFilter"."id" = "assignedTosFilter->task_assignedTo"."UserId") ON "Task"."id" = "assignedTosFilter->task_assignedTo"."TaskId"
    LEFT OUTER JOIN "companies" AS "Company" ON "Task"."CompanyId" = "Company"."id"
    LEFT OUTER JOIN "users" AS "createdBy" ON "Task"."createdById" = "createdBy"."id"
    LEFT OUTER JOIN "milestone" AS "Milestone" ON "Task"."MilestoneId" = "Milestone"."id"
    LEFT OUTER JOIN "users" AS "requester" ON "Task"."requesterId" = "requester"."id"
    LEFT OUTER JOIN "statuses" AS "Status" ON "Task"."StatusId" = "Status"."id"
    LEFT OUTER JOIN (
      "task_has_tags" AS "tagsFilter->task_has_tags" INNER JOIN "tags" AS "tagsFilter" ON "tagsFilter"."id" = "tagsFilter->task_has_tags"."TagId"
    ) ON "Task"."id" = "tagsFilter->task_has_tags"."TaskId"
    LEFT OUTER JOIN "task_types" AS "TaskType" ON "Task"."TaskTypeId" = "TaskType"."id"
    LEFT OUTER JOIN "repeat" AS "Repeat" ON "Task"."RepeatId" = "Repeat"."id"
    LEFT OUTER JOIN "task_metadata" AS "TaskMetadata" ON "Task"."id" = "TaskMetadata"."TaskId"
    ${ isAdmin ?
      `
      INNER JOIN "project_group" AS "Project->AdminProjectGroups" ON
      "Project.id" = "Project->AdminProjectGroups"."ProjectId" AND
      "Project->AdminProjectGroups"."admin" = true AND
      "Project->AdminProjectGroups"."def" = true
      INNER JOIN "project_group_rights" AS "Project->AdminProjectGroups->ProjectGroupRight" ON "Project->AdminProjectGroups"."id" = "Project->AdminProjectGroups->ProjectGroupRight"."ProjectGroupId"
      ` :
      ''
    }
    LEFT OUTER JOIN "project_group" AS "Project->ProjectGroups" ON "Project.id" = "Project->ProjectGroups"."ProjectId"
    LEFT OUTER JOIN "project_group_rights" AS "Project->ProjectGroups->ProjectGroupRight" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId"
    LEFT OUTER JOIN (
      "user_belongs_to_group" AS "Project->ProjectGroups->Users->user_belongs_to_group" INNER JOIN "users" AS "Project->ProjectGroups->Users" ON "Project->ProjectGroups->Users"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."UserId"
    ) ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AND "Project->ProjectGroups->Users"."id" = ${userId}
    LEFT OUTER JOIN "company_belongs_to_group" AS "Project->ProjectGroups->Companies" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Companies"."ProjectGroupId" AND "Project->ProjectGroups->Companies"."CompanyId" = ${companyId}
    `
  );

  if (where.length > 0 || !isAdmin) {
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

export const generateWorkCountsSQL = (userId, companyId, isAdmin, where) => {
  const notAdminWhere = (
    `
    ${where.length > 0 ? 'AND ' : ''}(
      "Task"."createdById" = ${userId} OR
      "Task"."requesterId" = ${userId} OR
      "assignedTosFilter"."id" = ${userId} OR
      "Project->ProjectGroups->ProjectGroupRight"."allTasks" = true OR
      ("Project->ProjectGroups->ProjectGroupRight"."companyTasks" = true AND "Task"."CompanyId" = ${companyId})
    ) AND
    (
      "Project->ProjectGroups->Users"."id" IS NOT NULL OR
      "Project->ProjectGroups->Companies"."CompanyId" IS NOT NULL
    )
    `
  );

  const sql = (
    `
    SELECT "TaskData".*,
    SUM( "SubtaskCounts"."approvedSubtasksQuantity" ) AS approvedSubtasks,
    SUM( "SubtaskCounts"."pendingSubtasksQuantity" ) AS pendingSubtasks,
    SUM( "MaterialCounts"."approvedMaterialsPrice" ) AS approvedMaterials,
    SUM( "MaterialCounts"."pendingMaterialsPrice" ) AS pendingMaterials
    FROM (
      SELECT "Task".*
      FROM (
        SELECT DISTINCT
        ${createModelAttributes("Task", null, models.Task)}
        ${removeLastComma(createModelAttributes("Project", "Project", models.Project))}
        FROM "tasks" AS "Task"
        INNER JOIN "projects" AS "Project" ON "Task"."ProjectId" = "Project"."id"
      ) AS "Task"
      LEFT OUTER JOIN "users" AS "requester" ON "Task"."requesterId" = "requester"."id"
      LEFT OUTER JOIN "statuses" AS "Status" ON "Task"."StatusId" = "Status"."id"
      LEFT OUTER JOIN "companies" AS "Company" ON "Task"."CompanyId" = "Company"."id"
      LEFT OUTER JOIN ( "task_assignedTo" AS "assignedTosFilter->task_assignedTo" INNER JOIN "users" AS "assignedTosFilter" ON "assignedTosFilter"."id" = "assignedTosFilter->task_assignedTo"."UserId") ON "Task"."id" = "assignedTosFilter->task_assignedTo"."TaskId"
      LEFT OUTER JOIN (
        "task_has_tags" AS "tagsFilter->task_has_tags" INNER JOIN "tags" AS "tagsFilter" ON "tagsFilter"."id" = "tagsFilter->task_has_tags"."TagId"
      ) ON "Task"."id" = "tagsFilter->task_has_tags"."TaskId"
      ${ isAdmin ?
      `
        INNER JOIN "project_group" AS "Project->AdminProjectGroups" ON
        "Project.id" = "Project->AdminProjectGroups"."ProjectId" AND
        "Project->AdminProjectGroups"."admin" = true AND
        "Project->AdminProjectGroups"."def" = true
        INNER JOIN "project_group_rights" AS "Project->AdminProjectGroups->ProjectGroupRight" ON "Project->AdminProjectGroups"."id" = "Project->AdminProjectGroups->ProjectGroupRight"."ProjectGroupId"
        ` :
      ''
    }
      LEFT OUTER JOIN "project_group" AS "Project->ProjectGroups" ON "Project.id" = "Project->ProjectGroups"."ProjectId"
      LEFT OUTER JOIN "project_group_rights" AS "Project->ProjectGroups->ProjectGroupRight" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId"
      LEFT OUTER JOIN (
        "user_belongs_to_group" AS "Project->ProjectGroups->Users->user_belongs_to_group" INNER JOIN "users" AS "Project->ProjectGroups->Users" ON "Project->ProjectGroups->Users"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."UserId"
      ) ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AND "Project->ProjectGroups->Users"."id" = ${userId}
      LEFT OUTER JOIN "company_belongs_to_group" AS "Project->ProjectGroups->Companies" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Companies"."ProjectGroupId" AND "Project->ProjectGroups->Companies"."CompanyId" = ${companyId}
     ${
    where.length > 0 || !isAdmin ?
      `WHERE ${where} ${isAdmin ? '' : `${notAdminWhere}`}` :
      ''
    }
    GROUP BY "Task"."id"
  ) AS TaskData
   LEFT OUTER JOIN (
     SELECT
     "Subtasks"."TaskId",
     SUM( "Subtasks"."quantity" ) as subtasksQuantity,
     SUM( CASE WHEN "Subtasks"."approved" THEN "Subtasks"."quantity" ELSE 0 END ) as approvedSubtasksQuantity,
     SUM( CASE WHEN "Subtasks"."approved" THEN 0 ELSE "Subtasks"."quantity" END ) as pendingSubtasksQuantity
     FROM "subtasks" AS "Subtasks" GROUP BY "Subtasks"."TaskId"
   ) AS "SubtaskCounts" ON "SubtaskCounts"."TaskId" = "TaskData"."id"

   LEFT OUTER JOIN (
     SELECT
     "Materials"."TaskId",
     SUM( "Materials"."quantity" * "Materials"."price" ) as materialsPrice,
     SUM( CASE WHEN "Materials"."approved" THEN "Materials"."quantity" * "Materials"."price" ELSE 0 END ) as approvedMaterialsPrice,
     SUM( CASE WHEN "Materials"."approved" THEN 0 ELSE "Materials"."quantity" * "Materials"."price" END ) as pendingMaterialsPrice
     FROM "materials" AS "Materials" GROUP BY "Materials"."TaskId"
   ) AS "MaterialCounts" ON "MaterialCounts"."TaskId" = "TaskData"."id"
    `
  );


  return sql.replace(/"/g, '`');
}
