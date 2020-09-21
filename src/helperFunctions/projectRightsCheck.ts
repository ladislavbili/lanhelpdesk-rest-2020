import { models } from '@/models';
import {
  createDoesNoExistsError,
  InsufficientProjectAccessError
} from '@/configs/errors';
import { ProjectRightInstance } from '@/models/instances';


export const checkIfHasProjectRights = async (userId, taskId, right = 'read') => {
  const User = await models.User.findByPk(userId, { include: [{ model: models.ProjectRight }] })
  const Task = await models.Task.findByPk(taskId);
  if (Task === null) {
    throw createDoesNoExistsError('Task', taskId);
  }
  const ProjectRight = (<ProjectRightInstance[]>User.get('ProjectRights')).find((ProjectRight) => ProjectRight.get('ProjectId') === Task.get('ProjectId'));
  if (ProjectRight !== undefined) {
  }
  if (ProjectRight === undefined || !ProjectRight.get(right)) {
    throw InsufficientProjectAccessError;
  }

  return { ProjectRight, Task, internal: ProjectRight.get('internal') };
}
