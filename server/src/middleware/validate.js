export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return res.status(400).json({ error: 'Données invalides', details: errors });
      }
      req.body = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: 'Paramètres invalides' });
      }
      req.query = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
