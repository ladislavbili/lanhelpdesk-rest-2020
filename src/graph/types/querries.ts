import { CompanyQuerries } from './entities/company';
import { ErrorMessageQuerries } from './entities/errorMessage';
import { FilterQuerries } from './entities/filter';
import { ImapQuerries } from './entities/imap';
import { MilestoneQuerries } from './entities/milestone';
import { PricelistQuerries } from './entities/pricelist';
import { ProjectQuerries } from './entities/project';
import { RoleQuerries } from './entities/role';
import { TagQuerries } from './entities/tag';
import { SmtpQuerries } from './entities/smtp';
import { StatusQuerries } from './entities/status';
import { TaskQuerries } from './entities/task';
import { TaskTypeQuerries } from './entities/taskType';
import { TripTypeQuerries } from './entities/tripType';
import { UserQuerries } from './entities/user';

export default `
type Query {
  ${CompanyQuerries}
  ${ErrorMessageQuerries}
  ${FilterQuerries}
  ${ImapQuerries}
  ${MilestoneQuerries}
  ${PricelistQuerries}
  ${ProjectQuerries}
  ${RoleQuerries}
  ${SmtpQuerries}
  ${StatusQuerries}
  ${TagQuerries}
  ${TaskQuerries}
  ${TaskTypeQuerries}
  ${TripTypeQuerries}
  ${UserQuerries}
}
`
