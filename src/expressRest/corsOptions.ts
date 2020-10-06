var whitelist = [
  'https://lanhelpdesk2019.lansystems.sk',
  'http://lanhelpdesk2019.lansystems.sk',
  'http://localhost:3000',
  'http://test2020.lanhelpdesk.com'
]

export default {
  origin: function(origin, callback) {
    callback(null, true)
    return;
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback('Not allowed by CORS', false)
    }
  },
  credentials: true
}
