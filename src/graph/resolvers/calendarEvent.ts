import { createDoesNoExistsError, CalendarEventCantEndBeforeStartingError } from '@/configs/errors';
import { models } from '@/models';
import {
  UserInstance,
  ProjectInstance,
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  TaskInstance,
  CalendarEventInstance,
} from '@/models/instances';
import {
  checkIfHasProjectRights,
  filterObjectToFilter,
  extractDatesFromObject,
  multipleIdDoesExistsCheck,
  getModelAttribute,
  canViewTask,
  filterToTaskWhere,
} from '@/helperFunctions';
import checkResolver from './checkResolver';
import moment from 'moment';
const dateNames = ['deadline', 'pendingDate', 'closeDate'];
const dateNames2 = [
  'closeDateFrom',
  'closeDateTo',
  'deadlineFrom',
  'deadlineTo',
  'pendingDateFrom',
  'pendingDateTo',
  'statusDateFrom',
  'statusDateTo',
];

const querries = {
  calendarEvents: async (root, { projectId, filterId, filter }, { req, userID }) => {
    let projectWhere = {};
    let taskWhere = {};
    if (projectId) {
      const Project = await models.Project.findByPk(projectId);
      if (Project === null) {
        throw createDoesNoExistsError('Project', projectId);
      }
      projectWhere = { id: projectId }
    }
    if (filterId) {
      const Filter = await models.Filter.findByPk(filterId);
      if (Filter === null) {
        throw createDoesNoExistsError('Filter', filterId);
      }
      filter = filterObjectToFilter(await Filter.get('filter'));
    }
    if (filter) {
      const dates = extractDatesFromObject(filter, dateNames2);
      const SimpleUser = <UserInstance>await models.User.findByPk(userID, { attributes: ['id', 'CompanyId'] })
      if (SimpleUser) {
        taskWhere = filterToTaskWhere({ ...filter, ...dates }, userID, SimpleUser.get('CompanyId'))
      }
    }
    const User = await checkResolver(
      req,
      [],
      false,
      [
        {
          model: models.ProjectGroup,
          include: [
            models.ProjectGroupRights,
            {
              model: models.Project,
              where: projectWhere,
              required: true,
              include: [
                {
                  model: models.Task,
                  required: true,
                  include: [
                    models.CalendarEvent,
                    {
                      model: models.Project,
                      attributes: ['id'],
                      include: [{
                        model: models.ProjectGroup,
                        attributes: ['id'],
                        includes: [models.ProjectGroupRights]
                      }]
                    },
                    {
                      model: models.User,
                      as: 'assignedTos',
                    },
                    {
                      model: models.User,
                      as: 'assignedTosFilter',
                      attributes: ['id'],
                    },
                  ]
                }
              ]
            }
          ]
        }
      ]
    );

    const tasks = (
      (<ProjectGroupInstance[]>User.get('ProjectGroups'))
        .reduce((acc, ProjectGroup) => {
          const proj = <ProjectInstance>ProjectGroup.get('Project');
          const userRights = (<ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight')).get();
          return [
            ...acc,
            ...(<TaskInstance[]>proj.get('Tasks')).filter((Task) => canViewTask(Task, User, userRights))
          ]
        }, [])
    )
    return tasks.reduce((acc, task) => [...acc, ...<CalendarEventInstance[]>task.get('CalendarEvents')], []);
  },
}

const mutations = {
  addCalendarEvent: async (root, { task, ...params }, { req }) => {
    const SourceUser = await checkResolver(req);
    const { startsAt, endsAt } = extractDatesFromObject(params, ['startsAt', 'endsAt']);
    await checkIfHasProjectRights(SourceUser.get('id'), task);
    if (startsAt > endsAt) {
      throw CalendarEventCantEndBeforeStartingError;
    }
    return models.CalendarEvent.create({
      TaskId: task,
      startsAt,
      endsAt,
    });
  },

  updateCalendarEvent: async (root, { id, ...params }, { req }) => {
    const changes = extractDatesFromObject(params, ['startsAt', 'endsAt']);
    const { startsAt, endsAt } = changes;
    const SourceUser = await checkResolver(req);
    const CalendarEvent = await models.CalendarEvent.findByPk(id);
    if (CalendarEvent === null) {
      throw createDoesNoExistsError('Calendar Event', id);
    }
    //dates check
    const oldStartsAt = moment(CalendarEvent.get('startsAt')).valueOf();
    const oldEndsAt = moment(CalendarEvent.get('endsAt')).valueOf();

    if (
      (startsAt && endsAt && startsAt > endsAt) ||
      (!startsAt && endsAt && oldStartsAt > endsAt) ||
      (startsAt && !endsAt && startsAt > oldEndsAt)
    ) {
      throw CalendarEventCantEndBeforeStartingError;
    }
    await checkIfHasProjectRights(SourceUser.get('id'), CalendarEvent.get('TaskId'));
    return CalendarEvent.update(changes);
  },

  deleteCalendarEvent: async (root, { id }, { req }) => {
    const SourceUser = await checkResolver(req);
    const CalendarEvent = await models.CalendarEvent.findByPk(id);
    if (CalendarEvent === null) {
      throw createDoesNoExistsError('CalendarEvent', id);
    }
    await checkIfHasProjectRights(SourceUser.get('id'), CalendarEvent.get('TaskId'));
    return CalendarEvent.destroy();
  },
}

const attributes = {
  CalendarEvent: {
    async task(calendarEvent) {
      return getModelAttribute(calendarEvent, 'Task');
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
