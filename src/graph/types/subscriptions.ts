import { CommentSubscriptions } from './entities/comment';
import { CompanySubscriptions } from './entities/company';
import { ErrorMessageSubscriptions } from './entities/errorMessage';
import { FilterSubscriptions } from './entities/filter';
import { MilestoneSubscriptions } from './entities/milestone';
import { PricelistSubscriptions } from './entities/pricelist';
import { ProjectSubscriptions } from './entities/project';
import { ProjectGroupSubscriptions } from './entities/projectGroup';
import { RepeatSubscriptions } from './entities/repeat';
import { RoleSubscriptions } from './entities/role';
import { StatusSubscriptions } from './entities/status';
import { TaskSubscriptions } from './entities/task';
import { TaskChangeSubscriptions } from './entities/taskChange';
import { TaskTypeSubscriptions } from './entities/taskType';
import { TripTypeSubscriptions } from './entities/tripType';
import { UserSubscriptions } from './entities/user';
import { UserNotificationSubscriptions } from './entities/userNotification';

export default `
type Subscription {
  ${CommentSubscriptions}
  ${CompanySubscriptions}
  ${ErrorMessageSubscriptions}
  ${FilterSubscriptions}
  ${MilestoneSubscriptions}
  ${PricelistSubscriptions}
  ${ProjectSubscriptions}
  ${ProjectGroupSubscriptions}
  ${RepeatSubscriptions}
  ${RoleSubscriptions}
  ${StatusSubscriptions}
  ${TaskSubscriptions}
  ${TaskChangeSubscriptions}
  ${TaskTypeSubscriptions}
  ${TripTypeSubscriptions}
  ${UserSubscriptions}
  ${UserNotificationSubscriptions}
}
`
