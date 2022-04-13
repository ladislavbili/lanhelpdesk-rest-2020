import { CMDBAddressQueries } from './entities/cmdbAddress';
import { CMDBCategoryQueries } from './entities/cmdbCategory';
import { CMDBItemQueries } from './entities/cmdbItem';
import { CMDBManualQueries } from './entities/cmdbManual';
import { CMDBPasswordQueries } from './entities/cmdbPassword';
import { CMDBItemPasswordQueries } from './entities/cmdbItemPassword';
import { CMDBSchemeQueries } from './entities/cmdbScheme';
import { CommentQueries } from './entities/comment';
import { CommentAttachmentQueries } from './entities/commentAttachment';
import { CompanyQueries } from './entities/company';
import { ErrorMessageQueries } from './entities/errorMessage';
import { FilterQueries } from './entities/filter';
import { ImapQueries } from './entities/imap';
import { InvoiceQueries } from './entities/invoice';
import { InvoiceCompanyQueries } from './entities/invoiceCompany';
import { LanwikiFolderQueries } from './entities/lanwikiFolder';
import { LanwikiPageQueries } from './entities/lanwikiPage';
import { LanwikiTagQueries } from './entities/lanwikiTag';
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
import { ShortSubtaskQueries } from './entities/shortSubtask';
import { ScheduledWorkQueries } from './entities/scheduledWork';
import { SmtpQueries } from './entities/smtp';
import { StatusQueries } from './entities/status';
import { SubtaskQueries } from './entities/subtask';
import { TagQueries } from './entities/tag';
import { TaskQueries } from './entities/task';
import { TaskAttachmentQueries } from './entities/taskAttachment';
import { TaskChangeQueries } from './entities/taskChange';
import { TasklistColumnPreferenceQueries } from './entities/tasklistColumnPreference';
import { TasklistGanttColumnPreferenceQueries } from './entities/tasklistGanttColumnPreference';
import { TasklistSortQueries } from './entities/tasklistSort';
import { TaskMetadataQueries } from './entities/taskMetadata';
import { TaskTypeQueries } from './entities/taskType';
import { TripTypeQueries } from './entities/tripType';
import { UserQueries } from './entities/user';
import { UserNotificationQueries } from './entities/userNotification';
import { WorkTripQueries } from './entities/workTrip';

export default `
type Query {
  ${CMDBAddressQueries}
  ${CMDBCategoryQueries}
  ${CMDBItemQueries}
  ${CMDBManualQueries}
  ${CMDBPasswordQueries}
  ${CMDBItemPasswordQueries}
  ${CMDBSchemeQueries}
  ${CommentQueries}
  ${CommentAttachmentQueries}
  ${CompanyQueries}
  ${ErrorMessageQueries}
  ${FilterQueries}
  ${ImapQueries}
  ${InvoiceQueries}
  ${InvoiceCompanyQueries}
  ${LanwikiFolderQueries}
  ${LanwikiPageQueries}
  ${LanwikiTagQueries}
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
  ${ShortSubtaskQueries}
  ${ScheduledWorkQueries}
  ${SmtpQueries}
  ${StatusQueries}
  ${SubtaskQueries}
  ${TagQueries}
  ${TaskQueries}
  ${TaskAttachmentQueries}
  ${TaskChangeQueries}
  ${TasklistColumnPreferenceQueries}
  ${TasklistGanttColumnPreferenceQueries}
  ${TasklistSortQueries}
  ${TaskMetadataQueries}
  ${TaskTypeQueries}
  ${TripTypeQueries}
  ${UserQueries}
  ${UserNotificationQueries}
  ${WorkTripQueries}
}
`
