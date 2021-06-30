import { createDoesNoExistsError } from '@/configs/errors';
import {
  getModelAttribute,
} from '@/helperFunctions';
import checkResolver from './checkResolver';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import {
  timestampToString
} from '@/helperFunctions';
import { models } from '@/models';

import { pubsub } from './index';
import { TASK_HISTORY_CHANGE } from '@/configs/subscriptions';
import {
  UserInstance,
  TaskInstance,
  SubtaskInstance,
  ScheduledTaskInstance,
} from '@/models/instances';
const queries = {
}

const mutations = {
  createSubtaskFromScheduled: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const ScheduledTask = <ScheduledTaskInstance>await models.ScheduledTask.findByPk(id, {
      include: [
        { model: models.Task, include: [models.Subtask] },
        models.User,
      ]
    });
    if (ScheduledTask === null) {
      throw createDoesNoExistsError('ScheduledTask', id);
    }
    const Task = <TaskInstance>ScheduledTask.get('Task');
    await checkIfHasProjectRights(User.get('id'), undefined, Task.get('ProjectId'), ['assignedWrite', 'vykazWrite']);
    const quantity = (ScheduledTask.get('to') - ScheduledTask.get('from')) / 36e5;
    const TargetUser = <UserInstance>ScheduledTask.get('User');
    await Task.createTaskChange(
      {
        UserId: User.get('id'),
        TaskChangeMessages: [{
          type: 'subtask',
          originalValue: null,
          newValue: `${quantity},${0},${TargetUser.get('id')} ${TargetUser.get('name')} ${TargetUser.get('surname')}`,
          message: `Subtask was created from Scheduled Task "from" ${timestampToString(ScheduledTask.get('from').valueOf())}, "to" ${timestampToString(ScheduledTask.get('to').valueOf())} for user ${TargetUser.get('name')} ${TargetUser.get('surname')}.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: Task.get('id') });

    return models.Subtask.create({
      TaskId: Task.get('id'),
      TaskTypeId: Task.get('TaskTypeId') ? Task.get('TaskTypeId') : null,
      UserId: TargetUser.get('id'),
      title: '',
      order: (<SubtaskInstance[]>Task.get('Subtasks')).length,
      done: false,
      approved: false,
      quantity,
      discount: 0,
      ScheduledWork: { from: ScheduledTask.get('from').valueOf(), to: ScheduledTask.get('to').valueOf() },
    }, {
        include: [models.ScheduledWork]
      });
  }
}

const attributes = {
  ScheduledWork: {
    async subtask(scheduledWork) {
      return getModelAttribute(scheduledWork, 'Subtask');
    },
    async workTrip(scheduledWork) {
      return getModelAttribute(scheduledWork, 'WorkTrip');
    },
  },
};

export default {
  attributes,
  mutations,
  queries
}
