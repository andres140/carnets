const express = require('express');
const path = require('path');
const carnetRoutes = require('./routes/carnets.routes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/carnets', carnetRoutes);

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'carnets.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor corriendo en puerto ' + PORT));
