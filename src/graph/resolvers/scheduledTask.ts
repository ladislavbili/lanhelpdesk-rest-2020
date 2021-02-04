import { createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask } from '@/configs/errors';
import { models, sequelize } from '@/models';
import { checkIfHasProjectRights, getModelAttribute, extractDatesFromObject, timestampToString } from '@/helperFunctions';
import checkResolver from './checkResolver';
import { UserInstance, TaskInstance } from '@/models/instances';

const querries = {
}

const mutations = {
  addScheduledTask: async (root, { task, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { Task } = await checkIfHasProjectRights(SourceUser.get('id'), task, undefined, ['scheduledWrite']);
    const TargetUser = <UserInstance>await models.User.findByPk(attributes.UserId);
    const dates = extractDatesFromObject(attributes, ['from', 'to']);
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
  },
};

export default {
  attributes,
  mutations,
  querries
}
