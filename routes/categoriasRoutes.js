// backend/routes/categoriasRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categoriasRef = db.collection('categorias');
    const snapshot = await categoriasRef.get();
    
    if (snapshot.empty) {
      return res.status(200).json({ categorias: [] });
    }
    
    const categorias = [];
    snapshot.forEach(doc => {
      categorias.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json({ categorias });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
  }
});

// Obtener plantas por categoría
router.get('/:categoriaId/plantas', async (req, res) => {
  try {
    const { categoriaId } = req.params;
    
    // Obtener la información de la categoría
    const categoriaDoc = await db.collection('categorias').doc(categoriaId).get();
    
    if (!categoriaDoc.exists) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    const categoria = {
      id: categoriaDoc.id,
      ...categoriaDoc.data()
    };
    
    // Obtener las plantas de la categoría
    const plantasRef = db.collection('plantas').where('categoriaId', '==', categoriaId);
    const snapshot = await plantasRef.get();
    
    const plantas = [];
    snapshot.forEach(doc => {
      plantas.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json({ categoria, plantas });
  } catch (error) {
    console.error('Error al obtener plantas por categoría:', error);
    res.status(500).json({ message: 'Error al obtener plantas', error: error.message });
  }
});

// Obtener una categoría específica
router.get('/:categoriaId', async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const categoriaDoc = await db.collection('categorias').doc(categoriaId).get();
    
    if (!categoriaDoc.exists) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    const categoria = {
      id: categoriaDoc.id,
      ...categoriaDoc.data()
    };
    
    res.status(200).json({ categoria });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ message: 'Error al obtener categoría', error: error.message });
  }
});

module.exports = router;