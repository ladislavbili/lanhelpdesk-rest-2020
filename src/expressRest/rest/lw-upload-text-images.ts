import moment from 'moment';
import { models } from '@/models';
import checkResolver from '@/graph/resolvers/checkResolver';
import {
  CantAddOrEditPagesToFolderError,
} from '@/configs/errors';
import {
  isUserAdmin,
} from '@/helperFunctions';
import {
  LanwikiPageInstance,
  LanwikiFolderInstance,
  LanwikiFolderRightInstance,
} from '@/models/instances';

export function lwUploadTextImages(app) {
  app.post('/lw-upload-text-images', async function(req, res) {
    const timestamp = moment().valueOf();
    const { token, lanwikiId } = req.body;
    let files = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        files = req.files.file;
      } else {
        files = [req.files.file];
      }
    }

    if (!token || !files || !lanwikiId || files.length === 0) {
      return res.send({ ok: false, error: 'Upload failed, either no files were send, lanwikiId is missing or token is missing' })
    }
    let User = null;
    let LanwikiPage = null;

    try {
      User = await checkResolver({ headers: { authorization: token } }, ['lanwiki']);
      const isAdmin = isUserAdmin(User);
      LanwikiPage = <LanwikiPageInstance>await models.LanwikiPage.findByPk(lanwikiId, {
        include: [
          {
            model: models.LanwikiFolder,
            include: [{
              model: models.LanwikiFolderRight,
              where: {
                UserId: User.get('id'),
                active: true,
                write: true,
              }
            }]
          },
        ]
      });
      const FolderRights = <LanwikiFolderRightInstance[]>(<LanwikiFolderInstance>LanwikiPage.get('LanwikiFolder')).get('LanwikiFolderRights');
      if (!isAdmin && (FolderRights.length === 0 || !FolderRights[0].get('active') || !FolderRights[0].get('write'))) {
        throw CantAddOrEditPagesToFolderError;
      }
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }
    await Promise.all(files.map((file) => file.mv(`files/lw-files/${lanwikiId}/${timestamp}-${file.name}`)));

    const attachments = await Promise.all(files.map((file) => LanwikiPage.createLanwikiFile(
      {
        filename: file.name,
        mimetype: file.mimetype,
        encoding: file.encoding,
        size: file.size,
        path: `files/lw-files/${lanwikiId}/${timestamp}-${file.name}`,
        LanwikiPageId: lanwikiId,
      }
    )
    ))
    return res.send({ ok: true, error: null, attachments })
  });
}
