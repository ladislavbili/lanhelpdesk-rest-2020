import { CalendarEventQuerries } from './entities/calendarEvent';
import { CommentQuerries } from './entities/comment';
import { CommentAttachmentQuerries } from './entities/commentAttachment';
import { CompanyQuerries } from './entities/company';
import { CustomItemQuerries } from './entities/customItem';
import { ErrorMessageQuerries } from './entities/errorMessage';
import { FilterQuerries } from './entities/filter';
import { ImapQuerries } from './entities/imap';
import { InvoicedTaskQuerries } from './entities/invoicedTask';
import { MaterialQuerries } from './entities/material';
import { MilestoneQuerries } from './entities/milestone';
import { PricelistQuerries } from './entities/pricelist';
import { ProjectQuerries } from './entities/project';
import { ProjectGroupQuerries } from './entities/projectGroup';
import { RoleQuerries } from './entities/role';
import { ScheduledTaskQuerries } from './entities/scheduledTask';
import { ShortSubtaskQuerries } from './entities/shortSubtask';
import { SmtpQuerries } from './entities/smtp';
import { StatusQuerries } from './entities/status';
import { SubtaskQuerries } from './entities/subtask';
import { TagQuerries } from './entities/tag';
import { TaskQuerries } from './entities/task';
import { TaskAttachmentQuerries } from './entities/taskAttachment';
import { TaskChangeQuerries } from './entities/taskChange';
import { TaskInvoiceQuerries } from './entities/taskInvoice';
import { TaskTypeQuerries } from './entities/taskType';
import { TripTypeQuerries } from './entities/tripType';
import { UserQuerries } from './entities/user';
import { UserInvoiceQuerries } from './entities/userInvoice';
import { UserNotificationQuerries } from './entities/userNotification';
import { WorkTripQuerries } from './entities/workTrip';
import { RepeatQuerries } from './entities/repeat';
import { RepeatTemplateQuerries } from './entities/repeatTemplate';
import { RepeatTemplateAttachmentQuerries } from './entities/repeatTemplateAttachment';

export default `
type Query {
  ${CalendarEventQuerries}
  ${CommentQuerries}
  ${CommentAttachmentQuerries}
  ${CompanyQuerries}
  ${CustomItemQuerries}
  ${ErrorMessageQuerries}
  ${FilterQuerries}
  ${ImapQuerries}
  ${InvoicedTaskQuerries}
  ${MaterialQuerries}
  ${MilestoneQuerries}
  ${PricelistQuerries}
  ${ProjectQuerries}
  ${ProjectGroupQuerries}
  ${RoleQuerries}
  ${ScheduledTaskQuerries}
  ${ShortSubtaskQuerries}
  ${SmtpQuerries}
  ${StatusQuerries}
  ${SubtaskQuerries}
  ${TagQuerries}
  ${TaskQuerries}
  ${TaskAttachmentQuerries}
  ${TaskChangeQuerries}
  ${TaskInvoiceQuerries}
  ${TaskTypeQuerries}
  ${TripTypeQuerries}
  ${UserQuerries}
  ${UserInvoiceQuerries}
  ${UserNotificationQuerries}
  ${WorkTripQuerries}
  ${RepeatQuerries}
  ${RepeatTemplateQuerries}
  ${RepeatTemplateAttachmentQuerries}
}
`
