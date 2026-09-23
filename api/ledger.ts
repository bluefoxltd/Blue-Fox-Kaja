// Vercel Serverless Function for Blue Fox Ledger
// Connects Vercel serverless requests directly to the cloud store with persistent cache

const CLOUD_TOPIC = 'bluefox_khata_v4_bf_fox_7821';

// Serverless in-memory cache to guarantee accuracy across Vercel invocations
let serverlessLedgerCache: {
  transactions: any[];
  couponProfile: any;
  lastUpdated: number;
} = {
  transactions: [
    {
      id: 'tx_8451',
      transactionNumber: 'BF-TX-8451',
      timestamp: 1774345200000,
      dateAD: '2026-09-23',
      dateBS: '2083-06-06',
      dateBSFormatted: '2083 Ashoj 06',
      type: 'PURCHASE',
      mealCategory: 'SNACK_KHAJA',
      shopName: 'Darjeeling momo',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'item_8451_1', name: 'Ice', qty: 5, unitPrice: 20, totalPrice: 100 },
        { id: 'item_8451_2', name: 'Chiya', qty: 2, unitPrice: 20, totalPrice: 40 },
        { id: 'item_8451_3', name: 'Veg Chowmein', qty: 1, unitPrice: 80, totalPrice: 80 },
      ],
      subtotal: 220,
      discount: 0,
      netAmount: 220,
      paymentStatus: 'CREDIT',
      paymentMethod: 'COUPON_CREDIT',
      isImmutable: true,
      createdAt: '2026-09-23T07:00:00.000Z',
    },
    {
      id: 'tx_3870',
      transactionNumber: 'BF-TX-3870',
      timestamp: 1774258900000,
      dateAD: '2026-09-22',
      dateBS: '2083-06-05',
      dateBSFormatted: '2083 Ashoj 05',
      type: 'PURCHASE',
      mealCategory: 'SNACK_KHAJA',
      shopName: 'Darjeeling momo',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'item_3870_1', name: 'Chiya', qty: 4, unitPrice: 20, totalPrice: 80 },
        { id: 'item_3870_2', name: 'cig', qty: 5, unitPrice: 20, totalPrice: 100 },
        { id: 'item_3870_3', name: 'Egg Chowmein', qty: 2, unitPrice: 100, totalPrice: 200 },
      ],
      subtotal: 380,
      discount: 0,
      netAmount: 380,
      paymentStatus: 'CREDIT',
      paymentMethod: 'COUPON_CREDIT',
      isImmutable: true,
      createdAt: '2026-09-22T07:00:00.000Z',
    },
    {
      id: 'tx_3428',
      transactionNumber: 'BF-TX-3428',
      timestamp: 1774172400000,
      dateAD: '2026-09-21',
      dateBS: '2083-06-04',
      dateBSFormatted: '2083 Ashoj 04',
      type: 'PURCHASE',
      mealCategory: 'SNACK_KHAJA',
      shopName: 'Darjeeling momo',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'item_3428_1', name: 'tea', qty: 2, unitPrice: 20, totalPrice: 40 },
        { id: 'item_3428_2', name: 'chicken Jhol momo', qty: 2, unitPrice: 150, totalPrice: 300 },
      ],
      subtotal: 340,
      discount: 0,
      netAmount: 340,
      paymentStatus: 'CREDIT',
      paymentMethod: 'COUPON_CREDIT',
      isImmutable: true,
      createdAt: '2026-09-21T07:00:00.000Z',
    },
    {
      id: 'tx_8131',
      transactionNumber: 'BF-TX-8131',
      timestamp: 1774172400000,
      dateAD: '2026-09-21',
      dateBS: '2083-06-04',
      dateBSFormatted: '2083 Ashoj 04',
      type: 'PURCHASE',
      mealCategory: 'SNACK_KHAJA',
      shopName: 'Darjeeling momo',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'item_8131_1', name: 'ice', qty: 5, unitPrice: 20, totalPrice: 100 },
      ],
      subtotal: 100,
      discount: 0,
      netAmount: 100,
      paymentStatus: 'CREDIT',
      paymentMethod: 'COUPON_CREDIT',
      isImmutable: true,
      createdAt: '2026-09-21T07:15:00.000Z',
    },
  ],
  couponProfile: {
    couponCode: 'BF-FOX-7821',
    holderName: 'Blue Fox',
    holderPhone: '+977 9802755605',
    shopName: 'Darjeeling momo',
    shopAddress: 'Itahari-6, Sky Plaza',
    shopPhone: '9802755605',
    creditLimit: 25000,
    issueDateBS: '2083-01-01',
    validUntilBS: '2083-12-30',
  },
  lastUpdated: 1774345200000,
};

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
              if (payload && Array.isArray(payload.transactions) && payload.transactions.length > 0) {
                // Update serverless cache
                serverlessLedgerCache = {
                  transactions: payload.transactions,
                  couponProfile: payload.couponProfile || serverlessLedgerCache.couponProfile,
                  lastUpdated: payload.timestamp || payload.lastUpdated || Date.now(),
                };
                return res.status(200).json(serverlessLedgerCache);
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      // fallback to memory cache
    }

    return res.status(200).json(serverlessLedgerCache);
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (Array.isArray(body.transactions)) {
        serverlessLedgerCache = {
          transactions: body.transactions,
          couponProfile: body.couponProfile || serverlessLedgerCache.couponProfile,
          lastUpdated: body.lastUpdated || body.timestamp || Date.now(),
        };

        // Forward to cloud relay with cache headers
        try {
          await fetch(`https://ntfy.sh/${CLOUD_TOPIC}`, {
            method: 'POST',
            headers: {
              'Cache': 'yes',
              'X-Cache': 'yes',
              'Title': 'LEDGER',
            },
            body: JSON.stringify({
              type: body.type || 'SYNC',
              transactions: body.transactions,
              couponProfile: body.couponProfile || serverlessLedgerCache.couponProfile,
              timestamp: serverlessLedgerCache.lastUpdated,
              senderId: body.senderId || 'vercel_backend',
            }),
          });
        } catch (relayErr) {
          console.warn('Failed to forward to ntfy:', relayErr);
        }
      }
      return res.status(200).json({ success: true, count: serverlessLedgerCache.transactions.length });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
