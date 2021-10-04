import { models } from '@/models';
import {
  toDBDate,
  createModelAttributes,
} from './sqlFunctions';

export const generateRepeatSQL = (active, from, to, projectId, userId, companyId, calendarRight, isAdmin) => {
  const nextTrigger = `(
    FROM_UNIXTIME((
      ${Math.floor(from / 1000)} +
      (
        IF( repeatInterval = ""DAY"", 24*60*60, IF( repeatInterval = ""WEEK"", 7*24*60*60, 30*24*60*60)) * repeatEvery -
        MOD ( ${Math.floor(from / 1000)} - UNIX_TIMESTAMP(startsAt), IF( repeatInterval = ""DAY"", 24*60*60, IF( repeatInterval = ""WEEK"", 7*24*60*60, 30*24*60*60)) * repeatEvery )
      )
    ))
  )`;


  let where = [];
  if (active !== null && active !== undefined) {
    where.push(`( "Repeat"."active" = ${active} )`)
  }

  if (projectId) {
    where.push(`( "RepeatTemplate"."ProjectId" = ${projectId} )`)
  }

  where.push(`( "Repeat"."startsAt" <= '${toDBDate(to)}' )`)
  where.push(`(
    (
      ( '${toDBDate(from)}' <= ${nextTrigger} ) AND ( '${toDBDate(to)}' >= ${nextTrigger} )
    ) OR (
      ( '${toDBDate(from)}' <= "Repeat"."startsAt" ) AND ( '${toDBDate(to)}' >= "Repeat"."startsAt" )
    )
  )`);

  //either user has calendar right or check if has proj
  if (!isAdmin) {
    if (!calendarRight) {
      where.push(`(
        "ProjectGroupRight"."tasklistKalendar" = true
      )`);
    }
    where.push(`( "ProjectGroupRight"."repeatView" = true )`);
    where.push(`(
    "UserBelongsToGroup"."UserId" IS NOT NULL OR
    "CompanyBelongsToGroup"."CompanyId" IS NOT NULL
  )`);
  }


  let sql = `
  SELECT
  ${createModelAttributes("Repeat", null, models.Repeat)}
  ${ isAdmin ?
      `
    true as "canCreateTask",
    true as "canEdit",
    ` :
      `
    "ProjectGroupRight"."repeatView" IS NOT NULL AND "ProjectGroupRight"."repeatView" AND "ProjectGroupRight"."addTask" as "canCreateTask",
    "ProjectGroupRight"."repeatEdit" IS NOT NULL AND "ProjectGroupRight"."repeatEdit" as "canEdit",
    `
    }
  "RepeatTemplate"."title" as "RepeatTemplate.title"
  FROM "repeat" AS "Repeat"
  INNER JOIN "repeat_templates" AS "RepeatTemplate" ON "RepeatTemplate"."RepeatId" = "Repeat"."id"
  ${ isAdmin ?
      `` :
      `
    INNER JOIN "projects" AS "Project" ON "Project"."id" = "RepeatTemplate"."ProjectId"
    INNER JOIN "project_group" AS "ProjectGroup" ON "ProjectGroup"."ProjectId" = "Project"."id"
    LEFT OUTER JOIN "user_belongs_to_group" AS "UserBelongsToGroup" ON "UserBelongsToGroup"."ProjectGroupId" = "ProjectGroup"."id" AND "UserBelongsToGroup"."UserId" = ${userId}
    LEFT OUTER JOIN "company_belongs_to_group" AS "CompanyBelongsToGroup" ON "CompanyBelongsToGroup"."ProjectGroupId" = "ProjectGroup"."id" AND "CompanyBelongsToGroup"."CompanyId" = ${companyId}
    INNER JOIN "project_group_rights" AS "ProjectGroupRight" ON "ProjectGroupRight"."ProjectGroupId" = "ProjectGroup"."id"
    `
    }
  `;
  if (where.length !== 0) {
    sql = `
    ${sql}
    WHERE ${where.join(' AND ')}
    `
  }

  return sql.replace(/"/g, '`').replace(/``/g, '"');
}
