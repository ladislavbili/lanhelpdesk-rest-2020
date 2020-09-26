import defaultAttributes from './defaultAttributes';
export const Smtp = `
type Smtp {
  ${defaultAttributes}
  title: String!
  order: Int!
  def: Boolean!
  host: String
  port: Int
  username: String!
  password: String!
  rejectUnauthorized: Boolean
  secure: Boolean
  currentlyTested: Boolean!
  errorMessage: String
  working: Boolean!
  wellKnown: WellKnownEnum
}

enum WellKnownEnum {
  S_126
  S_163
  S_1und1
  S_AOL
  S_DebugMail
  S_DynectEmail
  S_FastMail
  S_GandiMail
  S_Gmail
  S_Godaddy
  S_GodaddyAsia
  S_GodaddyEurope
  S_hot__ee
  S_Hotmail
  S_iCloud
  S_mail__ee
  S_Mail__ru
  S_Maildev
  S_Mailgun
  S_Mailjet
  S_Mailosaur
  S_Mandrill
  S_Naver
  S_OpenMailBox
  S_Outlook365
  S_Postmark
  S_QQ
  S_QQex
  S_SendCloud
  S_SendGrid
  S_SendinBlue
  S_SendPulse
  S_SES
  S_SES___US___EAST___1
  S_SES___US___WEST___2
  S_SES___EU___WEST___1
  S_Sparkpost
  S_Yahoo
  S_Yandex
  S_Zoho
  S_qiye__aliyun
}
`

export const SmtpQuerries = `
smtps: [Smtp]
smtp(id: Int!): Smtp
`

export const SmtpMutations = `
addSmtp( title: String!, order: Int!, def: Boolean!, host: String, port: Int, username: String!, password: String!, rejectUnauthorized: Boolean, secure: Boolean, wellKnown: WellKnownEnum ): Smtp
updateSmtp( id: Int!, title: String, order: Int, def: Boolean, host: String, port: Int, username: String, password: String, rejectUnauthorized: Boolean, secure: Boolean, wellKnown: WellKnownEnum ): Smtp
deleteSmtp( id: Int!, newDefId: Int, newId: Int ): Smtp
testSmtp( id: Int! ) : Boolean
testSmtps: Boolean
`
