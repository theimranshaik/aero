export default async function handler(req: any, res: any) {
  const username = process.env.OPENSKY_USERNAME;
  const password = process.env.OPENSKY_PASSWORD;

  if (!username || !password) {
    console.error('Missing OpenSky environment variables:', {
      OPENSKY_USERNAME: !!username,
      OPENSKY_PASSWORD: !!password,
    });

    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'MISSING_SERVER_ENV_VARS' }));
    return;
  }

  const requestUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const targetUrl = `https://opensky-network.org/api/states/all${requestUrl.search}`;
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    const body = await response.text();

    if (!response.ok) {
      console.error('OpenSky fetch failed', {
        status: response.status,
        url: targetUrl,
        body,
      });
    }

    res.statusCode = response.status;
    res.setHeader('content-type', response.headers.get('content-type') || 'application/json; charset=utf-8');
    res.end(body);
  } catch (error: any) {
    console.error('Proxy request failed', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'PROXY_REQUEST_FAILED', message: error?.message }));
  }
}
