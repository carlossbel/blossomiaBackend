require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Inicialización de Firebase Admin
const serviceAccountCredentials = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountCredentials),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

// Inicialización de Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['https://blossomia-frontend.vercel.app/', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'blossomia-secret-key';

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Resto de tu código de rutas y lógica de servidor permanece igual...

// Middleware para verificar JWT (lo mantengo igual)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Importar rutas (si las tienes en archivos separados)
const categoriasRoutes = require('./routes/categoriasRoutes');
const plantasRoutes = require('./routes/plantasRoutes');
const contactoRoutes = require('./routes/contactoRoutes');

// RUTAS DE API
// Rutas de categorías y plantas
app.use('/api/categorias', categoriasRoutes);
app.use('/api/plantas', plantasRoutes);
app.use('/api/contacto', contactoRoutes);

// RUTAS DE AUTENTICACIÓN

// Registro de usuarios
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar si el usuario ya existe
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!userSnapshot.empty) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generar secret para MFA (2FA)
    const secret = speakeasy.generateSecret({
      name: `Blossomia:${email}`
    });
    
    // Generar preguntas de seguridad por defecto
    const securityQuestions = [
      { question: '¿Cuál es el nombre de tu primera mascota?', answer: '' },
      { question: '¿En qué ciudad naciste?', answer: '' },
      { question: '¿Cuál es tu película favorita?', answer: '' }
    ];
    
    // Crear usuario en Firestore
    const userRef = await db.collection('users').add({
      name,
      email,
      password: hashedPassword,
      mfaSecret: secret.base32,
      securityQuestions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      nivelExperiencia: 'Principiante',
      tipoJardin: 'No especificado',
      telefono: ''
    });
    
    // Generar QR code para MFA
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      userId: userRef.id,
      qrCode: qrCodeUrl
    });
    
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por email
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    
    const userDoc = userSnapshot.docs[0];
    const user = {
      id: userDoc.id,
      ...userDoc.data()
    };
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    
    // En este punto la contraseña es correcta, pero el usuario debe verificar MFA
    // Devolver userId para usar en la verificación MFA
    res.status(200).json({ 
      message: 'Primer paso de autenticación completado',
      requiresMfa: true,
      userId: user.id
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Verificar MFA (2FA)
app.post('/api/auth/verify-mfa', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // Obtener el usuario de Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }
    
    const user = {
      id: userDoc.id,
      ...userDoc.data()
    };
    
    // Verificar el token MFA
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Permite una pequeña ventana de tiempo para la verificación
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Código de verificación inválido' });
    }
    
    // Crear JWT token para autenticación
    const jwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    const authToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '1d' });
    
    // No enviar información sensible al cliente
    delete user.password;
    delete user.mfaSecret;
    
    res.status(200).json({
      message: 'Autenticación completada',
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        nivelExperiencia: user.nivelExperiencia,
        tipoJardin: user.tipoJardin,
        telefono: user.telefono || ''
      }
    });
    
  } catch (error) {
    console.error('Error en verificación MFA:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Verificar respuestas de seguridad
app.post('/api/auth/verify-security-questions', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    
    // Obtener el usuario
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const user = userDoc.data();
    
    // Verificar respuestas (comparación simple)
    let allCorrect = true;
    
    for (let i = 0; i < Math.min(answers.length, user.securityQuestions.length); i++) {
      if (answers[i].toLowerCase() !== user.securityQuestions[i].answer.toLowerCase()) {
        allCorrect = false;
        break;
      }
    }
    
    if (!allCorrect) {
      return res.status(400).json({ message: 'Respuestas incorrectas' });
    }
    
    // Generar token para reseteo
    const resetToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
    
    res.status(200).json({
      message: 'Verificación correcta',
      token: resetToken
    });
    
  } catch (error) {
    console.error('Error en verificación de preguntas:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Actualizar información de usuario
app.put('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, telefono, nivelExperiencia, tipoJardin } = req.body;
    
    // Actualizar documento del usuario
    await db.collection('users').doc(userId).update({
      name,
      email,
      telefono,
      nivelExperiencia,
      tipoJardin,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ 
      message: 'Perfil actualizado correctamente',
      user: {
        id: userId,
        name,
        email,
        telefono,
        nivelExperiencia,
        tipoJardin
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Obtener perfil de usuario
app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener documento del usuario
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const userData = userDoc.data();
    
    // No enviar información sensible
    delete userData.password;
    delete userData.mfaSecret;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;
    
    res.status(200).json({
      user: {
        id: userId,
        ...userData
      }
    });
    
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Configuración de WebSocket
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['https://blossomia-frontend.vercel.app/', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Manejar eventos de WebSocket
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  // Evento para unirse a una sala personalizada (por userId)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Usuario ${socket.id} se unió a la sala ${userId}`);
  });
  
  // Evento para notificaciones de cuidado de plantas
  socket.on('recordatorio', (data) => {
    // Emitir el recordatorio a todos los clientes conectados o a un usuario específico
    if (data.userId) {
      io.to(data.userId).emit('nuevoRecordatorio', data);
    } else {
      io.emit('nuevoRecordatorio', data);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

// Restablecer contraseña
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ 
        success: false,
        message: 'Token inválido o expirado' 
      });
    }
    
    // Buscar usuario por ID
    const userDoc = await db.collection('users').doc(decoded.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }
    
    // Verificar que el token almacenado coincide y no ha expirado
    const user = userDoc.data();
    
    if (user.resetPasswordToken !== token || !user.resetPasswordExpires || 
        user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ 
        success: false,
        message: 'Token inválido o expirado' 
      });
    }
    
    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Actualizar contraseña
    await db.collection('users').doc(decoded.id).update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Contraseña actualizada correctamente' 
    });
    
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
});

// Recuperación de contraseña - Solicitud
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Correo electrónico requerido'
      });
    }
    
    // Buscar usuario por email
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({ 
        success: false,
        message: 'No se encontró ninguna cuenta con este correo electrónico' 
      });
    }
    
    const userDoc = userSnapshot.docs[0];
    const user = {
      id: userDoc.id,
      ...userDoc.data()
    };
    
    // Generar código de verificación de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generar token temporal para reseteo de contraseña (válido por 1 hora)
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    
    // Guardar token y código de verificación en la base de datos
    await db.collection('users').doc(user.id).update({
      resetPasswordToken: resetToken,
      resetPasswordCode: verificationCode,
      resetPasswordExpires: Date.now() + 3600000 // 1 hora
    });
    
    // Enviar email con código de verificación
    const mailOptions = {
      from: process.env.EMAIL_USER || 'carlossbel09@gmail.com',
      to: email,
      subject: 'Código de verificación - Blossomia',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #2e7d32; text-align: center;">Recuperación de contraseña</h1>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña en Blossomia. Utiliza el siguiente código de verificación:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; background-color: #f5f5f5; padding: 15px; border-radius: 5px; display: inline-block;">${verificationCode}</div>
          </div>
          <p>Este código es válido por 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.</p>
          <p style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #757575; font-size: 12px;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true,
      message: 'Se ha enviado un código de verificación a tu correo electrónico' 
    });
    
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
});

// Verificar código de recuperación de contraseña
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Correo electrónico y código de verificación son requeridos'
      });
    }
    
    // Buscar usuario por email
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({ 
        success: false,
        message: 'No se encontró ninguna cuenta con este correo electrónico' 
      });
    }
    
    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    
    // Verificar que el código sea correcto y no haya expirado
    if (user.resetPasswordCode !== code || !user.resetPasswordExpires || 
        user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ 
        success: false,
        message: 'Código inválido o expirado' 
      });
    }
    
    // Devolver el token para que pueda ser usado en el restablecimiento de contraseña
    res.status(200).json({ 
      success: true,
      message: 'Código verificado correctamente',
      token: user.resetPasswordToken
    });
    
  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
});


module.exports = app;