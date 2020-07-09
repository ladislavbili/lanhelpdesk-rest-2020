import { TagMutations } from './entities/tag';
import { TaskMutations } from './entities/task';
import { UserMutations } from './entities/user';
import { RoleMutations } from './entities/role';

export default `
type Mutation {
  ${TagMutations}
  ${TaskMutations}
  ${UserMutations}
  ${RoleMutations}
}
`
