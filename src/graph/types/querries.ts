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
import { ProjectAttachmentQuerries } from './entities/projectAttachment';
import { ProjectGroupQuerries } from './entities/projectGroup';
import { RepeatQuerries } from './entities/repeat';
import { RepeatTemplateQuerries } from './entities/repeatTemplate';
import { RepeatTemplateAttachmentQuerries } from './entities/repeatTemplateAttachment';
import { RepeatTimeQuerries } from './entities/repeatTime';
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
import { TasklistColumnPreferenceQuerries } from './entities/tasklistColumnPreference';
import { TasklistGanttColumnPreferenceQuerries } from './entities/tasklistGanttColumnPreference';
import { TasklistSortQuerries } from './entities/tasklistSort';
import { TaskMetadataQuerries } from './entities/taskMetadata';
import { TaskTypeQuerries } from './entities/taskType';
import { TripTypeQuerries } from './entities/tripType';
import { UserQuerries } from './entities/user';
import { UserInvoiceQuerries } from './entities/userInvoice';
import { UserNotificationQuerries } from './entities/userNotification';
import { WorkTripQuerries } from './entities/workTrip';

export default `
type Query {
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
  ${ProjectAttachmentQuerries}
  ${ProjectGroupQuerries}
  ${RepeatQuerries}
  ${RepeatTemplateQuerries}
  ${RepeatTemplateAttachmentQuerries}
  ${RepeatTimeQuerries}
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
  ${TasklistColumnPreferenceQuerries}
  ${TasklistGanttColumnPreferenceQuerries}
  ${TasklistSortQuerries}
  ${TaskMetadataQuerries}
  ${TaskTypeQuerries}
  ${TripTypeQuerries}
  ${UserQuerries}
  ${UserInvoiceQuerries}
  ${UserNotificationQuerries}
  ${WorkTripQuerries}
}
`
