import { sign, verify } from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { InvalidTokenError } from './errors';

function getPasswordExtras(userData, loginKey){
  return `${userData.password.substring( userData.password.length - 5 )}${userData.email}${userData.active}${loginKey}`;
}

export async function createAccessToken( user, loginKey ){

  let userData = (await user.get());
  return sign(
    { id: userData.id, loginKey },
    `${process.env.JWT_ACC_PASS} ${getPasswordExtras(userData, loginKey )}`,
    { expiresIn: '15w' }
  )
}

export async function createRefreshToken( user, loginKey ){
  let userData = (await user.get());
  return sign(
    { id: userData.id, loginKey },
    `${process.env.JWT_REF_PASS} ${getPasswordExtras(userData, loginKey )}`,
    { expiresIn: '7d' }
  )
}

export async function verifyAccToken( token, UserModel ){
  let userData = jwt_decode(token);
  const user = await UserModel.findByPk(userData.id);
  const loginKeys = await user.getTokens();
  if( !loginKeys.some((key) => key.key === userData.loginKey ) ){
    throw InvalidTokenError;
  }
  return verify(token, `${process.env.JWT_ACC_PASS} ${getPasswordExtras(await user.get(), userData.loginKey )}`)
}

export async function verifyRefToken( token, UserModel ){
  let userData = jwt_decode(token);
  const user = await UserModel.findByPk(userData.id);
  const loginKeys = await user.getTokens();
  if( !loginKeys.some((key) => key.key === userData.loginKey ) ){
    throw InvalidTokenError;
  }
  return verify(token, `${process.env.JWT_REF_PASS} ${getPasswordExtras(await user.get(), userData.loginKey )}`)
}
