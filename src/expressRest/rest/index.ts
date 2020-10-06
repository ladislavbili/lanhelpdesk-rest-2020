export function test(app) {
  app.get('/', function(req, res) {
    res.end(JSON.stringify({ message: 'Teeest.' }));
  });
}

export * from './get-attachments';
export * from './refresh_token';
export * from './upload-attachments';
