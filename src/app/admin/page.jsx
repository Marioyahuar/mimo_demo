import { redirect } from 'next/navigation';
import { hasValidAdminSession } from '../../lib/admin-auth.js';
import { listReservations } from '../../lib/admin-reservations.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reservas | Mimo Pet Spa' };

export default async function AdminPage() {
  if (!(await hasValidAdminSession())) redirect('/admin/login');
  const reservations = await listReservations();

  return (
    <main className="min-h-screen bg-surface p-space-md md:p-space-xl">
      <h1 className="mb-space-md font-headline-md text-headline-md text-on-surface">Reservas</h1>
      {reservations.length === 0 ? (
        <p className="text-on-surface-variant">Aún no hay reservas.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left text-on-surface">
            <thead className="bg-surface-container text-on-surface-variant">
              <tr>
                {['Fecha', 'Hora', 'Servicio', 'Extras', 'Mascota', 'Contacto'].map((h) => (
                  <th key={h} className="px-space-sm py-space-xs font-label-lg text-label-lg">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-outline-variant align-top">
                  <td className="px-space-sm py-space-xs whitespace-nowrap">{r.date}</td>
                  <td className="px-space-sm py-space-xs whitespace-nowrap">{r.time}</td>
                  <td className="px-space-sm py-space-xs">
                    {r.serviceTitle}
                    <div className="text-on-surface-variant">{r.servicePriceLabel}</div>
                  </td>
                  <td className="px-space-sm py-space-xs">{r.extras.length ? r.extras.join(', ') : '—'}</td>
                  <td className="px-space-sm py-space-xs">
                    {r.petName} ({r.petBreed}, {r.petSize})
                    {r.petNotes && <div className="text-on-surface-variant">{r.petNotes}</div>}
                  </td>
                  <td className="px-space-sm py-space-xs">
                    {r.contactName}
                    <div className="text-on-surface-variant">{r.contactPhone}</div>
                    <div className="text-on-surface-variant">{r.contactEmail}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
