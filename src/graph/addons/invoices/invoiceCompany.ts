import {
  toDBDate,
  createModelAttributes,
  removeLastComma,
} from '../sqlFunctions';
import { models } from '@/models';

export const generateInvoiceCompaniesSQL = (fromDate, toDate) => {
  const attributes = (
    `
    ${createModelAttributes("Company", "Company", models.Company)}
    ${createModelAttributes("Company->CompanyRent", "Company.CompanyRent", models.CompanyRent)}
    "Company->CompanyRent"."quantity" * "Company->CompanyRent"."price" AS "Company.CompanyRent.total",
     CASE WHEN SUM("Task->Subtask"."total") IS NULL THEN 0 ELSE SUM("Task->Subtask"."total") END AS "works",
     CASE WHEN SUM("Task->WorkTrip"."total") IS NULL THEN 0 ELSE SUM("Task->WorkTrip"."total") END AS "trips",
     CASE WHEN SUM("Task->Material"."total") IS NULL THEN 0 ELSE SUM("Task->Material"."total") END AS "materials",
     `
  );

  const sql = (
    `
    SELECT
    ${removeLastComma(attributes)}
    FROM "companies" AS "Company"
    LEFT OUTER JOIN (
        SELECT
        "Task"."id",
        "Task"."CompanyId"
        FROM "tasks" AS "Task"
        INNER JOIN "statuses" AS "Status" ON
          "Task"."StatusId" = "Status"."id" AND
          "Status"."action" = 'CloseDate'
        WHERE
          "Task"."invoiced" = false AND
          "Task"."TaskTypeId" IS NOT NULL AND
          "Task"."closeDate" IS NOT NULL AND
          "Task"."closeDate" >= '${toDBDate(fromDate)}' AND
          "Task"."closeDate" <= '${toDBDate(toDate)}'
    ) AS "Task" ON "Company"."id" = "Task"."CompanyId"
    LEFT OUTER JOIN (
        SELECT
        "Subtask"."TaskId",
        SUM( "Subtask"."quantity" ) AS "total"
        FROM "subtasks" AS Subtask
        GROUP BY "Subtask"."TaskId"
    ) AS "Task->Subtask" ON "Task->Subtask"."TaskId" = "Task"."id"
    LEFT OUTER JOIN (
        SELECT
        "WorkTrip"."TaskId",
        SUM( "WorkTrip"."quantity" ) AS "total"
        FROM "work_trips" AS WorkTrip
        GROUP BY "WorkTrip"."TaskId"
    ) AS "Task->WorkTrip" ON "Task->WorkTrip"."TaskId" = "Task"."id"
    LEFT OUTER JOIN (
        SELECT
        "Material"."TaskId",
        SUM( "Material"."quantity" ) AS "total"
        FROM "materials" AS Material
        GROUP BY "Material"."TaskId"
    ) AS "Task->Material" ON "Task->Material"."TaskId" = "Task"."id"
    LEFT OUTER JOIN "company_rents" AS "Company->CompanyRent" ON "Company->CompanyRent"."CompanyId" = "Company"."id"
    WHERE (
      "Task->Subtask"."total" > 0 OR
      "Task->WorkTrip"."total" > 0 OR
      "Task->Material"."total" > 0 OR
      "Company->CompanyRent"."quantity" > 0
    )
    GROUP BY "Company"."id", "Company->CompanyRent"."id"
    `
  );

  return sql.replace(/"/g, '`');
}
