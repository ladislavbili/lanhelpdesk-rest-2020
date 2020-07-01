import { gql } from 'apollo-server-express';
import Querries from './querries';
import Mutations from './mutations';

import Task from './entities/task';
import Tag from './entities/tag';

export default gql`
  ${Task}
  ${Tag}

  ${Querries}
  ${Mutations}
`;
