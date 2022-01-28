import moment from 'moment';
import { models } from '@/models';
import {
  idDoesExists,
} from '@/helperFunctions';
import checkResolver from '@/graph/resolvers/checkResolver';

export function cmdbUploadTextImages(app) {
  app.post('/cmdb-upload-text-images', async function(req, res) {
    const timestamp = moment().valueOf();
    const { token, type, id } = req.body;
    let files = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        files = req.files.file;
      } else {
        files = [req.files.file];
      }
    }

    if (!token || !files || files.length === 0 || !['descriptionFile', 'backupFile', 'monitoringFile', 'manual'].includes(type) || isNaN(parseInt(id))) {
      return res.send({ ok: false, error: `Upload failed, either no files were send, id is missing or wrong, token is missing or type isn't one of ['descriptionFile','backupFile','monitoringFile', 'manual']` })
    }
    let attachments = [];
    try {
      const User = await checkResolver({ headers: { authorization: token } }, ['cmdb']);
      if (type === 'manual') {
        await idDoesExists(parseInt(id), models.CMDBManual);
        await Promise.all(files.map((file) => file.mv(`files/cmdb-files/manuals/${parseInt(id)}/${timestamp}-${file.name}`)));
        attachments = await Promise.all(
          files.map((file) => (
            models.CMDBFile.create({
              filename: file.name,
              mimetype: file.mimetype,
              encoding: file.encoding,
              size: file.size,
              path: `files/cmdb-files/manuals/${parseInt(id)}/${timestamp}-${file.name}`,
              CMDBManualId: parseInt(id),
            })
          ))
        );
      } else if (['descriptionFile', 'backupFile', 'monitoringFile'].includes(type)) {
        let idKey = null;
        switch (type) {
          case 'descriptionFile': {
            idKey = 'descriptionFileId';
            break;
          }
          case 'backupFile': {
            idKey = 'backupFileId';
            break;
          }
          case 'monitoringFile': {
            idKey = 'monitoringFileId';
            break;
          }
          default: {
            break;
          }
        }
        await idDoesExists(parseInt(id), models.CMDBItem);
        await Promise.all(files.map((file) => file.mv(`files/cmdb-files/items/${parseInt(id)}/${timestamp}-${file.name}`)));
        attachments = await Promise.all(
          files.map((file) => (
            models.CMDBFile.create({
              filename: file.name,
              mimetype: file.mimetype,
              encoding: file.encoding,
              size: file.size,
              path: `files/cmdb-files/items/${parseInt(id)}/${timestamp}-${file.name}`,
              [idKey]: parseInt(id),
            })
          ))
        );
      } else {
        return res.send({ ok: false, error: 'No file could be uploaded' })
      }
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }

    return res.send({ ok: true, error: null, attachments })
  });
}
