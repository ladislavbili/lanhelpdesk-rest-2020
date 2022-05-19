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
    CASE WHEN SUM("SubtaskCounts"."subtasksQuantity") IS NULL THEN 0 ELSE SUM("SubtaskCounts"."subtasksQuantity") END AS "works",
    CASE WHEN SUM("WorkTripCounts"."workTripsQuantity") IS NULL THEN 0 ELSE SUM("WorkTripCounts"."workTripsQuantity") END AS "trips",
    `
  );

  const sql = (
    `
    SELECT
    ${removeLastComma(attributes)}
    FROM ${ invoiced ? 'invoiced_task_users' : 'users'} AS "User"

    LEFT OUTER JOIN (
      SELECT
      "Subtask"."id",
      "Subtask"."UserId",
      SUM( "Subtask"."quantity" ) as subtasksQuantity
      FROM "subtasks" AS "Subtask"

      INNER JOIN "tasks" as "Task" ON "Task"."id" = "Subtask"."TaskId" AND
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
      ${ invoiced ?
      `
          INNER JOIN "invoiced_tasks" AS "InvoicedTask" ON
          "Task"."id" = "InvoicedTask"."TaskId" AND
          "InvoicedTask"."statusAction" IN ( ${sqlStatusActions} )
        ` :
      `
          INNER JOIN "statuses" AS "Status" ON
          "Task"."StatusId" = "Status"."id" AND
          "Status"."action" IN ( ${sqlStatusActions} )
        `
    }
      WHERE "Subtask"."invoiced" = ${invoiced}
      GROUP BY "Subtask"."UserId"
    ) AS "SubtaskCounts" ON ${invoiced ? '"SubtaskCounts"."id" = "User"."SubtaskId"' : '"SubtaskCounts"."UserId" = "User"."id"'}

    LEFT OUTER JOIN (
      SELECT
      "WorkTrip"."id",
      "WorkTrip"."UserId",
      SUM( "WorkTrip"."quantity" ) as workTripsQuantity
      FROM "work_trips" AS "WorkTrip"

      INNER JOIN "tasks" as "Task" ON "Task"."id" = "WorkTrip"."TaskId" AND
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
      ${ invoiced ?
      `
          INNER JOIN "invoiced_tasks" AS "InvoicedTask" ON
          "Task"."id" = "InvoicedTask"."TaskId" AND
          "InvoicedTask"."statusAction" IN ( ${sqlStatusActions} )
        ` :
      `
          INNER JOIN "statuses" AS "Status" ON
          "Task"."StatusId" = "Status"."id" AND
          "Status"."action" IN ( ${sqlStatusActions} )
        `
    }
      WHERE "WorkTrip"."invoiced" = ${invoiced}
      GROUP BY "WorkTrip"."UserId"
    ) AS "WorkTripCounts" ON ${invoiced ? '"WorkTripCounts"."id" = "User"."WorkTripId"' : '"WorkTripCounts"."UserId" = "User"."id"'}

    WHERE (
      "SubtaskCounts"."subtasksQuantity" > 0 OR
      "WorkTripCounts"."workTripsQuantity" > 0
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

  const sql = (
    `
    SELECT
    ${ removeLastComma(attributes)}
    FROM "tasks" AS "Task"
    LEFT OUTER JOIN (
      SELECT "Subtask".*
      FROM "subtasks" AS "Subtask"
      INNER JOIN "${ invoiced ? 'invoiced_task_users' : 'users'}" AS "SubtaskUser" ON
      ${ invoiced ? `"SubtaskUser"."UserId" = ${userId} AND ` : `"SubtaskUser"."id" = ${userId} AND `}
      ${ invoiced ? '"Subtask"."id" = "SubtaskUser"."SubtaskId"' : `"Subtask"."UserId" = "SubtaskUser"."id"`}
    ) AS "Subtask" ON
      "Subtask"."TaskId" = "Task"."id"
    LEFT OUTER JOIN (
      SELECT "WorkTrip".*
      FROM "work_trips" AS "WorkTrip"
      INNER JOIN "${ invoiced ? 'invoiced_task_users' : 'users'}" AS "WorkTripUser" ON
      ${ invoiced ? `"WorkTripUser"."UserId" = ${userId} AND ` : `"WorkTripUser"."id" = ${userId} AND `}
      ${ invoiced ? '"WorkTrip"."id" = "WorkTripUser"."WorkTripId"' : `"WorkTrip"."UserId" = "WorkTripUser"."id"`}
    ) AS "WorkTrip" ON
      "WorkTrip"."TaskId" = "Task"."id"
    ${ invoiced ?
      `` :
      `
        INNER JOIN "statuses" AS "Status" ON
        "Task"."StatusId" = "Status"."id" AND
        "Status"."action" IN ( ${sqlStatusActions} )
      `
    }
    ${
    invoiced ?
      `
      INNER JOIN "invoiced_tasks" AS "InvoicedTask" ON
        "InvoicedTask"."TaskId" = "Task"."id" AND
        "InvoicedTask"."statusAction" IN ( ${sqlStatusActions} )
      INNER JOIN "invoiced_task_users" AS "InvoicedTask->requester" ON "InvoicedTask->requester"."requesterId" = "InvoicedTask"."id"
      INNER JOIN "invoiced_task_users" AS "InvoicedTask->assignedTos" ON "InvoicedTask->assignedTos"."assignedToId" = "InvoicedTask"."id"
      LEFT OUTER JOIN "invoiced_task_users" AS "InvoicedTask->createdBy" ON "InvoicedTask->createdBy"."createdById" = "InvoicedTask"."id"
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
    WHERE
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
      ORDER BY "Task"."closeDate" ASC
      `
  );

  return sql.replace(/"/g, '`');
}
