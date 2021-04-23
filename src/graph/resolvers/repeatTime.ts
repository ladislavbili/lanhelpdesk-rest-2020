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
import checkResolver from './checkResolver';
import { getModelAttribute, extractDatesFromObject } from '@/helperFunctions';
import { repeatTimeEvent } from '@/services/repeatTasks';


const querries = {
  repeatTimes: async (root, { repeatId, repeatIds, active, ...rangeDates }, { req }) => {
    const User = <UserInstance>await checkResolver(req);
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
            attributes: ['repeatWrite', 'repeatRead'],
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
                attributes: ['id'],
                include: [
                  {
                    required: true,
                    model: models.Repeat,
                    where: repeatWhere,
                    attributes: ['id'],
                    include: [{
                      model: models.RepeatTime,
                      required: true,
                      where: repeatTimeWhere,
                      include: [models.Task]
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
                  return RepeatTime;
                })
              ]
            }, []),
        ]
      }, []);
      /*
        return (<RepeatTimeInstance[]>
          (<RepeatInstance[]>
            (<RepeatTemplateInstance[]>
              (<ProjectInstance[]>
                ProjectGroups.map((ProjectGroup) => ProjectGroup.get('Project'))
              ).reduce((acc, cur) => [...acc, ...(<RepeatTemplateInstance[]>cur.get('RepeatTemplates'))], [])
            ).map((RepeatTemplate) => RepeatTemplate.get('Repeat'))
          ).reduce((acc, cur) =>
            [...acc,
            ...((<RepeatTimeInstance[]>cur.get('RepeatTimes')).map((RepeatTime) => {
              RepeatTime.Repeat = cur;
              RepeatTime.canWrite = ;
              return RepeatTime;
            }))
            ], [])
        );
        */

    } else {
      const RepeatTimes = <RepeatTimeInstance[]>await models.RepeatTime.findAll({
        where: repeatTimeWhere,
        include: [
          models.Task,
          {
            model: models.Repeat,
            include: [models.RepeatTemplate],
            where: repeatWhere
          },
        ]
      });

      return RepeatTimes.map((RepeatTime) => {
        RepeatTime.canEdit = <boolean>true;
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

    const NewRepeatTime = await models.RepeatTime.create({
      RepeatId: repeatId,
      ...params,
      ...dates
    });
    repeatTimeEvent.emit('changed', repeatId);
    return NewRepeatTime;
  },

  updateRepeatTime: async (root, { id, ...params }, { req }) => {
    const User = <UserInstance>await checkResolver(req);
    const RepeatTime = await models.RepeatTime.findByPk(id, {
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
      return getModelAttribute(repeatTime, 'Task');
    },
    async repeat(repeatTime) {
      return getModelAttribute(repeatTime, 'Repeat');
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
