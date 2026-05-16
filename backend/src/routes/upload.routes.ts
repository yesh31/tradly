import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = Router();

router.post('/', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof Error) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const url = `/uploads/${req.file.filename}`;
    return res.json({ data: { url } });
  });
});

export default router;
