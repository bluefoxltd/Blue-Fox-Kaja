// Vercel Serverless Function to serve source zip download
export default function handler(req: any, res: any) {
  res.redirect(302, '/bluefox-khaja-khata-source.zip');
}
