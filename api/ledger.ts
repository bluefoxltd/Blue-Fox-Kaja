// Vercel Serverless Function for Blue Fox Ledger
// Connects Vercel serverless requests directly to the cloud store

const CLOUD_BACKUP_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0cd95e99c7917';

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
      const cloudRes = await fetch(CLOUD_BACKUP_URL, { cache: 'no-store' });
      if (cloudRes.ok) {
        const doc = await cloudRes.json();
        return res.status(200).json({
          transactions: doc.data?.transactions || [],
          couponProfile: doc.data?.couponProfile || {
            couponCode: 'BF-FOX-7821',
            holderName: 'Blue Fox',
            holderPhone: '+977 9802755605',
            shopName: 'Darjeeling momo',
            shopAddress: 'Itahari-6, Sky Plaza',
            shopPhone: '9802755605',
            creditLimit: 25000,
          },
          lastUpdated: doc.data?.lastUpdated || Date.now(),
        });
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
