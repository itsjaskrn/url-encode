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

  if (!url || typeof url !== 'string' || !accessToken) {
    return res.status(400).json({ error: 'Missing URL or Authorization header' });
  }

  try {
    // Step 1: Fetch list of verified sites
    const listRes = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!listRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch verified sites' });
    }

    const { siteEntry } = await listRes.json();
    const inputUrl = url.trim().toLowerCase().replace(/\/+$/, '');

    // Step 2: Try exact match
    const fullMatch = siteEntry.find(site => site.siteUrl.toLowerCase() === inputUrl);
    if (fullMatch) {
      const encodedUrl = encodeURIComponent(fullMatch.siteUrl);
      return res.status(200).json({ siteUrl: fullMatch.siteUrl, encodedUrl });
    }

    // Step 3: Try domain property fallback
    const domain = inputUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const domainProp = `sc-domain:${domain}`;
    const domainMatch = siteEntry.find(site => site.siteUrl === domainProp);

    if (domainMatch) {
      const encodedUrl = encodeURIComponent(domainProp);
      return res.status(200).json({ siteUrl: domainProp, encodedUrl });
    }

    // Step 4: Not found
    return res.status(404).json({ error: 'No matching GSC property found', inputUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to resolve and encode site URL' });
  }
}
