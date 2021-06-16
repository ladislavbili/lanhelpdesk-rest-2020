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
import { ProjectAttachmentMutations } from './entities/projectAttachment';
import { ProjectGroupMutations } from './entities/projectGroup';
import { RepeatMutations } from './entities/repeat';
import { RepeatTemplateMutations } from './entities/repeatTemplate';
import { RepeatTemplateAttachmentMutations } from './entities/repeatTemplateAttachment';
import { RepeatTimeMutations } from './entities/repeatTime';
import { RoleMutations } from './entities/role';
import { ScheduledTaskMutations } from './entities/scheduledTask';
import { ScheduledWorkMutations } from './entities/scheduledWork';
import { ShortSubtaskMutations } from './entities/shortSubtask';
import { SmtpMutations } from './entities/smtp';
import { StatusMutations } from './entities/status';
import { SubtaskMutations } from './entities/subtask';
import { TagMutations } from './entities/tag';
import { TaskMutations } from './entities/task';
import { TaskAttachmentMutations } from './entities/taskAttachment';
import { TaskChangeMutations } from './entities/taskChange';
import { TaskInvoiceMutations } from './entities/taskInvoice';
import { TasklistColumnPreferenceMutations } from './entities/tasklistColumnPreference';
import { TasklistGanttColumnPreferenceMutations } from './entities/tasklistGanttColumnPreference';
import { TaskMetadataMutations } from './entities/taskMetadata';
import { TaskTypeMutations } from './entities/taskType';
import { TripTypeMutations } from './entities/tripType';
import { UserMutations } from './entities/user';
import { UserInvoiceMutations } from './entities/userInvoice';
import { UserNotificationMutations } from './entities/userNotification';
import { WorkTripMutations } from './entities/workTrip';

export default `
type Mutation {
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
  ${ProjectAttachmentMutations}
  ${ProjectGroupMutations}
  ${RepeatMutations}
  ${RepeatTemplateMutations}
  ${RepeatTemplateAttachmentMutations}
  ${RepeatTimeMutations}
  ${RoleMutations}
  ${ScheduledTaskMutations}
  ${ScheduledWorkMutations}
  ${ShortSubtaskMutations}
  ${SmtpMutations}
  ${StatusMutations}
  ${SubtaskMutations}
  ${TagMutations}
  ${TaskMutations}
  ${TaskAttachmentMutations}
  ${TaskChangeMutations}
  ${TaskInvoiceMutations}
  ${TasklistColumnPreferenceMutations}
  ${TasklistGanttColumnPreferenceMutations}
  ${TaskMetadataMutations}
  ${TaskTypeMutations}
  ${TripTypeMutations}
  ${UserMutations}
  ${UserInvoiceMutations}
  ${UserNotificationMutations}
  ${WorkTripMutations}
}
`
