import { CompanyMutations } from './entities/company';
import { ErrorMessageMutations } from './entities/errorMessage';
import { ImapMutations } from './entities/imap';
import { PricelistMutations } from './entities/pricelist';
import { ProjectMutations } from './entities/project';
import { RoleMutations } from './entities/role';
import { SmtpMutations } from './entities/smtp';
import { StatusMutations } from './entities/status';
import { TagMutations } from './entities/tag';
import { TaskMutations } from './entities/task';
import { TaskTypeMutations } from './entities/taskType';
import { TripTypeMutations } from './entities/tripType';
import { UserMutations } from './entities/user';

export default `
type Mutation {
  ${CompanyMutations}
  ${ErrorMessageMutations}
  ${ImapMutations}
  ${PricelistMutations}
  ${ProjectMutations}
  ${RoleMutations}
  ${SmtpMutations}
  ${StatusMutations}
  ${TagMutations}
  ${TaskMutations}
  ${TaskTypeMutations}
  ${TripTypeMutations}
  ${UserMutations}
}
`
