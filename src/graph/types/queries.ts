import { CommentQueries } from './entities/comment';
import { CommentAttachmentQueries } from './entities/commentAttachment';
import { CompanyQueries } from './entities/company';
import { CustomItemQueries } from './entities/customItem';
import { ErrorMessageQueries } from './entities/errorMessage';
import { FilterQueries } from './entities/filter';
import { ImapQueries } from './entities/imap';
import { InvoicedTaskQueries } from './entities/invoicedTask';
import { MaterialQueries } from './entities/material';
import { MilestoneQueries } from './entities/milestone';
import { PricelistQueries } from './entities/pricelist';
import { ProjectQueries } from './entities/project';
import { ProjectAttachmentQueries } from './entities/projectAttachment';
import { ProjectGroupQueries } from './entities/projectGroup';
import { RepeatQueries } from './entities/repeat';
import { RepeatTemplateQueries } from './entities/repeatTemplate';
import { RepeatTemplateAttachmentQueries } from './entities/repeatTemplateAttachment';
import { RepeatTimeQueries } from './entities/repeatTime';
import { RoleQueries } from './entities/role';
import { ScheduledTaskQueries } from './entities/scheduledTask';
import { ShortSubtaskQueries } from './entities/shortSubtask';
import { SmtpQueries } from './entities/smtp';
import { StatusQueries } from './entities/status';
import { SubtaskQueries } from './entities/subtask';
import { TagQueries } from './entities/tag';
import { TaskQueries } from './entities/task';
import { TaskAttachmentQueries } from './entities/taskAttachment';
import { TaskChangeQueries } from './entities/taskChange';
import { TaskInvoiceQueries } from './entities/taskInvoice';
import { TasklistColumnPreferenceQueries } from './entities/tasklistColumnPreference';
import { TasklistGanttColumnPreferenceQueries } from './entities/tasklistGanttColumnPreference';
import { TasklistSortQueries } from './entities/tasklistSort';
import { TaskMetadataQueries } from './entities/taskMetadata';
import { TaskTypeQueries } from './entities/taskType';
import { TripTypeQueries } from './entities/tripType';
import { UserQueries } from './entities/user';
import { UserInvoiceQueries } from './entities/userInvoice';
import { UserNotificationQueries } from './entities/userNotification';
import { WorkTripQueries } from './entities/workTrip';

export default `
type Query {
  ${CommentQueries}
  ${CommentAttachmentQueries}
  ${CompanyQueries}
  ${CustomItemQueries}
  ${ErrorMessageQueries}
  ${FilterQueries}
  ${ImapQueries}
  ${InvoicedTaskQueries}
  ${MaterialQueries}
  ${MilestoneQueries}
  ${PricelistQueries}
  ${ProjectQueries}
  ${ProjectAttachmentQueries}
  ${ProjectGroupQueries}
  ${RepeatQueries}
  ${RepeatTemplateQueries}
  ${RepeatTemplateAttachmentQueries}
  ${RepeatTimeQueries}
  ${RoleQueries}
  ${ScheduledTaskQueries}
  ${ShortSubtaskQueries}
  ${SmtpQueries}
  ${StatusQueries}
  ${SubtaskQueries}
  ${TagQueries}
  ${TaskQueries}
  ${TaskAttachmentQueries}
  ${TaskChangeQueries}
  ${TaskInvoiceQueries}
  ${TasklistColumnPreferenceQueries}
  ${TasklistGanttColumnPreferenceQueries}
  ${TasklistSortQueries}
  ${TaskMetadataQueries}
  ${TaskTypeQueries}
  ${TripTypeQueries}
  ${UserQueries}
  ${UserInvoiceQueries}
  ${UserNotificationQueries}
  ${WorkTripQueries}
}
`
