// Verificacion manual del modelo (tareas 4.2, 5.x). Uso: node scripts/verify-db.mjs
// Usa DATABASE_URL de .env (rama de desarrollo). Limpia las filas que crea.
try { process.loadEnvFile(".env"); } catch {}
const { prisma } = await import("../src/lib/db.js");

const base = {
  serviceTitle: "Baño completo", servicePriceLabel: "Desde $42", extras: ["Corte de uñas", "Perfume"],
  petName: "Luna", petBreed: "Poodle", petSize: "Pequeño",
  date: new Date("2030-01-15T00:00:00Z"), time: "10:00",
  contactName: "Ana", contactPhone: "+51999999999", contactEmail: "ana@example.com",
};
const k1 = crypto.randomUUID();
let ok = true;
const check = (name, cond) => { console.log(cond ? "OK  " : "FAIL", name); ok &&= cond; };

try {
  const a = await prisma.reservation.create({ data: { ...base, idempotencyKey: k1 } });
  const r = await prisma.reservation.findUnique({ where: { id: a.id } });
  check("roundtrip campos", r.petName === "Luna" && r.time === "10:00" && r.idempotencyKey === k1 &&
    JSON.stringify(r.extras) === JSON.stringify(base.extras) && r.date.toISOString().startsWith("2030-01-15"));
  check("pet_notes null por omision", r.petNotes === null && r.createdAt instanceof Date);

  const code = async (data) => { try { await prisma.reservation.create({ data }); return null; } catch (e) { return e.code; } };
  check("UNIQUE(date,time) -> P2002", (await code({ ...base, idempotencyKey: crypto.randomUUID() })) === "P2002");
  check("UNIQUE(idempotency_key) -> P2002",
    (await code({ ...base, time: "11:00", idempotencyKey: k1 })) === "P2002");
  const { contactPhone, ...sinTel } = base;
  check("campo obligatorio omitido rechazado", (await code({ ...sinTel, time: "12:00", idempotencyKey: crypto.randomUUID() })) !== null);
} finally {
  await prisma.reservation.deleteMany({ where: { date: base.date } });
  check("tabla limpia", (await prisma.reservation.count()) === 0);
  await prisma.$disconnect();
}
process.exit(ok ? 0 : 1);
