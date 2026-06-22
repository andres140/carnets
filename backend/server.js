const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/database');

async function start() {
  try {
    await testConnection();
    console.log('✅ MySQL conectado');
  } catch (err) {
    console.error('❌ No se pudo conectar a MySQL:', err.message);
    console.error('   Verifique DB_* en .env (DB_PORT=3306, NO usar 3306 como PORT HTTP)');
    console.error('   Ejecute: mysql -u root -p < database/schema.sql && mysql -u root -p < database/seed.sql');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log('✅ Servidor iniciado');
    console.log(`🌐 ${env.appUrl}`);
    console.log(`   Entorno: ${env.nodeEnv} | Puerto HTTP: ${env.port} | MySQL: ${env.db.host}:${env.db.port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${env.port} en uso. Cambie PORT en .env o detenga el proceso conflictivo.`);
    } else {
      console.error('❌ Error al iniciar servidor:', err.message);
    }
    process.exit(1);
  });
}

start();
