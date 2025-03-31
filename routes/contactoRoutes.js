// backend/routes/contactoRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const db = admin.firestore();

// Configuración de Nodemailer para envío de correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'carlossbel09@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'blossomia-secret-key-change-this-in-production'
  }
});

// Enviar formulario de contacto
router.post('/', async (req, res) => {
  try {
    const { nombre, email, mensaje, tipoConsulta } = req.body;
    
    // Validar campos obligatorios
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios'
      });
    }
    
    // Guardar consulta en la base de datos
    const contactoRef = await db.collection('contactos').add({
      nombre,
      email,
      mensaje,
      tipoConsulta: tipoConsulta || 'general',
      userId: req.user?.id || 'invitado', // Permitir envíos de invitados
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'pendiente'
    });
    
    // Configuración del email
    try {
      // Enviar email de notificación
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@blossomia.com',
        to: 'carlossbel09@gmail.com', // Dirección de correo fija
        subject: `Blossomia: Nueva consulta de ${nombre}`,
        html: `
          <h1>Nueva consulta desde Blossomia</h1>
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Tipo de consulta:</strong> ${tipoConsulta || 'general'}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${mensaje}</p>
          <hr>
          <p>Este mensaje fue enviado desde el formulario de contacto de Blossomia.</p>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Correo enviado a carlossbel09@gmail.com`);
    } catch (emailError) {
      console.error('Error al enviar email de contacto:', emailError);
      // No fallamos la petición completa si el email falla
    }
    
    res.status(201).json({
      message: 'Consulta enviada correctamente',
      contactoId: contactoRef.id
    });
    
  } catch (error) {
    console.error('Error al enviar contacto:', error);
    res.status(500).json({ 
      message: 'Error en el servidor al procesar la consulta', 
      error: error.message 
    });
  }
});

module.exports = router;