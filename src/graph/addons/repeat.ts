const toDBDate = (date) => (new Date(date)).toISOString().slice(0, 19).replace('T', ' ');

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

  where.push(`( "Repeat"."startsAt" <= '${toDBDate(from)}' )`)
  where.push(`( '${toDBDate(from)}' <= ${nextTrigger} )`);
  where.push(`( '${toDBDate(to)}' >= ${nextTrigger} )`);

  let sql = `
  SELECT
  "Repeat"."id",
  "Repeat"."active",
  "Repeat"."startsAt",
  "Repeat"."repeatInterval",
  "Repeat"."repeatEvery",
  "RepeatTemplate"."title" as "RepeatTemplate.title",
  ${ isAdmin ?
      `true as "canEdit"` :
      `"ProjectGroupRight"."repeatWrite" as "canEdit"`
    }
  FROM "repeat" AS "Repeat"
  INNER JOIN "repeat_templates" AS "RepeatTemplate" ON "RepeatTemplate"."RepeatId" = "Repeat"."id"
  ${ isAdmin ?
      `` :
      `
    INNER JOIN "projects" AS "Project" ON "Project"."id" = "RepeatTemplate"."ProjectId"
    INNER JOIN "project_group" AS "ProjectGroup" ON "ProjectGroup"."ProjectId" = "Project"."id"
    INNER JOIN "user_belongs_to_group" AS "UserBelongsToGroup" ON "UserBelongsToGroup"."ProjectGroupId" = "ProjectGroup"."id" AND UserId = ${userId}
    INNER JOIN "project_group_rights" AS "ProjectGroupRight" ON "ProjectGroupRight"."id" = "RepeatTemplate"."ProjectId"
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

/*
`
SELECT id, startsAt,
(
IF( repeatInterval = "DAY", 24*60*60, IF( repeatInterval = "WEEK", 7*24*60*60, 30*24*60*60)) * repeatEvery -
MOD ( UNIX_TIMESTAMP("2021-04-25 22:00:00") - UNIX_TIMESTAMP(startsAt), IF( repeatInterval = "DAY", 24*60*60, IF( repeatInterval = "WEEK", 7*24*60*60, 30*24*60*60)) * repeatEvery )
) as timeTillTrigger,

FROM_UNIXTIME((
UNIX_TIMESTAMP("2021-04-25 22:00:00") +
(
IF( repeatInterval = "DAY", 24*60*60, IF( repeatInterval = "WEEK", 7*24*60*60, 30*24*60*60)) * repeatEvery -
MOD ( UNIX_TIMESTAMP("2021-04-25 22:00:00") - UNIX_TIMESTAMP(startsAt), IF( repeatInterval = "DAY", 24*60*60, IF( repeatInterval = "WEEK", 7*24*60*60, 30*24*60*60)) * repeatEvery )
)
))
as nextTrigger,
FROM `
repeat `
`

*/
