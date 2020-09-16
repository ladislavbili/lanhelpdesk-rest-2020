import { models } from 'models';
import { InvalidTokenError, NoAccTokenError, MutationOrResolverAccessDeniedError, UserDeactivatedError } from 'configs/errors';
import { verifyAccToken } from 'configs/jwt';
import { UserInstance, RoleInstance } from 'models/instances';
import { sequelize } from 'models';
import { addApolloError } from 'helperFunctions';

export default async function checkResolver(req, access = [], useOR = false) {
  const token = req.headers.authorization as String;

  if (!token) {
    throw NoAccTokenError;
  }
  let userData = null;
  try {
    userData = await verifyAccToken(token.replace('Bearer ', ''), models.User);
  } catch (error) {
    sequelize.query("DELETE FROM tokens WHERE expiresAt < NOW()");
    throw InvalidTokenError;
  }
  const User = <UserInstance>await models.User.findByPk(userData.id, { include: [{ model: models.Role, include: [{ model: models.AccessRights }] }] });

  if (User.get('active') === false) {
    addApolloError(
      'Access verification',
      UserDeactivatedError,
      userData.id,
    );
    throw UserDeactivatedError;
  }

  const rules = (<RoleInstance>User.get('Role')).get('AccessRight');
  const oneRuleResult = useOR && access.some((rule) => rules[rule] && typeof rules[rule] === "boolean");
  const allRulesResult = !useOR && [...access, 'login'].every((rule) => rules[rule] && typeof rules[rule] === "boolean")

  if (oneRuleResult || allRulesResult) {
    const Token = await models.Token.findOne({ where: { key: userData.loginKey, UserId: userData.id } })
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Token.update({ expiresAt });
    return User;
  }
  addApolloError(
    'Access verification',
    MutationOrResolverAccessDeniedError,
    userData.id,
  );
  throw MutationOrResolverAccessDeniedError;
}
