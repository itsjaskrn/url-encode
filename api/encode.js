/*
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
*/

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { url } = req.query;
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }

  const inputUrl = url.trim().toLowerCase(); // ✅ Keep trailing slash
  const encodedUrl = encodeURIComponent(inputUrl);

  const responsePayload = {
    encodedUrl,
    siteUrl: inputUrl, // default to full URL
  };

  // Try to resolve correct GSC property if token is available
  if (accessToken) {
    try {
      const gscRes = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (gscRes.ok) {
        const { siteEntry } = await gscRes.json();

        // Try exact match with URL-prefix property
        const fullMatch = siteEntry.find(site => site.siteUrl.toLowerCase() === inputUrl);
        if (fullMatch) {
          responsePayload.siteUrl = fullMatch.siteUrl;
          responsePayload.encodedUrl = encodeURIComponent(fullMatch.siteUrl);
        } else {
          // Try fallback to sc-domain
          const domain = inputUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          const domainProp = `sc-domain:${domain}`;
          const domainMatch = siteEntry.find(site => site.siteUrl === domainProp);
          if (domainMatch) {
            responsePayload.siteUrl = domainProp;
            responsePayload.encodedUrl = encodeURIComponent(domainProp);
          }
        }
      } else {
        responsePayload.warning = 'Failed to fetch GSC site list';
      }
    } catch (err) {
      responsePayload.warning = 'Error during GSC ownership check';
    }
  } else {
    responsePayload.warning = 'Access token missing; used raw URL only';
  }

  return res.status(200).json(responsePayload);
}


