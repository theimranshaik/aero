export default async function handler(req: any, res: any) {
  const username = process.env.OPENSKY_USERNAME;
  const password = process.env.OPENSKY_PASSWORD;

  if (!username || !password) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'MISSING_SERVER_ENV_VARS' }));
    return;
  }

  const query = req.url?.includes('?') ? req.url.split('?')[1] : '';
  const targetUrl = `https://opensky-network.org/api/states/all${query ? `?${query}` : ''}`;
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    const body = await response.text();
    res.statusCode = response.status;
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json');
    res.end(body);
  } catch (error: any) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'PROXY_REQUEST_FAILED', message: error?.message }));
  }
}
