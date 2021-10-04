import { createDoesNoExistsError, CantAddOrEditRepeatError } from '@/configs/errors';
import { models } from '@/models';
import { Op } from 'sequelize';
import {
  RepeatTimeInstance,
  RepeatInstance,
  RepeatTemplateInstance,
  ProjectInstance,
  ProjectGroupInstance,
  ProjectGroupRightsInstance,
  RoleInstance,
  UserInstance,
  AccessRightsInstance,
} from '@/models/instances';
import {
  mergeGroupRights,
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import checkResolver from './checkResolver';
import { getModelAttribute, extractDatesFromObject } from '@/helperFunctions';
import { repeatTimeEvent } from '@/services/repeatTasks';


const queries = {
  repeatTimes: async (root, { repeatId, repeatIds, active, ...rangeDates }, { req }) => {
    const User = <UserInstance>await checkResolver(req);
    const canUserSeeCalendarGlobally = (<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar');
    let repeatWhere = <any>{};
    let repeatTimeWhere = <any>{};

    if (active !== null && active !== undefined) {
      repeatWhere = {
        ...repeatWhere,
        active
      }
    }

    const { from, to } = extractDatesFromObject(rangeDates, ['from', 'to'], false);
    if (from && to) {
      repeatTimeWhere = {
        ...repeatTimeWhere,
        [Op.or]: [
          {
            triggersAt: {
              [Op.between]: [from, to],
            }
          },
          {
            originalTrigger: {
              [Op.between]: [from, to],
            }
          },
        ]
      }
    }

    if (!Array.isArray(repeatIds)) {
      repeatIds = [];
    }
    if (repeatId) {
      repeatIds.push(repeatId);
    }

    if (repeatIds.length !== 0) {
      repeatWhere = {
        ...repeatWhere,
        id: repeatIds
      }
    }

    if ((<RoleInstance>User.get('Role')).get('level') !== 0) {
      const userProjectsResponse = <any[]>(<any[]>
        await Promise.all([
          models.Project.findAll({
            include: [
              {
                model: models.ProjectGroup,
                required: true,
                include: [
                  {
                    model: models.User,
                    required: true,
                    where: { id: User.get('id') },
                  },
                  {
                    model: models.ProjectGroupRights,
                    required: true,
                    where: {
                      repeatView: true,
                      ...(canUserSeeCalendarGlobally ? {} : { tasklistKalendar: true })
                    },
                  }
                ],
              }
            ]
          }),
          models.Project.findAll({
            include: [
              {
                model: models.ProjectGroup,
                required: true,
                include: [
                  {
                    model: models.Company,
                    required: true,
                    where: { id: User.get('CompanyId') },
                  },
                  {
                    model: models.ProjectGroupRights,
                    required: true,
                    where: {
                      repeatView: true,
                      ...(canUserSeeCalendarGlobally ? {} : { tasklistKalendar: true })
                    }
                  }
                ],
              }
            ]
          })
        ])
      ).reduce((acc, Projects) => {
        return [
          ...acc,
          ...(<ProjectInstance[]>Projects).map((Project) => { return { id: Project.get('id'), groupRights: <ProjectGroupRightsInstance>(<ProjectGroupInstance[]>Project.get("ProjectGroups"))[0].get('ProjectGroupRight') } }),
        ]
      }, []);

      let userProjects = [];
      userProjectsResponse.forEach(async (userProject) => {
        const sameProjects = userProjectsResponse.filter((userProject2) => userProject2.id === userProject.id);
        if (!userProjects.some((userProject2) => userProject2.id === userProject.id)) {
          userProjects.push({ id: userProject.id, groupRights: await mergeGroupRights(sameProjects[0].groupRights, sameProjects[1] ? sameProjects[1].groupRights : null) });
        }
      })

      const RepeatTimes = <RepeatTimeInstance[]>await models.RepeatTime.findAll({
        where: repeatTimeWhere,
        include: [
          {
            model: models.Task,
            include: [models.Status]
          },
          {
            model: models.Repeat,
            include: [{
              model: models.RepeatTemplate,
              required: true,
              where: {
                ProjectId: userProjects.map((userProject) => userProject.id)
              },
            }],
            where: repeatWhere
          },
        ]
      });

      return RepeatTimes.map((RepeatTime) => {
        const Repeat = <RepeatInstance>RepeatTime.get('Repeat');
        const Template = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');
        const groupRights = userProjects.find((userProject) => userProject.id === Template.get('ProjectId')).groupRights;
        RepeatTime.canEdit = <boolean>groupRights.attributes.repeat.edit;
        RepeatTime.canCreateTask = <boolean>(groupRights.attributes.repeat.view && groupRights.project.addTask);
        RepeatTime.rights = groupRights;
        return RepeatTime;
      })

    } else {
      const RepeatTimes = <RepeatTimeInstance[]>await models.RepeatTime.findAll({
        where: repeatTimeWhere,
        include: [
          {
            model: models.Task,
            include: [models.Status]
          },
          {
            model: models.Repeat,
            include: [
              {
                model: models.RepeatTemplate,
                required: true,
                include: [
                  {
                    model: models.Project,
                    required: true,
                    include: [{
                      model: models.ProjectGroup,
                      where: {
                        admin: true,
                        def: true,
                      },
                      include: [models.ProjectGroupRights]
                    }],
                  },
                ]
              }
            ],
            where: repeatWhere
          },
        ]
      });

      return RepeatTimes.map(async (RepeatTime) => {
        const GroupRights = (
          <ProjectGroupRightsInstance>(
            <ProjectGroupInstance[]>(
              <ProjectInstance>(
                <RepeatTemplateInstance>(
                  <RepeatInstance>RepeatTime.get('Repeat')
                ).get('RepeatTemplate')
              ).get('Project')
            ).get('ProjectGroups')
          )[0].get('ProjectGroupRight')
        );
        const groupRights = await mergeGroupRights(GroupRights);
        RepeatTime.canEdit = <boolean>groupRights.attributes.repeat.edit;
        RepeatTime.canCreateTask = <boolean>(groupRights.attributes.repeat.view && groupRights.project.addTask);
        RepeatTime.rights = groupRights;
        return RepeatTime;
      })
    }
  },
}

const mutations = {
  addRepeatTime: async (root, { repeatId, ...params }, { req }) => {
    const User = <UserInstance>await checkResolver(req);
    const Repeat = <RepeatInstance>await models.Repeat.findByPk(repeatId, {
      include: [
        models.RepeatTemplate
      ]
    });
    const RepeatTemplate = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');

    const { groupRights } = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), [], [{ right: 'repeat', action: 'edit' }]);
    if (!(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar') && !groupRights.project.tasklistKalendar) {
      throw CantAddOrEditRepeatError;
    }

    const dates = extractDatesFromObject(params, ['originalTrigger', 'triggersAt']);

    let NewRepeatTime = <RepeatTimeInstance>await models.RepeatTime.create({
      RepeatId: repeatId,
      ...params,
      ...dates
    });

    NewRepeatTime.canEdit = <boolean>groupRights.attributes.repeat.edit;
    NewRepeatTime.canCreateTask = <boolean>(groupRights.attributes.repeat.view && groupRights.project.addTask);
    NewRepeatTime.rights = groupRights;
    repeatTimeEvent.emit('changed', repeatId);
    return NewRepeatTime;
  },

  updateRepeatTime: async (root, { id, ...params }, { req }) => {
    const User = <UserInstance>await checkResolver(req);
    let RepeatTime = <RepeatTimeInstance>await models.RepeatTime.findByPk(id, {
      include: [
        {
          model: models.Repeat,
          include: [models.RepeatTemplate]
        },
      ]
    });
    if (RepeatTime === null) {
      throw createDoesNoExistsError('Repeat time', id);
    }
    const RepeatTemplate = <RepeatTemplateInstance>(<RepeatInstance>RepeatTime.get('Repeat')).get('RepeatTemplate');

    const { groupRights } = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), [], [{ right: 'repeat', action: 'edit' }]);
    if (!(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar') && !groupRights.project.tasklistKalendar) {
      throw CantAddOrEditRepeatError;
    }

    const dates = params.triggersAt ? extractDatesFromObject(params, ['triggersAt']) : {};
    await RepeatTime.update({
      ...params,
      ...dates,
    });
    repeatTimeEvent.emit('changed', RepeatTime.get('RepeatId'));
    RepeatTime.canEdit = <boolean>groupRights.attributes.repeat.edit;
    RepeatTime.canCreateTask = <boolean>(groupRights.attributes.repeat.view && groupRights.project.addTask);
    RepeatTime.rights = groupRights;
    return RepeatTime;
  },

  deleteRepeatTime: async (root, { id }, { req }) => {
    const User = <UserInstance>await checkResolver(req);
    const RepeatTime = await models.RepeatTime.findByPk(id, {
      include: [
        {
          model: models.Repeat,
          include: [models.RepeatTemplate]
        }
      ]
    });
    if (RepeatTime === null) {
      throw createDoesNoExistsError('Repeat time', id);
    }
    const RepeatTemplate = <RepeatTemplateInstance>(<RepeatInstance>RepeatTime.get('Repeat')).get('RepeatTemplate');

    const { groupRights } = await checkIfHasProjectRights(User, undefined, RepeatTemplate.get('ProjectId'), [], [{ right: 'repeat', action: 'edit' }]);
    if (!(<AccessRightsInstance>(<RoleInstance>User.get('Role')).get('AccessRight')).get('tasklistCalendar') && !groupRights.project.tasklistKalendar) {
      throw CantAddOrEditRepeatError;
    }

    const repeatId = RepeatTime.get('RepeatId');
    await RepeatTime.destroy();
    repeatTimeEvent.emit('changed', repeatId);
    return RepeatTime;
  },
}

const attributes = {
  RepeatTime: {
    async task(repeatTime) {
      const Task = await getModelAttribute(repeatTime, 'Task');
      if (Task) {
        Task.rights = repeatTime.rights;
      }
      return Task;
    },
    async repeat(repeatTime) {
      return getModelAttribute(repeatTime, 'Repeat');
    },
  },
};

export default {
  attributes,
  mutations,
  queries
}
