export function test(app) {
  app.get('/', function(req, res) {
    res.end(JSON.stringify({ message: 'Teeest.' }));
  });
}

export * from './get-attachments';
export * from './refresh_token';
export * from './send-comment';
export * from './send-email';
export * from './upload-attachments';
export * from './upload-project-attachments';
export * from './upload-repeat-template-attachments';
export * from './get-lw-file';
export * from './lw-upload-text-images';
export * from './get-cmdb-file';
export * from './cmdb-upload-scheme';
export * from './cmdb-upload-text-images';
