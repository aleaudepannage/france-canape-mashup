// Serverless function pour Replicate
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

  // Token depuis variable d'environnement OU en dur (fallback)
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  try {
    const { sofaImageUrl, fabricImageUrl, prompt } = req.body;

    console.log('Calling Replicate with:', { sofaImageUrl, fabricImageUrl });

    const response = await fetch(
      'https://api.replicate.com/v1/models/google/nano-banana-pro/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
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
    console.log('Replicate response:', data);

    if (!response.ok) {
      console.error('Replicate error:', data);
      return res.status(response.status).json({ 
        message: data.detail || data.error || 'Erreur Replicate' 
      });
    }

    const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;

    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: error.message });
  }
}
