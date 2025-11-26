// Services locaux pour remplacer Base44
// Cloudinary pour l'upload, API serverless pour Replicate

const CLOUDINARY_CLOUD_NAME = 'dktuiscor';
const CLOUDINARY_UPLOAD_PRESET = 'ml_defaulte';

// Upload d'image vers Cloudinary (unsigned upload)
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erreur upload Cloudinary');
  }

  const data = await response.json();
  return { file_url: data.secure_url };
}

// Helper pour attendre
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Génération d'image avec Replicate via API serverless (avec polling)
export async function generateSofaWithFabric({ sofaImageUrl, fabricImageUrl, userDetails, onProgress }) {
  let prompt = `A photorealistic sofa with the exact fabric pattern and texture from the reference image applied seamlessly to its upholstery. The sofa should maintain its original shape and lighting while the fabric covers all cushions and surfaces naturally. High quality, professional furniture photography.`;
  
  // Ajouter les détails utilisateur au prompt si fournis
  if (userDetails && userDetails.trim()) {
    prompt += ` Additional details: ${userDetails.trim()}.`;
  }

  // 1. Lancer la génération
  const startResponse = await fetch('/api/replicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sofaImageUrl, fabricImageUrl, prompt }),
  });

  if (!startResponse.ok) {
    const error = await startResponse.json();
    throw new Error(error.message || 'Erreur lancement génération');
  }

  const startData = await startResponse.json();
  const predictionId = startData.predictionId;

  if (!predictionId) {
    throw new Error('Pas de predictionId reçu');
  }

  // 2. Polling jusqu'à ce que ce soit fini (max 3 minutes)
  const maxAttempts = 36; // 36 x 5 secondes = 3 minutes
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000); // Attendre 5 secondes entre chaque check

    if (onProgress) {
      onProgress(`🎨 Génération en cours... (${(i + 1) * 5}s)`);
    }

    const pollResponse = await fetch('/api/replicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predictionId }),
    });

    if (!pollResponse.ok) {
      const error = await pollResponse.json();
      throw new Error(error.message || 'Erreur polling');
    }

    const pollData = await pollResponse.json();

    if (pollData.status === 'succeeded') {
      return { status: 'success', imageUrl: pollData.imageUrl };
    } else if (pollData.status === 'failed') {
      throw new Error(pollData.message || 'La génération a échoué');
    }
    // Sinon continue le polling (starting, processing)
  }

  throw new Error('Timeout: la génération a pris trop de temps');
}
