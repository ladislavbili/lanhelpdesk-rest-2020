import { CMDBAddressMutations } from './entities/cmdbAddress';
import { CMDBCategoryMutations } from './entities/cmdbCategory';
import { CMDBItemMutations } from './entities/cmdbItem';
import { CMDBManualMutations } from './entities/cmdbManual';
import { CMDBPasswordMutations } from './entities/cmdbPassword';
import { CMDBItemPasswordMutations } from './entities/cmdbItemPassword';
import { CMDBSchemeMutations } from './entities/cmdbScheme';
import { CommentMutations } from './entities/comment';
import { CommentAttachmentMutations } from './entities/commentAttachment';
import { CompanyMutations } from './entities/company';
import { ErrorMessageMutations } from './entities/errorMessage';
import { FilterMutations } from './entities/filter';
import { ImapMutations } from './entities/imap';
import { InvoiceMutations } from './entities/invoice';
import { InvoiceCompanyMutations } from './entities/invoiceCompany';
import { LanwikiFolderMutations } from './entities/lanwikiFolder';
import { LanwikiPageMutations } from './entities/lanwikiPage';
import { LanwikiTagMutations } from './entities/lanwikiTag';
import { MaterialMutations } from './entities/material';
import { MilestoneMutations } from './entities/milestone';
import { PassEntryMutations } from './entities/passEntry';
import { PassFolderMutations } from './entities/passFolder';
import { PricelistMutations } from './entities/pricelist';
import { ProjectMutations } from './entities/project';
import { ProjectAttachmentMutations } from './entities/projectAttachment';
import { ProjectGroupMutations } from './entities/projectGroup';
import { RepeatMutations } from './entities/repeat';
import { RepeatTemplateMutations } from './entities/repeatTemplate';
import { RepeatTemplateAttachmentMutations } from './entities/repeatTemplateAttachment';
import { RepeatTimeMutations } from './entities/repeatTime';
import { RoleMutations } from './entities/role';
import { ScheduledWorkMutations } from './entities/scheduledWork';
import { ShortSubtaskMutations } from './entities/shortSubtask';
import { SmtpMutations } from './entities/smtp';
import { StatusMutations } from './entities/status';
import { SubtaskMutations } from './entities/subtask';
import { TagMutations } from './entities/tag';
import { TaskMutations } from './entities/task';
import { TaskAttachmentMutations } from './entities/taskAttachment';
import { TaskChangeMutations } from './entities/taskChange';
import { TasklistColumnPreferenceMutations } from './entities/tasklistColumnPreference';
import { TasklistGanttColumnPreferenceMutations } from './entities/tasklistGanttColumnPreference';
import { TasklistSortMutations } from './entities/tasklistSort';
import { TaskMetadataMutations } from './entities/taskMetadata';
import { TaskTypeMutations } from './entities/taskType';
import { TripTypeMutations } from './entities/tripType';
import { UserMutations } from './entities/user';
import { UserNotificationMutations } from './entities/userNotification';
import { WorkTripMutations } from './entities/workTrip';

export default `
type Mutation {
  ${CMDBAddressMutations}
  ${CMDBCategoryMutations}
  ${CMDBItemMutations}
  ${CMDBManualMutations}
  ${CMDBPasswordMutations}
  ${CMDBItemPasswordMutations}
  ${CMDBSchemeMutations}
  ${CompanyMutations}
  ${CommentMutations}
  ${CommentAttachmentMutations}
  ${ErrorMessageMutations}
  ${FilterMutations}
  ${ImapMutations}
  ${InvoiceMutations}
  ${InvoiceCompanyMutations}
  ${LanwikiFolderMutations}
  ${LanwikiPageMutations}
  ${LanwikiTagMutations}
  ${MaterialMutations}
  ${MilestoneMutations}
  ${PassEntryMutations}
  ${PassFolderMutations}
  ${PricelistMutations}
  ${ProjectMutations}
  ${ProjectAttachmentMutations}
  ${ProjectGroupMutations}
  ${RepeatMutations}
  ${RepeatTemplateMutations}
  ${RepeatTemplateAttachmentMutations}
  ${RepeatTimeMutations}
  ${RoleMutations}
  ${ScheduledWorkMutations}
  ${ShortSubtaskMutations}
  ${SmtpMutations}
  ${StatusMutations}
  ${SubtaskMutations}
  ${TagMutations}
  ${TaskMutations}
  ${TaskAttachmentMutations}
  ${TaskChangeMutations}
  ${TasklistColumnPreferenceMutations}
  ${TasklistGanttColumnPreferenceMutations}
  ${TasklistSortMutations}
  ${TaskMetadataMutations}
  ${TaskTypeMutations}
  ${TripTypeMutations}
  ${UserMutations}
  ${UserNotificationMutations}
  ${WorkTripMutations}
}
`
