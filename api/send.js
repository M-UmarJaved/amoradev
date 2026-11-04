module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Handle stream if body is not parsed
  let bodyData = req.body;
  if (!bodyData || typeof bodyData === 'string' || Buffer.isBuffer(bodyData)) {
    try {
      if (Buffer.isBuffer(bodyData)) bodyData = bodyData.toString('utf-8');
      if (typeof bodyData === 'string' && bodyData.startsWith('{')) {
        bodyData = JSON.parse(bodyData);
      }
    } catch (e) {
      // ignore parse error
    }
  }

  console.log('Received Enquiry on Staging (sales@zamratech.com):', bodyData || 'Form submitted');

  return res.status(200).json({
    ok: true,
    message: 'Thanks — your message is in. A consultant will reply within one business day.'
  });
};
