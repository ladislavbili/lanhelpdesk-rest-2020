import { CalendarEventQuerries } from './entities/calendarEvent';
import { CommentQuerries } from './entities/comment';
import { CompanyQuerries } from './entities/company';
import { CustomItemQuerries } from './entities/customItem';
import { ErrorMessageQuerries } from './entities/errorMessage';
import { EmailQuerries } from './entities/email';
import { FilterQuerries } from './entities/filter';
import { ImapQuerries } from './entities/imap';
import { MaterialQuerries } from './entities/material';
import { MilestoneQuerries } from './entities/milestone';
import { PricelistQuerries } from './entities/pricelist';
import { ProjectQuerries } from './entities/project';
import { RoleQuerries } from './entities/role';
import { SmtpQuerries } from './entities/smtp';
import { StatusQuerries } from './entities/status';
import { SubtaskQuerries } from './entities/subtask';
import { TagQuerries } from './entities/tag';
import { TaskQuerries } from './entities/task';
import { TaskChangeQuerries } from './entities/taskChange';
import { TaskTypeQuerries } from './entities/taskType';
import { TripTypeQuerries } from './entities/tripType';
import { UserQuerries } from './entities/user';
import { WorkTripQuerries } from './entities/workTrip';

export default `
type Query {
  ${CalendarEventQuerries}
  ${CommentQuerries}
  ${CompanyQuerries}
  ${CustomItemQuerries}
  ${ErrorMessageQuerries}
  ${EmailQuerries}
  ${FilterQuerries}
  ${ImapQuerries}
  ${MaterialQuerries}
  ${MilestoneQuerries}
  ${PricelistQuerries}
  ${ProjectQuerries}
  ${RoleQuerries}
  ${SmtpQuerries}
  ${StatusQuerries}
  ${SubtaskQuerries}
  ${TagQuerries}
  ${TaskQuerries}
  ${TaskChangeQuerries}
  ${TaskTypeQuerries}
  ${TripTypeQuerries}
  ${UserQuerries}
  ${WorkTripQuerries}
}
`
