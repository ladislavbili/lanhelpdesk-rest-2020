import { createDoesNoExistsError, NoAccessToThisProjectError } from 'configs/errors';
import { models } from 'models';
import { ProjectInstance, ProjectRightInstance } from 'models/instances';
import checkResolver from './checkResolver';

const querries = {
  milestone: async ( root, { id }, { req } ) => {
    const User = await checkResolver( req );
    const Milestone = await models.Milestone.findByPk(id, { include: [{ model: models.Project, include: [{ model: models.ProjectRight }] }] });
    if( Milestone === null ){
      return null;
    }
    const Project = <ProjectInstance> Milestone.get('Project');
    const ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRights === undefined || !ProjectRights.get('read') ){
      return null;
    }
    return Milestone;
  },
}

const mutations = {
//  addMilestone( title: String!, description: String!, startsAt: Int, endsAt: Int ): Milestone

  addMilestone: async ( root, { projectId, ...args }, { req } ) => {
    const User = await checkResolver( req );
    const Project = <ProjectInstance> await models.Project.findByPk( projectId, { include: [{ model: models.ProjectRight }] });
    const ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRights === undefined || !ProjectRights.get('admin') ){
      throw NoAccessToThisProjectError;
    }
    return models.Milestone.create( {...args, ProjectId: projectId } );
  },

  //  updateMilestone( id: Int!, title: String, description: String, startsAt: Int, endsAt: Int ): Milestone
  updateMilestone: async ( root, { id, ...args }, { req } ) => {
    const User = await checkResolver( req );
    const Milestone = await models.Milestone.findByPk(id, { include: [{ model: models.Project, include: [{ model: models.ProjectRight }] }] });
    if( Milestone === null ){
      throw createDoesNoExistsError('Milestone', id);
    }
    const Project = <ProjectInstance> Milestone.get('Project');
    const ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRights === undefined || !ProjectRights.get('admin') ){
      throw NoAccessToThisProjectError;
    }

    return Milestone.update( args );
  },

  //  deleteMilestone( id: Int! ): Milestone
  deleteMilestone: async ( root, { id }, { req } ) => {
    const User = await checkResolver( req );
    const Milestone = await models.Milestone.findByPk(id, { include: [{ model: models.Project, include: [{ model: models.ProjectRight }] }] });
    if( Milestone === null ){
      throw createDoesNoExistsError('Milestone', id);
    }
    const Project = <ProjectInstance> Milestone.get('Project');
    const ProjectRights = (<ProjectRightInstance[]> Project.get('ProjectRights')).find( (right) => right.get('UserId') === User.get('id') );
    if( ProjectRights === undefined || !ProjectRights.get('admin') ){
      throw NoAccessToThisProjectError;
    }
    return Milestone.destroy();
  },
}

const attributes = {
  Milestone: {
    async project(milestone) {
      return milestone.getProject()
    },
    async tasks(milestone) {
      return milestone.getTasks()
    },
  },
};

export default {
  attributes,
  mutations,
  querries
}
