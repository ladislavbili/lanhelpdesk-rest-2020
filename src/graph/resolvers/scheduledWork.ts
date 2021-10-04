import {
  createDoesNoExistsError,
  AssignedToUserNotSolvingTheTask,
  InsufficientProjectAccessError,
} from '@/configs/errors';
import {
  getModelAttribute,
  extractDatesFromObject,
} from '@/helperFunctions';
import checkResolver from './checkResolver';
import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import {
  timestampToString
} from '@/helperFunctions';
import { models, sequelize } from '@/models';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import {
  createScheduledWorksSQL,
  scheduledFilterSQL
} from '@/graph/addons/scheduledWork';
import {
  filterToTaskWhereSQL,
} from '@/graph/addons/task';
import { pubsub } from './index';
import { TASK_HISTORY_CHANGE } from '@/configs/subscriptions';
import {
  TaskInstance,
  RoleInstance,
  AccessRightsInstance,
  SubtaskInstance,
  WorkTripInstance,
  TripTypeInstance,
  ScheduledWorkInstance,
  UserInstance,

} from '@/models/instances';

const scheduledDates = ['from', 'to'];
const filterDates = [
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

const getTimeDifference = (fromDate, toDate) => {
  if (fromDate === null || toDate === null) {
    return null;
  }
  return (
    moment.duration(toDate.diff(fromDate))
      .asMinutes() / 60
  )
}

const queries = {
  scheduledWorks: async (root, { projectId, filter, userId, ...rangeDates }, { req, userID: currentUserId }) => {
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
      const dates = extractDatesFromObject(filter, filterDates);
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
      where.push(`(
        "Project->ProjectGroups->Users->user_belongs_to_group"."UserId" IS NOT NULL OR
        "Project->ProjectGroups->Companies"."CompanyId" IS NOT NULL
      )`);
    }
    if (!isAdmin && !(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar')) {
      where.push(`(
        "Project->ProjectGroups->ProjectGroupRight"."tasklistKalendar" = true
      )`);
    }

    const SQLSubtasks = createScheduledWorksSQL(where, currentUserId, User.get('CompanyId'), isAdmin, true);
    const SQLWorkTrips = createScheduledWorksSQL(where, currentUserId, User.get('CompanyId'), isAdmin, false);
    const [responseScheduled1, responseScheduled2] = await Promise.all([
      sequelize.query(SQLSubtasks, {
        model: models.ScheduledWork,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
      sequelize.query(SQLWorkTrips, {
        model: models.ScheduledWork,
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        mapToModel: true
      }),
    ]);

    return [
      ...(<ScheduledWorkInstance[]>responseScheduled1).map((scheduled) => ({ ...scheduled, WorkTrip: null })),
      ...(<ScheduledWorkInstance[]>responseScheduled2).map((scheduled) => ({ ...scheduled, Subtask: null }))
    ];
  }
}

const mutations = {

  addScheduledWork: async (root, { taskId, userId, ...newDates }, { req }) => {
    const User = await checkResolver(req);
    const dates = extractDatesFromObject(newDates, scheduledDates);
    const { Task, groupRights } = await checkIfHasProjectRights(User, taskId, undefined, ['taskWorksWrite'], [{ right: 'assigned', action: 'edit' }]);

    if (!(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar') && !groupRights.project.tasklistKalendar) {
      console.log('bb');
      throw InsufficientProjectAccessError;
    }
    const [
      allSubtasks,
      AssignedTos
    ] = [
        await Task.getSubtasks(),
        await Task.getAssignedTos(),
      ];
    if (!(<UserInstance[]>AssignedTos).some((AssignedTo) => AssignedTo.get('id') === userId)) {
      throw AssignedToUserNotSolvingTheTask;
    }
    const order = allSubtasks.length;

    const Subtask = <SubtaskInstance>await models.Subtask.create({
      TaskId: taskId,
      TaskTypeId: Task.get('TaskTypeId'),
      UserId: userId,
      title: '',
      order,
      done: false,
      quantity: getTimeDifference(moment(dates.from), moment(dates.to)) === null ? 0 : getTimeDifference(moment(dates.from), moment(dates.to)),
      discount: 0,
      approved: false,
      ScheduledWork: dates,
    }, {
        include: [models.ScheduledWork]
      });
    let scheduledWork = <ScheduledWorkInstance>await Subtask.getScheduledWork();
    scheduledWork.canEdit = true;
    scheduledWork.Task = Task;
    scheduledWork.User = (<UserInstance[]>AssignedTos).find((AssignedTo) => AssignedTo.get('id') === userId);
    scheduledWork.Subtask = Subtask;
    scheduledWork.WorkTrip = null;
    return scheduledWork;
  },

  updateScheduledWork: async (root, { id, ...newDates }, { req }) => {
    const User = await checkResolver(req);
    const dates = extractDatesFromObject(newDates, scheduledDates);

    let ScheduledWork = <ScheduledWorkInstance>await models.ScheduledWork.findByPk(id, {
      include: [
        {
          model: models.WorkTrip,
          include: [models.User, models.TripType]
        },
        {
          model: models.Subtask,
          include: [models.User]
        },
      ]
    });
    if (ScheduledWork === null) {
      throw createDoesNoExistsError('Scheduled work', id);
    }

    const WorkTrip = <WorkTripInstance>ScheduledWork.get('WorkTrip');
    const Subtask = <SubtaskInstance>ScheduledWork.get('Subtask');
    const ofSubtask = Subtask !== null && Subtask !== undefined;
    const TaskId = ofSubtask ? Subtask.get('TaskId') : WorkTrip.get('TaskId');
    let { Task, groupRights } = await checkIfHasProjectRights(User, TaskId, undefined, ['taskWorksWrite'], [{ right: 'assigned', action: 'edit' }]);
    Task.rights = groupRights;
    if (!(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar') && !groupRights.project.tasklistKalendar) {
      throw InsufficientProjectAccessError;
    }
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: User.get('id'),
        TaskChangeMessages: [{
          type: 'scheduledWork',
          originalValue: `${ScheduledWork.get('from')},${ScheduledWork.get('to')}`,
          newValue: `${newDates.from},${newDates.to}`,
          message: `Scheduled work for ${ofSubtask ? 'subtask' : 'work trip'} "${ofSubtask ? Subtask.get('title') : (<TripTypeInstance>WorkTrip.get('TripType')).get('title')}" was changed from ${timestampToString(ScheduledWork.get('from'))}=>${timestampToString(dates.from)}, to ${timestampToString(ScheduledWork.get('to'))}=>${timestampToString(dates.to)}.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: TaskId });

    await ScheduledWork.update(dates);
    if (ofSubtask) {
      await Subtask.update({ quantity: getTimeDifference(moment(dates.from), moment(dates.to)) === null ? 0 : getTimeDifference(moment(dates.from), moment(dates.to)) });
    } else {
      await WorkTrip.update({ quantity: getTimeDifference(moment(dates.from), moment(dates.to)) === null ? 0 : getTimeDifference(moment(dates.from), moment(dates.to)) });
    }
    ScheduledWork.canEdit = true;
    ScheduledWork.Task = Task;
    ScheduledWork.User = ofSubtask ? Subtask.get('User') : WorkTrip.get('User');
    return ScheduledWork;
  },
  deleteScheduledWork: async (root, { id }, { req }) => {
    const User = await checkResolver(req);
    const ScheduledWork = <ScheduledWorkInstance>await models.ScheduledWork.findByPk(id, {
      include: [
        { model: models.WorkTrip, include: [models.TripType] },
        models.Subtask,
      ]
    });

    if (ScheduledWork === null) {
      throw createDoesNoExistsError('Scheduled work', id);
    }

    const WorkTrip = <WorkTripInstance>ScheduledWork.get('WorkTrip');
    const Subtask = <SubtaskInstance>ScheduledWork.get('Subtask');
    const ofSubtask = Subtask !== null && Subtask !== undefined;
    const TaskId = ofSubtask ? Subtask.get('TaskId') : WorkTrip.get('TaskId');

    const { Task, groupRights } = await checkIfHasProjectRights(User, TaskId, undefined, ['taskWorksWrite'], [{ right: 'assigned', action: 'edit' }]);
    if (!(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar') && !groupRights.project.tasklistKalendar) {
      throw InsufficientProjectAccessError;
    }
    await (<TaskInstance>Task).createTaskChange(
      {
        UserId: User.get('id'),
        TaskChangeMessages: [{
          type: 'scheduledwork',
          originalValue: `${ScheduledWork.get('from')},${ScheduledWork.get('to')}`,
          newValue: null,
          message: `Scheduled work for ${ofSubtask ? 'subtask' : 'work trip'} "${ofSubtask ? Subtask.get('title') : (<TripTypeInstance>WorkTrip.get('TripType')).get('title')}" from ${timestampToString(ScheduledWork.get('from'))} to ${timestampToString(ScheduledWork.get('to'))} was deleted.`,
        }],
      },
      { include: [models.TaskChangeMessage] }
    );
    pubsub.publish(TASK_HISTORY_CHANGE, { taskHistorySubscription: TaskId });
    return await ScheduledWork.destroy();
  },
}

const attributes = {
  ScheduledWork: {
    async subtask(scheduledWork) {
      return getModelAttribute(scheduledWork, 'Subtask');
    },
    async workTrip(scheduledWork) {
      return getModelAttribute(scheduledWork, 'WorkTrip');
    },
    async task(scheduledWork) {
      return scheduledWork.Task ? scheduledWork.Task : null;
    },
    async user(scheduledWork) {
      return scheduledWork.User ? scheduledWork.User : null;
    },
  },
};

export default {
  attributes,
  mutations,
  queries
}
