import { sign, verify } from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { InvalidTokenError } from './errors';
import { models } from '@/models'
import { UserInstance } from '@/models/instances';
import { refTokenLife, accTokenLife } from '@/configs/constants';
export interface VerifyResult {
  userData: any;
  User: UserInstance;
  ok: boolean;
}

function createPass(pass, user, loginKey) {
  return `${pass} ${user.password.substring(user.password.length - 5)}${user.email}${user.active}${loginKey}`
}

export async function createAccessToken(user, loginKey) {

  let userData = user.get();
  return sign(
    { id: userData.id, loginKey },
    createPass(process.env.JWT_ACC_PASS, userData, loginKey),
    { expiresIn: accTokenLife }
  )
}

export async function createRefreshToken(user, loginKey) {
  let userData = user.get();
  return sign(
    { id: userData.id, loginKey },
    createPass(process.env.JWT_REF_PASS, userData, loginKey),
    { expiresIn: refTokenLife }
  )
}

export async function verifyAccToken(token, UserModel, extraParameters = []) {
  return new Promise(async (resolve, reject) => {
    let userData = jwt_decode(token);
    const User = await UserModel.findByPk(
      userData.id,
      {
        include: [
          ...extraParameters,
          {
            model: models.Token,
            where: { key: userData.loginKey }
          },
          {
            model: models.Role,
            include: [
              { model: models.AccessRights }
            ]
          }
        ]
      }
    );
    if (User === null || User.get('Tokens').length === 0) {
      resolve(<VerifyResult>{ User: null, userData: null, ok: false })
    }
    try {
      userData = await verify(token, createPass(process.env.JWT_ACC_PASS, User.get(), userData.loginKey));
    } catch (error) {
      resolve(<VerifyResult>{ User: null, userData: null, ok: false })
    }
    resolve(<VerifyResult>{ User, userData, ok: true })
  })
}

export async function verifyRefToken(token, UserModel) {
  let userData = jwt_decode(token);

  const User = await UserModel.findByPk(
    userData.id,
    {
      include: [{
        model: models.Token,
        where: { key: userData.loginKey }
      }]
    }
  );
  if (User.get('Tokens').length === 0) {
    throw InvalidTokenError;
  }

  return verify(token, createPass(process.env.JWT_REF_PASS, User.get(), userData.loginKey))
}
