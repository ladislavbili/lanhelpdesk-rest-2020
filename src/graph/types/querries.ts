import { TagQuerries } from './entities/tag';
import { TaskQuerries } from './entities/task';
import { UserQuerries } from './entities/user';

export default `
type Query {
  ${TagQuerries}
  ${TaskQuerries}
  ${UserQuerries}
}
`
