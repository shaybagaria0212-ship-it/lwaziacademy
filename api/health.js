// GET /api/health — Vercel Serverless Function
module.exports = function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ status: 'ok', name: 'Lwazi Academy API', version: '2.0.0', runtime: 'vercel-serverless' });
};
