// Vercel Serverless Function for Blue Fox Ledger
// Connects Vercel serverless requests directly to the cloud store

const CLOUD_TOPIC = 'bluefox_khata_v4_bf_fox_7821';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const cloudRes = await fetch(`https://ntfy.sh/${CLOUD_TOPIC}/json?poll=1`, { cache: 'no-store' });
      if (cloudRes.ok) {
        const text = await cloudRes.text();
        const lines = text.split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const item = JSON.parse(lines[i]);
            if (item.event === 'message' && item.message) {
              const payload = JSON.parse(item.message);
              if (payload && Array.isArray(payload.transactions)) {
                return res.status(200).json({
                  transactions: payload.transactions,
                  couponProfile: payload.couponProfile || {
                    couponCode: 'BF-FOX-7821',
                    holderName: 'Blue Fox',
                    holderPhone: '+977 9802755605',
                    shopName: 'Darjeeling momo',
                    shopAddress: 'Itahari-6, Sky Plaza',
                    shopPhone: '9802755605',
                    creditLimit: 25000,
                  },
                  lastUpdated: payload.timestamp || Date.now(),
                });
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      // fallback
    }

    return res.status(200).json({
      transactions: [],
      couponProfile: {
        couponCode: 'BF-FOX-7821',
        holderName: 'Blue Fox',
        holderPhone: '+977 9802755605',
        shopName: 'Darjeeling momo',
        shopAddress: 'Itahari-6, Sky Plaza',
        shopPhone: '9802755605',
        creditLimit: 25000,
      },
      lastUpdated: Date.now(),
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    return res.status(200).json({ success: true, received: body });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
