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
} from '@/models/instances';
import {
  allGroupRights
} from '@/configs/projectConstants';
import checkResolver from './checkResolver';
import { getModelAttribute, extractDatesFromObject } from '@/helperFunctions';
import { repeatTimeEvent } from '@/services/repeatTasks';


const queries = {
  repeatTimes: async (root, { repeatId, repeatIds, active, ...rangeDates }, { req }) => {
    const User = <UserInstance>await checkResolver(req, ['tasklistCalendar']);
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
      const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
        attributes: ['id'],
        include: [
          {
            model: models.ProjectGroupRights,
            required: true,
            where: {
              repeatRead: true,
            }
          },
          {
            model: models.Project,
            attributes: ['id'],
            required: true,
            include: [
              {
                required: true,
                model: models.RepeatTemplate,
                attributes: ['id', 'title'],
                include: [
                  {
                    required: true,
                    model: models.Repeat,
                    where: repeatWhere,
                    include: [{
                      model: models.RepeatTime,
                      required: true,
                      where: repeatTimeWhere,
                      include: [
                        {
                          model: models.Task,
                          include: [models.Status]
                        }
                      ]
                    }]
                  }
                ]
              }
            ]
          }
        ]
      });

      return <RepeatTimeInstance[]>ProjectGroups.reduce((acc, ProjectGroup) => {
        const ProjectGroupRights = <ProjectGroupRightsInstance>ProjectGroup.get('ProjectGroupRight');
        const Project = <ProjectInstance>ProjectGroup.get('Project');

        return [
          ...acc,
          ...(<RepeatInstance[]>(<RepeatTemplateInstance[]>Project.get('RepeatTemplates'))
            .map((RepeatTemplate) => {
              let Repeat = <RepeatInstance>RepeatTemplate.get('Repeat');
              Repeat.RepeatTemplate = RepeatTemplate;
              return Repeat;
            }))
            .reduce((acc2, Repeat) => {
              return [
                ...acc2,
                ...(<RepeatTimeInstance[]>Repeat.get('RepeatTimes')).map((RepeatTime) => {
                  RepeatTime.Repeat = Repeat;
                  RepeatTime.canEdit = <boolean>ProjectGroupRights.get('repeatWrite');
                  RepeatTime.canCreateTask = <boolean>ProjectGroupRights.get('repeatRead') && <boolean>ProjectGroupRights.get('addTasks');
                  RepeatTime.rights = ProjectGroupRights.get();
                  return RepeatTime;
                })
              ]
            }, []),
        ]
      }, []);

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
            include: [models.RepeatTemplate],
            where: repeatWhere
          },
        ]
      });

      return RepeatTimes.map((RepeatTime) => {
        RepeatTime.canEdit = <boolean>true;
        RepeatTime.canCreateTask = <boolean>true;
        RepeatTime.rights = allGroupRights;
        return RepeatTime;
      })
    }
  },
}

const mutations = {
  addRepeatTime: async (root, { repeatId, ...params }, { req }) => {
    const User = <UserInstance>await checkResolver(req, ['tasklistCalendar']);
    const Repeat = <RepeatInstance>await models.Repeat.findByPk(repeatId, {
      include: [
        models.RepeatTemplate
      ]
    });
    const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
      attributes: ['id'],
      include: [
        {
          model: models.ProjectGroupRights,
          required: true,
          attributes: ['repeatWrite'],
          where: {
            repeatWrite: true,
          }
        },
      ],
      where: {
        ProjectId: (<RepeatTemplateInstance>Repeat.get('RepeatTemplate')).get('ProjectId')
      }
    });
    if (ProjectGroups.length === 0 && (<RoleInstance>User.get('Role')).get('level') !== 0) {
      throw CantAddOrEditRepeatError;
    }
    const dates = extractDatesFromObject(params, ['originalTrigger', 'triggersAt']);

    let NewRepeatTime = <RepeatTimeInstance>await models.RepeatTime.create({
      RepeatId: repeatId,
      ...params,
      ...dates
    });
    const projectGroupRights = (<RoleInstance>User.get('Role')).get('level') === 0 ? allGroupRights : (<ProjectGroupRightsInstance>ProjectGroups[0].get('ProjectGroupRight')).get();
    NewRepeatTime.canEdit = projectGroupRights.repeatWrite;
    NewRepeatTime.canCreateTask = projectGroupRights.repeatRead && projectGroupRights.addTasks;
    NewRepeatTime.rights = projectGroupRights;
    repeatTimeEvent.emit('changed', repeatId);
    return NewRepeatTime;
  },

  updateRepeatTime: async (root, { id, ...params }, { req }) => {
    const User = <UserInstance>await checkResolver(req, ['tasklistCalendar']);
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
    const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
      attributes: ['id'],
      include: [
        {
          model: models.ProjectGroupRights,
          required: true,
          attributes: ['repeatWrite'],
          where: {
            repeatWrite: true,
          }
        },
      ],
      where: {
        ProjectId: (<RepeatTemplateInstance>(<RepeatInstance>RepeatTime.get('Repeat')).get('RepeatTemplate')).get('ProjectId')
      }
    });
    if (ProjectGroups.length === 0 && (<RoleInstance>User.get('Role')).get('level') !== 0) {
      throw CantAddOrEditRepeatError;
    }
    const dates = params.triggersAt ? extractDatesFromObject(params, ['triggersAt']) : {};
    await RepeatTime.update({
      ...params,
      ...dates,
    });
    repeatTimeEvent.emit('changed', RepeatTime.get('RepeatId'));
    const projectGroupRights = (<RoleInstance>User.get('Role')).get('level') === 0 ? allGroupRights : (<ProjectGroupRightsInstance>ProjectGroups[0].get('ProjectGroupRight')).get();
    RepeatTime.canEdit = projectGroupRights.repeatWrite;
    RepeatTime.canCreateTask = projectGroupRights.repeatRead && projectGroupRights.addTasks;
    RepeatTime.rights = projectGroupRights;
    return RepeatTime;
  },

  deleteRepeatTime: async (root, { id }, { req }) => {
    const User = <UserInstance>await checkResolver(req);
    const RepeatTime = await models.RepeatTime.findByPk(id, {
      include: [models.Repeat]
    });
    if (RepeatTime === null) {
      throw createDoesNoExistsError('Repeat time', id);
    }
    const ProjectGroups = <ProjectGroupInstance[]>await User.getProjectGroups({
      attributes: ['id'],
      include: [
        {
          model: models.ProjectGroupRights,
          required: true,
          attributes: ['repeatWrite'],
          where: {
            repeatWrite: true,
          }
        },
      ],
      where: {
        ProjectId: (<RepeatTemplateInstance>(<RepeatInstance>RepeatTime.get('Repeat')).get('RepeatTemplate')).get('ProjectId')
      }
    });
    if (ProjectGroups.length === 0 && (<RoleInstance>User.get('Role')).get('level') !== 0) {
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
