import { CompanyMutations } from './entities/company';
import { PricelistMutations } from './entities/pricelist';
import { RoleMutations } from './entities/role';
import { SmtpMutations } from './entities/smtp';
import { TagMutations } from './entities/tag';
import { TaskMutations } from './entities/task';
import { TaskTypeMutations } from './entities/taskType';
import { TripTypeMutations } from './entities/tripType';
import { UserMutations } from './entities/user';

export default `
type Mutation {
  ${CompanyMutations}
  ${PricelistMutations}
  ${RoleMutations}
  ${SmtpMutations}
  ${TagMutations}
  ${TaskMutations}
  ${TaskTypeMutations}
  ${TripTypeMutations}
  ${UserMutations}
}
`
