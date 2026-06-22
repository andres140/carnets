import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

function getAdapterConfig() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 5,
  };
}

const adapter = new PrismaMariaDb(getAdapterConfig());
const prisma = new PrismaClient({ adapter });

const PERMISOS = [
  { codigo: "usuarios.crear", nombre: "Crear usuarios" },
  { codigo: "usuarios.editar", nombre: "Editar usuarios" },
  { codigo: "usuarios.desactivar", nombre: "Desactivar usuarios" },
  { codigo: "usuarios.ver", nombre: "Ver usuarios" },
  { codigo: "carnets.generar", nombre: "Generar carnés" },
  { codigo: "carnets.generar_masivo", nombre: "Generación masiva de carnés" },
  { codigo: "carnets.ver", nombre: "Ver carnés" },
  { codigo: "carnets.revocar", nombre: "Revocar carnés" },
  { codigo: "carnets.suspender", nombre: "Suspender carnés" },
  { codigo: "validar.qr", nombre: "Validar QR" },
  { codigo: "reportes.ver", nombre: "Ver reportes" },
  { codigo: "auditoria.ver", nombre: "Ver auditoría" },
  { codigo: "roles.gestionar", nombre: "Gestionar roles" },
  { codigo: "config.gestionar", nombre: "Gestionar configuración" },
];

const ROLES_PERMISOS: Record<string, string[]> = {
  ADMINISTRADOR: PERMISOS.map((p) => p.codigo),
  COORDINADOR: [
    "usuarios.crear",
    "usuarios.editar",
    "usuarios.desactivar",
    "usuarios.ver",
    "carnets.generar",
    "carnets.generar_masivo",
    "carnets.ver",
    "carnets.revocar",
    "carnets.suspender",
    "validar.qr",
    "reportes.ver",
    "auditoria.ver",
  ],
  FUNCIONARIO: ["carnets.generar", "carnets.ver", "validar.qr", "usuarios.ver"],
  INSTRUCTOR: ["carnets.ver", "validar.qr", "usuarios.ver"],
  APRENDIZ: ["carnets.ver"],
  CONTRATISTA: ["carnets.ver"],
};

async function main() {
  console.log("🌱 Iniciando seed...");

  for (const permiso of PERMISOS) {
    await prisma.permiso.upsert({
      where: { codigo: permiso.codigo },
      update: { nombre: permiso.nombre },
      create: permiso,
    });
  }

  for (const [rolNombre, permisoCodigos] of Object.entries(ROLES_PERMISOS)) {
    const rol = await prisma.rol.upsert({
      where: { nombre: rolNombre },
      update: {},
      create: {
        nombre: rolNombre,
        descripcion: `Rol ${rolNombre} del sistema SENA Carnés`,
      },
    });

    await prisma.rolPermiso.deleteMany({ where: { rolId: rol.id } });

    for (const codigo of permisoCodigos) {
      const permiso = await prisma.permiso.findUnique({ where: { codigo } });
      if (permiso) {
        await prisma.rolPermiso.create({
          data: { rolId: rol.id, permisoId: permiso.id },
        });
      }
    }
  }

  const regional = await prisma.regional.upsert({
    where: { codigo: "REG01" },
    update: {},
    create: {
      codigo: "REG01",
      nombre: "Regional Antioquia",
      activo: true,
    },
  });

  const centro = await prisma.centroFormacion.upsert({
    where: { codigo: "CTR001" },
    update: {},
    create: {
      codigo: "CTR001",
      nombre: "Centro de Servicios y Gestión Empresarial",
      regionalId: regional.id,
      activo: true,
    },
  });

  await prisma.dependencia.upsert({
    where: { id: "seed-dependencia-admin" },
    update: {},
    create: {
      id: "seed-dependencia-admin",
      nombre: "Dirección Regional",
      centroId: centro.id,
      activo: true,
    },
  });

  const rolAdmin = await prisma.rol.findUnique({
    where: { nombre: "ADMINISTRADOR" },
  });

  if (rolAdmin) {
    const passwordHash = await bcrypt.hash("Admin123!", 12);
    await prisma.usuario.upsert({
      where: { email: "admin@sena.edu.co" },
      update: {},
      create: {
        email: "admin@sena.edu.co",
        passwordHash,
        rolId: rolAdmin.id,
        tipoUsuario: "ADMINISTRADOR",
        estado: "ACTIVO",
        documento: "1000000001",
        tipoDocumento: "CC",
        nombreCompleto: "Administrador Sistema",
        regionalId: regional.id,
        centroId: centro.id,
      },
    });
  }

  console.log("✅ Seed completado.");
  console.log("   Usuario admin: admin@sena.edu.co / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
