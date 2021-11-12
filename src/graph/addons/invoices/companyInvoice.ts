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
    ${createModelAttributes("createdBy", "createdBy", models.User)}
    ${generateFullNameSQL('createdBy')}
    ${createModelAttributes("requester", "requester", models.User)}
    ${generateFullNameSQL('requester')}
    ${createModelAttributes("assignedTos", "assignedTos", models.User)}
    ${generateFullNameSQL('assignedTos')}
    ${createModelAttributes("Subtask", "Subtask", models.Subtask)}
    ${createModelAttributes("Subtask->type", "Subtask.TaskType", models.TaskType)}
    ${createModelAttributes("Subtask->assignedTo", "Subtask.assignedTo", models.User)}
    ${generateFullNameSQL("Subtask->assignedTo", "Subtask.assignedTo")}
    ${createModelAttributes("WorkTrip", "WorkTrip", models.WorkTrip)}
    ${createModelAttributes("WorkTrip->type", "WorkTrip.TripType", models.TripType)}
    ${createModelAttributes("WorkTrip->assignedTo", "WorkTrip.assignedTo", models.User)}
    ${generateFullNameSQL("WorkTrip->assignedTo", "WorkTrip.assignedTo")}
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
    LEFT OUTER JOIN "users" AS "createdBy" ON "createdBy"."id" = "Task"."CreatedById"
    LEFT OUTER JOIN (
      "task_assignedTo" AS "assignedTos->task_assignedTo" INNER JOIN "users" AS "assignedTos" ON "assignedTos"."id" = "assignedTos->task_assignedTo"."UserId"
    ) ON "Task"."id" = "assignedTos->task_assignedTo"."TaskId"
    LEFT OUTER JOIN "subtasks" AS "Subtask" ON "Subtask"."TaskId" = "Task"."id"
    LEFT OUTER JOIN "task_types" AS "Subtask->type" ON "Subtask->type"."id" = "Subtask"."TaskTypeId"
    LEFT OUTER JOIN "users" AS "Subtask->assignedTo" ON "Subtask->assignedTo"."id" = "Subtask"."UserId"
    LEFT OUTER JOIN "work_trips" AS "WorkTrip" ON "WorkTrip"."TaskId" = "Task"."id"
    LEFT OUTER JOIN "trip_types" AS "WorkTrip->type" ON "WorkTrip->type"."id" = "WorkTrip"."TripTypeId"
    LEFT OUTER JOIN "users" AS "WorkTrip->assignedTo" ON "WorkTrip->assignedTo"."id" = "WorkTrip"."UserId"
    LEFT OUTER JOIN "materials" AS "Material" ON "Material"."TaskId" = "Task"."id"
    ORDER BY "Task"."invoiced" DESC, "Task"."closeDate" ASC
    `
  );

  return sql.replace(/"/g, '`');
}

export const generateDatesOfCompanySQL = (companyId) => {
  const attributes = (
    `
    YEAR("Task"."closeDate") AS "year",
    MONTH("Task"."closeDate") AS "month",
     `
  );

  const sql = (
    `
    SELECT
    ${removeLastComma(attributes)}
    FROM "tasks" AS "Task"
    INNER JOIN "statuses" AS "Status" ON
      "Task"."StatusId" = "Status"."id" AND
      "Status"."action" = 'CloseDate'
    INNER JOIN "invoiced_tasks" AS "InvoicedTask" ON
      "InvoicedTask"."TaskId" = "Task"."id" AND
      "InvoicedTask"."companyId" = ${companyId}
    WHERE
      "Task"."invoiced" = true AND
      "Task"."closeDate" IS NOT NULL
    GROUP BY YEAR("Task"."closeDate"), MONTH("Task"."closeDate")
    ORDER BY "Task"."closeDate" DESC
    `
  );

  return sql.replace(/"/g, '`');
}

export const generateAllInvoiceCompaniesSQL = () => {
  const attributes = (
    `
    "InvoicedTask"."companyId" AS "id",
    "InvoicedTask"."companyTitle" AS "title",
     `
  );

  const sql = (
    `
    SELECT
    ${removeLastComma(attributes)}
    FROM "invoiced_tasks" AS "InvoicedTask"
    GROUP BY "InvoicedTask"."companyId"
    `
  );

  return sql.replace(/"/g, '`');
}

export const generateCompaniesWithInvoiceSQL = (fromDate, toDate) => {
  const attributes = (
    `
    "InvoicedTask"."companyId" AS "id",
    "InvoicedTask"."companyTitle" AS "title",
     `
  );

  const sql = (
    `
    SELECT
    ${removeLastComma(attributes)}
    FROM "invoiced_tasks" AS "InvoicedTask"
    INNER JOIN "tasks" AS "Task" ON
      "Task"."id" = "InvoicedTask"."TaskId" AND
      "Task"."invoiced" = true AND
      "Task"."closeDate" IS NOT NULL AND
      "Task"."closeDate" >= '${toDBDate(fromDate)}' AND
      "Task"."closeDate" <= '${toDBDate(toDate)}'
    GROUP BY "InvoicedTask"."companyId"
    `
  );

  return sql.replace(/"/g, '`');
}
