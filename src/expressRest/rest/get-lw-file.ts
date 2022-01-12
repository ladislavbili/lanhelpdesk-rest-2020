import {
  checkIfHasProjectRights,
} from '@/graph/addons/project';
import checkResolver from '@/graph/resolvers/checkResolver';
import { AccessRightsInstance, RoleInstance, CommentInstance, RepeatTemplateInstance, RepeatTemplateAttachmentInstance } from '@/models/instances';
import { models } from '@/models';
import fs from 'fs';
import pathResolver from 'path';
import {
  testing,
} from '@/configs/constants';

export function getLWFile(app) {
  app.get('/get-lw-file', async function(req, res) {
    const path = req.query.path;
    if (!path) {
      return res.status(412).send({ ok: false, error: 'Parameter path missing' })
    }
    if (!fs.existsSync(path)) {
      return res.status(404).send(null);
    }

    res.sendFile(path, { root: './' });
  });
}
