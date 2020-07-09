import { TagQuerries } from './entities/tag';
import { TaskQuerries } from './entities/task';
import { UserQuerries } from './entities/user';
import { RoleQuerries } from './entities/role';

export default `
type Query {
  ${TagQuerries}
  ${TaskQuerries}
  ${UserQuerries}
  ${RoleQuerries}
}
`
