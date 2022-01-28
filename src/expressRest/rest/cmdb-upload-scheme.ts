import moment from 'moment';
import { models } from '@/models';
import {
  idDoesExists,
} from '@/helperFunctions';
import fs from 'fs';
import {
  CMDBFileInstance,
} from '@/models/instances';
import checkResolver from '@/graph/resolvers/checkResolver';

export function cmdbUploadScheme(app) {
  app.post('/cmdb-upload-scheme', async function(req, res) {
    const timestamp = moment().valueOf();
    const { token, id } = req.body;
    let file = null;
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        file = req.files.file[0];
      } else {
        file = req.files.file;
      }
    }

    if (!token || !file || isNaN(parseInt(id))) {
      return res.send({ ok: false, error: `Upload failed, either no file was send or id is missing or wrong.` })
    }
    let scheme = null;
    try {
      const User = await checkResolver({ headers: { authorization: token } }, ['cmdb']);
      await idDoesExists(parseInt(id), models.CMDBScheme);
      file.mv(`files/cmdb-files/schemes/${parseInt(id)}/${timestamp}-${file.name}`)
      const OriginalFile = <CMDBFileInstance>await models.CMDBFile.findOne({ where: { CMDBSchemeId: parseInt(id) } });
      if (OriginalFile) {
        try {
          fs.unlinkSync(<string>OriginalFile.get('path'));
        } catch (err) {
        }
        scheme = await OriginalFile.update({
          filename: file.name,
          mimetype: file.mimetype,
          encoding: file.encoding,
          size: file.size,
          path: `files/cmdb-files/schemes/${parseInt(id)}/${timestamp}-${file.name}`,
        });
      } else {
        scheme = await models.CMDBFile.create({
          filename: file.name,
          mimetype: file.mimetype,
          encoding: file.encoding,
          size: file.size,
          path: `files/cmdb-files/schemes/${parseInt(id)}/${timestamp}-${file.name}`,
          CMDBSchemeId: parseInt(id),
        })
      }
    } catch (err) {
      return res.send({ ok: false, error: err.message })
    }

    return res.send({ ok: true, error: null, scheme })
  });
}
