import {
  toDBDate,
  createModelAttributes,
  generateFullNameSQL,
  removeLastComma,
} from '../sqlFunctions';
import { models } from '@/models';

export const generateCompanyInvoiceSQL = (fromDate, toDate, companyId) => {
  const attributes = (
    `
    ${createModelAttributes("Task", null, models.Task)}
    ${createModelAttributes("TaskType", "TaskType", models.TaskType)}
    ${createModelAttributes("Status", "Status", models.Status)}
    ${createModelAttributes("requester", "requester", models.User)}
    ${generateFullNameSQL('requester')}
    ${createModelAttributes("assignedTos", "assignedTos", models.User)}
    ${generateFullNameSQL('assignedTos')}
    ${createModelAttributes("Subtask", "Subtask", models.Subtask)}
    ${createModelAttributes("Subtask->type", "Subtask.TaskType", models.TaskType)}
    ${createModelAttributes("WorkTrip", "WorkTrip", models.WorkTrip)}
    ${createModelAttributes("WorkTrip->type", "WorkTrip.TripType", models.TripType)}
    ${createModelAttributes("Material", "Material", models.Material)}
     `
  );

  const sql = (
    `
    SELECT
    ${removeLastComma(attributes)}
    FROM (
        SELECT
        ${removeLastComma(createModelAttributes("Task", null, models.Task))}
        FROM "tasks" AS "Task"
        INNER JOIN "statuses" AS "Status" ON
          "Task"."StatusId" = "Status"."id" AND
          "Status"."action" = 'CloseDate'
        WHERE
          "Task"."CompanyId" = ${companyId} AND
          "Task"."closeDate" IS NOT NULL AND
          "Task"."closeDate" >= '${toDBDate(fromDate)}' AND
          "Task"."closeDate" <= '${toDBDate(toDate)}'
    ) AS "Task"
    INNER JOIN "statuses" AS "Status" ON "Status"."id" = "Task"."StatusId"
    INNER JOIN "task_types" AS "TaskType" ON "TaskType"."id" = "Task"."TaskTypeId"
    LEFT OUTER JOIN "users" AS "requester" ON "requester"."id" = "Task"."RequesterId"
    LEFT OUTER JOIN (
      "task_assignedTo" AS "assignedTos->task_assignedTo" INNER JOIN "users" AS "assignedTos" ON "assignedTos"."id" = "assignedTos->task_assignedTo"."UserId"
    ) ON "Task"."id" = "assignedTos->task_assignedTo"."TaskId"
    LEFT OUTER JOIN "subtasks" AS "Subtask" ON "Subtask"."TaskId" = "Task"."id"
    LEFT OUTER JOIN "task_types" AS "Subtask->type" ON "Subtask->type"."id" = "Subtask"."TaskTypeId"
    LEFT OUTER JOIN "work_trips" AS "WorkTrip" ON "WorkTrip"."TaskId" = "Task"."id"
    LEFT OUTER JOIN "trip_types" AS "WorkTrip->type" ON "WorkTrip->type"."id" = "WorkTrip"."TripTypeId"
    LEFT OUTER JOIN "materials" AS "Material" ON "Material"."TaskId" = "Task"."id"
    ORDER BY "Task"."closeDate" ASC
    `
  );

  return sql.replace(/"/g, '`');
}
