import {
  createDoesNoExistsError, SubtaskNotNullAttributesPresent, AssignedToUserNotSolvingTheTask,
} from '@/configs/errors';
import { models, sequelize } from '@/models';
import { checkIfHasProjectRights, getModelAttribute, extractDatesFromObject, timestampToString } from '@/helperFunctions';
import checkResolver from './checkResolver';
import { UserInstance, TaskInstance, RepeatTemplateInstance } from '@/models/instances';

const querries = {
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

  addRepeatTemplateScheduledTask: async (root, { repeatTemplate, ...attributes }, { req }) => {
    const SourceUser = await checkResolver(req);
    const RepeatTemplate = <RepeatTemplateInstance>await models.RepeatTemplate.findByPk(
      repeatTemplate,
      { include: [{ model: models.User, as: 'assignedTos' }] }
    );
    if (RepeatTemplate === null) {
      throw createDoesNoExistsError('Repeat template', repeatTemplate);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, RepeatTemplate.get('ProjectId'), ['scheduledWrite']);
    const AssignedTos = <UserInstance[]>RepeatTemplate.get('assignedTos');
    if (!AssignedTos.some((AssignedTo) => AssignedTo.get('id') === attributes.UserId)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    const dates = extractDatesFromObject(attributes, ['from', 'to']);
    return models.ScheduledTask.create({
      RepeatTemplateId: repeatTemplate,
      ...attributes,
      ...dates,
    });
  },

  deleteRepeatTemplateScheduledTask: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const ScheduledTask = await models.ScheduledTask.findByPk(id, { include: [models.User, models.RepeatTemplate] });
    if (ScheduledTask === null) {
      throw createDoesNoExistsError('Scheduled task', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), undefined, (<RepeatTemplateInstance>ScheduledTask.get('RepeatTemplate')).get('ProjectId'), ['scheduledWrite']);
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
