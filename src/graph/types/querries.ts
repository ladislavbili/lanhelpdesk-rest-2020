import { CompanyQuerries } from './entities/company';
import { PricelistQuerries } from './entities/pricelist';
import { RoleQuerries } from './entities/role';
import { TagQuerries } from './entities/tag';
import { TaskQuerries } from './entities/task';
import { TaskTypeQuerries } from './entities/taskType';
import { TripTypeQuerries } from './entities/tripType';
import { UserQuerries } from './entities/user';

export default `
type Query {
  ${CompanyQuerries}
  ${PricelistQuerries}
  ${RoleQuerries}
  ${TagQuerries}
  ${TaskQuerries}
  ${TaskTypeQuerries}
  ${TripTypeQuerries}
  ${UserQuerries}
}
`
