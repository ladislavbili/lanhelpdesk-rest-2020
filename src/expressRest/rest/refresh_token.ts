import { verifyRefToken, createAccessToken, createRefreshToken } from '@/configs/jwt';
import { refTokenLifeTime } from '@/configs/constants';
import moment from 'moment';
import { models } from '@/models';
import jwt_decode from 'jwt-decode';

export function refreshToken(app) {
  app.post('/refresh_token', async (req, res) => {

    //get refresh token
    let refToken = req.cookies.jid;

    if (!refToken) {

      return res.send({ ok: false, accessToken: '', error: 'no refresh token' })
    }
    let userData = null;
    //verify refresh token
    try {
      userData = await verifyRefToken(refToken, models.User);
    } catch (error) {
      //not valid refresh token
      userData = jwt_decode(refToken);
      if (userData.loginKey) {
        await models.Token.destroy({ where: { key: userData.loginKey } })
      }

      return res.send({ ok: false, accessToken: '', error: 'not valid refresh token' })
    }

    const User = await models.User.findByPk(userData.id);
    //send new data
    const Token = await models.Token.findOne({ where: { key: userData.loginKey, UserId: userData.id } })
    let expiresAt = moment().add(7, 'd').valueOf();
    await Token.update({ expiresAt });

    res.cookie(
      'jid',
      await createRefreshToken(User, userData.loginKey),
      { httpOnly: true, maxAge: refTokenLifeTime }
    );
    res.send({ ok: true, accessToken: await createAccessToken(User, userData.loginKey) })
  })
}
