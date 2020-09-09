import { createDoesNoExistsError, CalendarEventCantEndBeforeStartingError } from 'configs/errors';
import { models } from 'models';
import { UserInstance, ProjectRightInstance, ProjectInstance, TaskInstance, CalendarEventInstance } from 'models/instances';
import { checkIfHasProjectRights, filterObjectToFilter, extractDatesFromObject } from "helperFunctions";
import { filterToWhere, filterByOneOf } from './task';
import { multipleIdDoesExistsCheck } from 'helperFunctions';
import checkResolver from './checkResolver';
import moment from 'moment';

const querries = {
  calendarEvents: async ( root , { projectId, filterId, filter }, { req } ) => {
    const SourceUser = await checkResolver( req );
    let projectWhere = {};
    let taskWhere = {};
    if(projectId){
      const Project = await models.Project.findByPk(projectId);
      if(Project === null){
        throw createDoesNoExistsError('Project', projectId);
      }
      projectWhere = { id: projectId }
    }
    if(filterId){
      const Filter = await models.Filter.findByPk(filterId);
      if(Filter === null){
        throw createDoesNoExistsError('Filter', filterId);
      }
      filter = filterObjectToFilter(await Filter.get('filter'));
    }
    if(filter){
      taskWhere = filterToWhere( filter, SourceUser.get('id') )
    }
    const User = <UserInstance> await models.User.findByPk(SourceUser.get('id'), {
      include: [
        {
          model: models.ProjectRight,
          include: [
            {
              model: models.Project,
              where: projectWhere,
              required: true,
              include: [
                {
                  model: models.Task,
                  where: taskWhere,
                  required: true,
                  include: [
                    {
                      model: models.CalendarEvent,
                    },
                    {
                      model: models.User,
                      as: 'assignedTos',
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    const tasks = (<ProjectRightInstance[]>User.get('ProjectRights')).map((ProjectRight) => <ProjectInstance>ProjectRight.get('Project') ).reduce((acc, proj) => [...acc, ...<TaskInstance[]>proj.get('Tasks') ],[])
    if(filter){
      return filterByOneOf(filter, SourceUser.get('id'), SourceUser.get('CompanyId'), tasks ).reduce((acc, task) => [...acc, ...<CalendarEventInstance[]>task.get('CalendarEvents') ],[]);
    }
    return tasks.reduce((acc, task) => [...acc, ...<CalendarEventInstance[]>task.get('CalendarEvents') ],[]);
  },
}

const mutations = {
  addCalendarEvent: async ( root, { task, ...params }, { req } ) => {
    const SourceUser = await checkResolver( req );
    const { startsAt, endsAt } = extractDatesFromObject(params, ['startsAt', 'endsAt']);
    await checkIfHasProjectRights( SourceUser.get('id'), task, 'write' );
    if( startsAt > endsAt ){
      throw CalendarEventCantEndBeforeStartingError;
    }
    return models.CalendarEvent.create({
      TaskId: task,
      startsAt,
      endsAt,
    });
  },

  updateCalendarEvent: async ( root, { id, ...params }, { req } ) => {
    const changes = extractDatesFromObject(params, ['startsAt', 'endsAt']);
    const { startsAt, endsAt } = changes;
    const SourceUser = await checkResolver( req );
    const CalendarEvent = await models.CalendarEvent.findByPk(id);
    if( CalendarEvent === null ){
      throw createDoesNoExistsError('Calendar Event', id);
    }
    //dates check
    const oldStartsAt = moment(CalendarEvent.get('startsAt')).valueOf();
    const oldEndsAt = moment(CalendarEvent.get('endsAt')).valueOf();

    if(
      ( startsAt && endsAt && startsAt > endsAt ) ||
      ( !startsAt && endsAt && oldStartsAt > endsAt ) ||
      ( startsAt && !endsAt && startsAt > oldEndsAt )
    ){
      throw CalendarEventCantEndBeforeStartingError;
    }
    await checkIfHasProjectRights( SourceUser.get('id'), CalendarEvent.get('TaskId'), 'write' );
    return CalendarEvent.update(changes);
  },

  deleteCalendarEvent: async ( root, { id }, { req } ) => {
    const SourceUser = await checkResolver( req );
    const CalendarEvent = await models.CalendarEvent.findByPk(id);
    if( CalendarEvent === null ){
      throw createDoesNoExistsError('CalendarEvent', id);
    }
    await checkIfHasProjectRights( SourceUser.get('id'), CalendarEvent.get('TaskId'), 'write' );
    return CalendarEvent.destroy();
  },
}

const attributes = {
  CalendarEvent: {
    async task(calendarEvent) {
      return calendarEvent.getTask()
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}