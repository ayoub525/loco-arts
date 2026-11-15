export function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux (max 5 Mo)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Trop de fichiers (max 10)' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Cette entrée existe déjà' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Ressource non trouvée' });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Erreur interne du serveur',
  });
}
