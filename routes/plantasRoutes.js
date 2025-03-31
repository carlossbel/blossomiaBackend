// backend/routes/plantasRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Obtener todas las plantas
router.get('/', async (req, res) => {
  try {
    const plantasRef = db.collection('plantas');
    const snapshot = await plantasRef.get();
    
    if (snapshot.empty) {
      return res.status(200).json({ plantas: [] });
    }
    
    const plantas = [];
    snapshot.forEach(doc => {
      plantas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json({ plantas });
  } catch (error) {
    console.error('Error al obtener plantas:', error);
    res.status(500).json({ message: 'Error al obtener plantas', error: error.message });
  }
});

// Obtener una planta específica
router.get('/:plantaId', async (req, res) => {
  try {
    const { plantaId } = req.params;
    const plantaDoc = await db.collection('plantas').doc(plantaId).get();
    
    if (!plantaDoc.exists) {
      return res.status(404).json({ message: 'Planta no encontrada' });
    }
    
    const planta = {
      id: plantaDoc.id,
      ...plantaDoc.data()
    };
    
    res.status(200).json({ planta });
  } catch (error) {
    console.error('Error al obtener planta:', error);
    res.status(500).json({ message: 'Error al obtener planta', error: error.message });
  }
});

module.exports = router;