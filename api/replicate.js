// Serverless function pour Replicate (évite d'exposer la clé API côté client)
// Compatible avec Vercel, Netlify, ou autre

const REPLICATE_API_TOKEN = 'r8_PnAGdgN1WioHGTLTNLaipS8uIdAJYDH4ZV3LS3';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sofaImageUrl, fabricImageUrl, prompt } = req.body;

    // Appel à Replicate Nano-Banana-Pro
    const response = await fetch(
      'https://api.replicate.com/v1/models/google/nano-banana-pro/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait', // Attend le résultat
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            resolution: '2K',
            image_input: [sofaImageUrl, fabricImageUrl],
            aspect_ratio: '4:3',
            output_format: 'png',
            safety_filter_level: 'block_only_high',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Erreur Replicate');
    }

    // Replicate retourne l'image dans output
    const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Replicate error:', error);
    return res.status(500).json({ message: error.message });
  }
}
