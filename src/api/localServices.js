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

// Génération d'image avec Replicate via API serverless
export async function generateSofaWithFabric({ sofaImageUrl, fabricImageUrl }) {
  const prompt = `A photorealistic sofa with the exact fabric pattern and texture from the reference image applied seamlessly to its upholstery. The sofa should maintain its original shape and lighting while the fabric covers all cushions and surfaces naturally. High quality, professional furniture photography.`;

  // Appel à notre API serverless (fonctionne sur Vercel)
  const response = await fetch('/api/replicate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sofaImageUrl,
      fabricImageUrl,
      prompt,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur génération Replicate');
  }

  const data = await response.json();
  return { status: 'success', imageUrl: data.imageUrl };
}
