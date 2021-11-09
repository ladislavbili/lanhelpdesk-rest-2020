import {
  toDBDate,
  createModelAttributes,
  removeLastComma,
  generateFullNameSQL,
} from '../sqlFunctions';
import { models } from '@/models';

export const generateInvoiceAgentsSQL = (fromDate, toDate, statusActions, invoiced) => {
  const sqlStatusActions = statusActions.reduce((acc, statusAction, index) => `${acc}${index === 0 ? '' : ','}'${statusAction}'`, '');
  const attributes = (
    `
    ${invoiced ? '"User"."UserId"' : '"User"."id"'} AS "user.id",
    "User"."name"  AS "user.name",
    "User"."surname"  AS "user.surname",
    ${generateFullNameSQL('User', "user")}
    "User"."email"  AS "user.email",
    CASE WHEN SUM("Subtask"."quantity") IS NULL THEN 0 ELSE SUM("Subtask"."quantity") END AS "works",
    CASE WHEN SUM("WorkTrip"."quantity") IS NULL THEN 0 ELSE SUM("WorkTrip"."quantity") END AS "trips",
    `
  );

  //TODO: add filter by invoiced status action, add action to invoiced task data
  const sql = (
    `
    SELECT
    ${removeLastComma(attributes)}
    FROM ${ invoiced ? 'invoiced_task_users' : 'users'} AS "User"
    LEFT OUTER JOIN "subtasks" AS "Subtask" ON
    ${invoiced ? '"Subtask"."id" = "User"."SubtaskId"' : '"Subtask"."UserId" = "User"."id"'} AND
    "Subtask"."invoiced" = ${invoiced}
    LEFT OUTER JOIN "work_trips" AS "WorkTrip" ON
    ${invoiced ? '"WorkTrip"."id" = "User"."WorkTripId"' : '"WorkTrip"."UserId" = "User"."id"'} AND
    "WorkTrip"."invoiced" = ${invoiced}
    INNER JOIN "tasks" as "Task" ON
    ( "Task"."id" = "WorkTrip"."TaskId" OR "Task"."id" = "Subtask"."TaskId" ) AND
    ${ invoiced ?
      `
      "Task"."closeDate" >= '${toDBDate(fromDate)}' AND
      "Task"."closeDate" <= '${toDBDate(toDate)}'
      ` :
      `
      "Task"."statusChange" >= '${toDBDate(fromDate)}' AND
      "Task"."statusChange" <= '${toDBDate(toDate)}'
      `
    }
    INNER JOIN "statuses" AS "Status" ON
    "Task"."StatusId" = "Status"."id" AND
    "Status"."action" IN ( ${sqlStatusActions} )
    WHERE (
      "Subtask"."quantity" > 0 OR
      "WorkTrip"."quantity" > 0
    )
    GROUP BY "User"."${ invoiced ? 'UserId' : 'id'}"
    `
  );

  return sql.replace(/"/g, '`');
}

export const generateAgentInvoiceSQL = (fromDate, toDate, statusActions, invoiced, userId) => {
  const sqlStatusActions = statusActions.reduce((acc, statusAction, index) => `${acc}${index === 0 ? '' : ','}'${statusAction}'`, '');
  const attributes = (
    `
    ${createModelAttributes("Task", null, models.Task)}
    ${createModelAttributes("Subtask", "Subtask", models.Subtask)}
    ${createModelAttributes("WorkTrip", "WorkTrip", models.WorkTrip)}
    ${ invoiced ?
      `
      ${createModelAttributes("InvoicedTask", "InvoicedTask", models.InvoicedTask)}
      ${createModelAttributes("InvoicedTask->requester", "InvoicedTask.requester", models.InvoicedTaskUser)}
      ${createModelAttributes("InvoicedTask->assignedTos", "InvoicedTask.assignedTos", models.InvoicedTaskUser)}
      ${createModelAttributes("InvoicedTask->createdBy", "InvoicedTask.createdBy", models.InvoicedTaskUser)}
      ` :
      `
      ${ createModelAttributes("Company", "Company", models.Company)}
      ${ createModelAttributes("TaskType", "TaskType", models.TaskType)}
      ${ createModelAttributes("Status", "Status", models.Status)}
      ${ createModelAttributes("requester", "requester", models.User)}
      ${ generateFullNameSQL('requester')}
      ${ createModelAttributes("assignedTos", "assignedTos", models.User)}
      ${ generateFullNameSQL('assignedTos')}
      ${ createModelAttributes("Subtask->type", "Subtask.TaskType", models.TaskType)}
      ${ createModelAttributes("Subtask->assignedTo", "Subtask.assignedTo", models.User)}
      ${ generateFullNameSQL("Subtask->assignedTo", "Subtask.assignedTo")}
      ${ createModelAttributes("WorkTrip->type", "WorkTrip.TripType", models.TripType)}
      ${ createModelAttributes("WorkTrip->assignedTo", "WorkTrip.assignedTo", models.User)}
      ${ generateFullNameSQL("WorkTrip->assignedTo", "WorkTrip.assignedTo")}
      `
    }
    `
  );

  //TODO: add filter by invoiced status action, add action to invoiced task data, edit status in case of invoiced can be deleted
  const sql = (
    `
    SELECT
    ${ removeLastComma(attributes)}
    FROM(
      SELECT
      ${
    removeLastComma(
      invoiced ?
        `
          ${createModelAttributes("User", null, models.InvoicedTaskUser)}
          ` :
        `
          ${createModelAttributes("User", null, models.User)}
          ${generateFullNameSQL('User')}
          `
    )}
        FROM "${ invoiced ? 'invoiced_task_users' : 'users'}" AS "User"
        WHERE
        "User"."${invoiced ? "UserId" : "id"}" = ${userId}
        GROUP BY "User"."${invoiced ? "UserId" : "id"}"
      ) AS "User"

      LEFT OUTER JOIN "subtasks" AS "Subtask" ON
      ${ invoiced ? '"Subtask"."id" = "User"."SubtaskId"' : '"Subtask"."UserId" = "User"."id"'} AND
      "Subtask"."invoiced" = ${ invoiced}
      LEFT OUTER JOIN "work_trips" AS "WorkTrip" ON
      ${ invoiced ? '"WorkTrip"."id" = "User"."WorkTripId"' : '"WorkTrip"."UserId" = "User"."id"'} AND
      "WorkTrip"."invoiced" = ${ invoiced}
      INNER JOIN "tasks" as "Task" ON
      ("Task"."id" = "WorkTrip"."TaskId" OR "Task"."id" = "Subtask"."TaskId") AND
      ${
    invoiced ?
      `
        "Task"."closeDate" >= '${toDBDate(fromDate)}' AND
        "Task"."closeDate" <= '${toDBDate(toDate)}'
        ` :
      `
        "Task"."statusChange" >= '${toDBDate(fromDate)}' AND
        "Task"."statusChange" <= '${toDBDate(toDate)}'
        `
    }
      INNER JOIN "statuses" AS "Status" ON
      "Task"."StatusId" = "Status"."id" AND
      "Status"."action" IN(${ sqlStatusActions})
      ${
    invoiced ?
      `
        INNER JOIN "invoiced_tasks" AS "InvoicedTask" ON "InvoicedTask"."TaskId" = "Task"."id"
        INNER JOIN "invoiced_task_users" AS "InvoicedTask->requester" ON "InvoicedTask->requester"."requesterId" = "InvoicedTask"."id"
        INNER JOIN "invoiced_task_users" AS "InvoicedTask->assignedTos" ON "InvoicedTask->assignedTos"."assignedToId" = "InvoicedTask"."id"
        INNER JOIN "invoiced_task_users" AS "InvoicedTask->createdBy" ON "InvoicedTask->createdBy"."createdById" = "InvoicedTask"."id"
        ` :
      `
        INNER JOIN "task_types" AS "TaskType" ON "TaskType"."id" = "Task"."TaskTypeId"
        LEFT OUTER JOIN "companies" AS "Company" ON "Company"."id" = "Task"."CompanyId"
        LEFT OUTER JOIN "users" AS "requester" ON "requester"."id" = "Task"."RequesterId"
        LEFT OUTER JOIN (
          "task_assignedTo" AS "assignedTos->task_assignedTo" INNER JOIN "users" AS "assignedTos" ON "assignedTos"."id" = "assignedTos->task_assignedTo"."UserId"
        ) ON "Task"."id" = "assignedTos->task_assignedTo"."TaskId"
        LEFT OUTER JOIN "task_types" AS "Subtask->type" ON "Subtask->type"."id" = "Subtask"."TaskTypeId"
        LEFT OUTER JOIN "users" AS "Subtask->assignedTo" ON "Subtask->assignedTo"."id" = "Subtask"."UserId"
        LEFT OUTER JOIN "trip_types" AS "WorkTrip->type" ON "WorkTrip->type"."id" = "WorkTrip"."TripTypeId"
        LEFT OUTER JOIN "users" AS "WorkTrip->assignedTo" ON "WorkTrip->assignedTo"."id" = "WorkTrip"."UserId"
        `
    }
      ORDER BY "Task"."closeDate" ASC
      `
  );

  return sql.replace(/"/g, '`');
}
