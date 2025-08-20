export default function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const encodedUrl = encodeURIComponent(url);
    return res.status(200).json({ encodedUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to encode URL' });
  }
}
