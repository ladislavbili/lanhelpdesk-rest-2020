import { models } from '@/models';
import {
  toDBDate,
  createModelAttributes,
} from './sqlFunctions';

export const generateRepeatSQL = (active, from, to, projectId, userId, isAdmin) => {
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
  if (!isAdmin) {
    where.push(`( "ProjectGroupRight"."repeatRead" = true )`)
  }

  let sql = `
  SELECT
  ${createModelAttributes("Repeat", null, models.Repeat)}
  "RepeatTemplate"."title" as "RepeatTemplate.title",
  ${ isAdmin ?
      `
      true as "canCreateTask",
      true as "canEdit"
      ` :
      `
      "ProjectGroupRight"."repeatRead" AND "ProjectGroupRight"."addTasks" as "canCreateTask",
      "ProjectGroupRight"."repeatWrite" as "canEdit"
      `
    }
  FROM "repeat" AS "Repeat"
  INNER JOIN "repeat_templates" AS "RepeatTemplate" ON "RepeatTemplate"."RepeatId" = "Repeat"."id"
  ${ isAdmin ?
      `` :
      `
    INNER JOIN "projects" AS "Project" ON "Project"."id" = "RepeatTemplate"."ProjectId"
    INNER JOIN "project_group" AS "ProjectGroup" ON "ProjectGroup"."ProjectId" = "Project"."id"
    INNER JOIN "user_belongs_to_group" AS "UserBelongsToGroup" ON "UserBelongsToGroup"."ProjectGroupId" = "ProjectGroup"."id" AND "UserBelongsToGroup"."UserId" = ${userId}
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
