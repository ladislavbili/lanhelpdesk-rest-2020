import {
  toDBDate,
  createModelAttributes,
  generateFullNameSQL,
  removeLastComma,
} from '../sqlFunctions';
import { models } from '@/models';

export const generateInvoiceSQL = (fromDate, toDate, companyId) => {
  //netreba prepocitavat, nacitaj len invoiced data
  //v resolveri ich prirad tam kde by boli realne data

  const attributes = (
    `
    ${createModelAttributes("Task", null, models.Task)}
    ${createModelAttributes("InvoicedTask", "InvoicedTask", models.InvoicedTask)}
    ${createModelAttributes("InvoicedTask->requester", "InvoicedTask.requester", models.InvoicedTaskUser)}
    ${createModelAttributes("InvoicedTask->assignedTos", "InvoicedTask.assignedTos", models.InvoicedTaskUser)}
    ${createModelAttributes("InvoicedTask->createdBy", "InvoicedTask.createdBy", models.InvoicedTaskUser)}
    ${createModelAttributes("Subtask", "Subtask", models.Subtask)}
    ${createModelAttributes("WorkTrip", "WorkTrip", models.WorkTrip)}
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
        WHERE
          "Task"."invoiced" = true AND
          "Task"."CompanyId" = ${companyId} AND
          "Task"."closeDate" IS NOT NULL AND
          "Task"."closeDate" >= '${toDBDate(fromDate)}' AND
          "Task"."closeDate" <= '${toDBDate(toDate)}'
    ) AS "Task"

    INNER JOIN "invoiced_tasks" AS "InvoicedTask" ON "InvoicedTask"."TaskId" = "Task"."id"
    INNER JOIN "invoiced_task_users" AS "InvoicedTask->requester" ON "InvoicedTask->requester"."requesterId" = "InvoicedTask"."id"
    INNER JOIN "invoiced_task_users" AS "InvoicedTask->assignedTos" ON "InvoicedTask->assignedTos"."assignedToId" = "InvoicedTask"."id"
    INNER JOIN "invoiced_task_users" AS "InvoicedTask->createdBy" ON "InvoicedTask->createdBy"."createdById" = "InvoicedTask"."id"
    LEFT OUTER JOIN "subtasks" AS "Subtask" ON "Subtask"."TaskId" = "Task"."id"
    LEFT OUTER JOIN "work_trips" AS "WorkTrip" ON "WorkTrip"."TaskId" = "Task"."id"
    LEFT OUTER JOIN "materials" AS "Material" ON "Material"."TaskId" = "Task"."id"
    ORDER BY "Task"."invoiced" DESC, "Task"."closeDate" ASC
    `
  );

  return sql.replace(/"/g, '`');
}
