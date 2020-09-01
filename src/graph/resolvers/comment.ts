import { createDoesNoExistsError, AssignedToUserNotSolvingTheTask, InternalMessagesNotAllowed } from 'configs/errors';
import { models } from 'models';
import { checkIfHasProjectRights } from "helperFunctions";
import { RoleInstance, AccessRightsInstance } from 'models/instances';
import { Op } from 'sequelize';
import checkResolver from './checkResolver';

const querries = {
  comments: async ( root , { taskId }, { req } ) => {
    const SourceUser = await checkResolver( req );
    const AccessRights = <AccessRightsInstance>(<RoleInstance> SourceUser.get('Role')).get('AccessRight');
    const {internal} = await checkIfHasProjectRights( SourceUser.get('id'), taskId );
    return models.Comment.findAll({
      order: [
        ['createdAt', 'ASC'],
      ],
      where:{
        TaskId: taskId,
        internal: {
          [Op.or]: [false, (internal || AccessRights.get('internal'))]
        },
        isParent: true
      }
    })
  },
}

const mutations = {
  addComment: async ( root, { task, parentCommentId, internal, ...params}, { req } ) => {
    const SourceUser = await checkResolver( req );
    const internalRight = (<AccessRightsInstance>(<RoleInstance>SourceUser.get('Role')).get('AccessRight')).get('internal');
    const { internal: allowedInternal } = await checkIfHasProjectRights( SourceUser.get('id'), task );
    if(internal && !allowedInternal && !internalRight ){
      throw InternalMessagesNotAllowed;
    }
    if(parentCommentId){
      const ParentComment = await models.Comment.findByPk(parentCommentId);
      if( ParentComment === null || ParentComment.get('TaskId') !== task ){
        throw createDoesNoExistsError('Parent comment', parentCommentId);
      }
      if(ParentComment.get('internal') && !allowedInternal && !internalRight ){
        throw InternalMessagesNotAllowed;
      }
    }

    return models.Comment.create({
      internal,
      TaskId: task,
      commentOfId: parentCommentId || null,
      isParent: parentCommentId === null || parentCommentId === undefined,
      UserId: SourceUser.get('id'),
      ...params,
    });
  },
}

const attributes = {
  Comment: {
    async user(comment) {
      return comment.getUser()
    },
    async task(comment) {
      return comment.getTask()
    },
    async childComments(comment){
      return comment.getComments()
    },
    async parentComment(comment) {
      return comment.getCommentOf()
    },
    async parentCommentId(comment) {
      return comment.get('CommentId')
    },
  }
};

export default {
  attributes,
  mutations,
  querries
}
