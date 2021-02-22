import { CalendarEventMutations } from './entities/calendarEvent';
import { CommentMutations } from './entities/comment';
import { CommentAttachmentMutations } from './entities/commentAttachment';
import { CompanyMutations } from './entities/company';
import { CustomItemMutations } from './entities/customItem';
import { ErrorMessageMutations } from './entities/errorMessage';
import { FilterMutations } from './entities/filter';
import { ImapMutations } from './entities/imap';
import { InvoicedTaskMutations } from './entities/invoicedTask';
import { MaterialMutations } from './entities/material';
import { MilestoneMutations } from './entities/milestone';
import { PricelistMutations } from './entities/pricelist';
import { ProjectMutations } from './entities/project';
import { ProjectGroupMutations } from './entities/projectGroup';
import { RoleMutations } from './entities/role';
import { ScheduledTaskMutations } from './entities/scheduledTask';
import { ShortSubtaskMutations } from './entities/shortSubtask';
import { SmtpMutations } from './entities/smtp';
import { StatusMutations } from './entities/status';
import { SubtaskMutations } from './entities/subtask';
import { TagMutations } from './entities/tag';
import { TaskMutations } from './entities/task';
import { TaskAttachmentMutations } from './entities/taskAttachment';
import { TaskChangeMutations } from './entities/taskChange';
import { TaskInvoiceMutations } from './entities/taskInvoice';
import { TaskTypeMutations } from './entities/taskType';
import { TripTypeMutations } from './entities/tripType';
import { UserMutations } from './entities/user';
import { UserInvoiceMutations } from './entities/userInvoice';
import { UserNotificationMutations } from './entities/userNotification';
import { WorkTripMutations } from './entities/workTrip';
import { RepeatMutations } from './entities/repeat';
import { RepeatTemplateMutations } from './entities/repeatTemplate';
import { RepeatTemplateAttachmentMutations } from './entities/repeatTemplateAttachment';

export default `
type Mutation {
  ${CalendarEventMutations}
  ${CompanyMutations}
  ${CommentMutations}
  ${CommentAttachmentMutations}
  ${CustomItemMutations}
  ${ErrorMessageMutations}
  ${FilterMutations}
  ${ImapMutations}
  ${InvoicedTaskMutations}
  ${MaterialMutations}
  ${MilestoneMutations}
  ${PricelistMutations}
  ${ProjectMutations}
  ${ProjectGroupMutations}
  ${RoleMutations}
  ${ScheduledTaskMutations}
  ${ShortSubtaskMutations}
  ${SmtpMutations}
  ${StatusMutations}
  ${SubtaskMutations}
  ${TagMutations}
  ${TaskMutations}
  ${TaskAttachmentMutations}
  ${TaskChangeMutations}
  ${TaskInvoiceMutations}
  ${TaskTypeMutations}
  ${TripTypeMutations}
  ${UserMutations}
  ${UserInvoiceMutations}
  ${UserNotificationMutations}
  ${WorkTripMutations}
  ${RepeatMutations}
  ${RepeatTemplateMutations}
  ${RepeatTemplateAttachmentMutations}
}
`
