import {
  createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask,
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import { QueryTypes } from 'sequelize';
import {
  getModelAttribute,
  extractDatesFromObject,
  timestampToString,
} from '@/helperFunctions';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import {
  createScheduledTasksSQL,
  scheduledFilterSQL
} from '@/graph/addons/scheduledTask';
import {
  filterToTaskWhereSQL,
} from '@/graph/addons/task';
import checkResolver from './checkResolver';
import { UserInstance, TaskInstance, RepeatTemplateInstance, RoleInstance, ScheduledTaskInstance } from '@/models/instances';
const dateNames1 = ['from', 'to'];
const dateNames2 = [
  'closeDateFrom',
  'closeDateTo',
  'deadlineFrom',
  'deadlineTo',
  'pendingDateFrom',
  'pendingDateTo',
  'statusDateFrom',
  'statusDateTo',
  'createdAtFrom',
  'createdAtTo',
  'scheduledFrom',
  'scheduledTo',
];



const querries = {
  scheduledTasks: async (root, { projectId, filter, userId, ...rangeDates }, { req, userID: currentUserId }) => {
    const User = await checkResolver(req);
    const isAdmin = (<RoleInstance>User.get('Role')).get('level') === 0;
    const { from, to } = extractDatesFromObject(rangeDates, ['from', 'to']);
    let where = [];
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      where.push(`"Task"."ProjectId" = ${projectId}`)
    }
    if (filter) {
      const dates = extractDatesFromObject(filter, dateNames2);
      where = where.concat(filterToTaskWhereSQL({ ...filter, ...dates }, currentUserId, User.get('CompanyId'), projectId));
    }

    if (!userId) {
      userId = currentUserId;
    }
    where = where.concat(scheduledFilterSQL(from, to, userId))

    if (!isAdmin) {
      where.push(`(
        "Task"."createdById" = ${currentUserId} OR
        "Task"."requesterId" = ${currentUserId} OR
        "assignedTosFilter"."id" = ${currentUserId} OR
        "Project->ProjectGroups->ProjectGroupRight"."allTasks" = true OR
        ("Project->ProjectGroups->ProjectGroupRight"."companyTasks" = true AND "Task"."CompanyId" = ${User.get('CompanyId')})
      )`);
    }

    const SQL = createScheduledTasksSQL(where, currentUserId, isAdmin);
    let responseScheduled = await sequelize.query(SQL, {
      model: models.ScheduledTask,
      type: QueryTypes.SELECT,
      nest: true,
      raw: true,
      mapToModel: true
    });

    return responseScheduled;
  }
}

const mutations = {
  addScheduledTask: async (root, { task, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['scheduledWrite']);
    const TargetUser = <UserInstance>await models.User.findByPk(attributes.UserId);
    if (TargetUser === null) {
      throw createDoesNoExistsError('User', attributes.UserId);
    }
    const AssignedTos = <UserInstance[]>await Task.getAssignedTos();
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === attributes.UserId)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    const dates = extractDatesFromObject(attributes, dateNames1);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'scheduledTask',
          originalValue: null,
          newValue: `${attributes.UserId},${attributes.from},${attributes.to}`,
          message: `Scheduled task was added for user ${TargetUser.get('fullName')} from ${timestampToString(dates.from)} to ${timestampToString(dates.to)}.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    )
    return models.ScheduledTask.create({
      TaskId: task,
      ...attributes,
      ...dates,
    });
  },

  updateScheduledTask: async (root, { id, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    const dates = extractDatesFromObject(attributes, dateNames1);
    const ScheduledTask = <ScheduledTaskInstance>await models.ScheduledTask.findByPk(id, { include: [models.User] });
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), ScheduledTask.get('TaskId'), undefined, ['scheduledWrite']);
    const TargetUser = <UserInstance>ScheduledTask.get('User');

    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'scheduledTask',
          originalValue: `${ScheduledTask.get('from')},${ScheduledTask.get('to')}`,
          newValue: `${attributes.from},${attributes.to}`,
          message: `Scheduled task was changed for user ${TargetUser.get('fullName')} as following: from ${timestampToString(ScheduledTask.get('from'))}=>${timestampToString(dates.from)}, to ${timestampToString(ScheduledTask.get('to'))}=>${timestampToString(dates.to)}.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    return ScheduledTask.update(dates);
  },

  deleteScheduledTask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ScheduledTask = await models.ScheduledTask.findByPk(id, { include: [models.User] });
    if (ScheduledTask === null) {
      throw createDoesNoExistsError('Scheduled task', id);
    }
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), ScheduledTask.get('TaskId'), undefined, ['scheduledWrite']);
    (<TaskInstance>Task).createTaskChange(
      {
        UserId: SourceUser.get('id'),
        TaskChangeMessages: [{
          type: 'scheduledTask',
          originalValue: `${ScheduledTask.get('UserId')},${ScheduledTask.get('from')},${ScheduledTask.get('to')}`,
          newValue: null,
          message: `Scheduled task for user ${(<UserInstance>ScheduledTask.get('User')).get('fullName')} from ${timestampToString(ScheduledTask.get('from'))} to ${timestampToString(ScheduledTask.get('to'))} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    return await ScheduledTask.destroy();
  },
}

const attributes = {
  ScheduledTask: {
    async user(scheduledTask) {
      return getModelAttribute(scheduledTask, 'User');
    },
    async task(scheduledTask) {
      return { ... (await getModelAttribute(scheduledTask, 'Task')), rights: { statusRead: true } };
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
