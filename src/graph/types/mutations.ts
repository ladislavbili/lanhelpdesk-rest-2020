import { TagMutations } from './entities/tag';
import { TaskMutations } from './entities/task';
import { UserMutations } from './entities/user';

export default `
type Mutation {
  ${TagMutations}
  ${TaskMutations}
  ${UserMutations}
}
`
