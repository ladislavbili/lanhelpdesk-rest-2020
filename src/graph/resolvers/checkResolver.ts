import { models, sequelize } from '@/models';
import { InvalidTokenError, NoAccTokenError, MutationOrResolverAccessDeniedError, UserDeactivatedError } from '@/configs/errors';
import { verifyAccToken, VerifyResult } from '@/configs/jwt';
import { UserInstance, RoleInstance, TokenInstance } from '@/models/instances';
import moment from 'moment';
import { addApolloError } from '@/helperFunctions';

export default async function checkResolver(req, access = [], useOR = false, extraParameters = []) {
  const token = req.headers.authorization as String;

  if (!token) {
    throw NoAccTokenError;
  }
  const verifyResult = <VerifyResult>await verifyAccToken(token.replace('Bearer ', ''), models.User, extraParameters);
  if (!verifyResult.ok) {
    sequelize.query("DELETE FROM tokens WHERE expiresAt < NOW()");
    throw InvalidTokenError;
  }
  let userData = verifyResult.userData;
  let User = verifyResult.User;

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
    (<TokenInstance[]>User.get('Tokens')).map((Token) => Token.update({ expiresAt: moment().add(7, 'd').valueOf() }));
    return User;
  }
  addApolloError(
    'Access verification',
    MutationOrResolverAccessDeniedError,
    userData.id,
  );
  throw MutationOrResolverAccessDeniedError;
}
