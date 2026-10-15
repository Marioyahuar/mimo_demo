'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';
import Pill from '../ui/Pill.jsx';
import Container from '../ui/Container.jsx';
import { brand, booking } from '../../data/content.js';
import { todayInBusinessTz, formatDateLabel } from '../../lib/time.js';

const inputClass =
  'rounded border border-outline-variant bg-surface-container-low px-space-md py-space-sm font-body-md text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary';

function Field({ label, children }) {
  return (
    <label className="grid gap-space-2xs">
      <span className="font-label-md text-label-md font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}

function BookingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/85 shadow-[0_4px_20px_-2px_rgba(59,53,48,0.05)] backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed">
            <Icon name="pets" size={18} className="text-primary" />
          </div>
          <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
            {brand.name}
          </span>
        </div>

        <div className="flex items-center gap-space-sm">
          <Link
            href="/"
            className="px-space-xs py-space-2xs font-title-md text-title-md text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Volver al inicio
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-[0_2px_6px_-1px_rgba(59,53,48,0.08)]">
            <Icon name="person" size={18} className="text-on-primary" />
          </div>
        </div>
      </Container>
    </header>
  );
}

// Número de WhatsApp del spa (solo dígitos, con código de país). Sin valor => no se muestra el botón.
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

// ADR-0011: la clave se genera una vez por intento y solo se regenera en resetFlow() (vía emptyState()).
const emptyState = () => ({
  idempotencyKey: crypto.randomUUID(),
  step: 0,
  confirmed: false,
  serviceTitle: booking.services[1].title,
  pet: { name: '', breed: '', size: 'Mediano', notes: '' },
  extras: [],
  date: '',
  time: '',
  contact: { name: '', phone: '', email: '' },
  reservation: null, // reserva almacenada devuelta por la API (201 o 200)
});

function whatsappLink(r) {
  const lines = [
    'Hola Mimo Pet Spa, confirmo mi reserva:',
    `Servicio: ${r.serviceTitle}${r.extras.length ? ` (+ ${r.extras.join(', ')})` : ''}`,
    `Mascota: ${r.petName} (${r.petBreed}, ${r.petSize})`,
    `Fecha: ${formatDateLabel(r.date)}`,
    `Hora: ${r.time}`,
    `Contacto: ${r.contactName} - ${r.contactPhone}`,
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

// Traduce la respuesta de error de la API a un mensaje visible y el paso al que volver (o null).
function describeError(code, fields) {
  const { errors, fieldLabels } = booking;
  if (code === 'VALIDATION_ERROR') {
    const names = (fields ?? []).map((f) => fieldLabels[f] ?? f).join(', ');
    return { message: `${errors.VALIDATION_ERROR} ${names}.`, step: null };
  }
  if (code === 'SLOT_TAKEN' || code === 'DATE_IN_PAST') return { message: errors[code], step: 3 };
  return { message: errors[code] ?? errors.INTERNAL_ERROR, step: null };
}

export default function ReservarCita() {
  const [state, setState] = useState(emptyState);
  // Fecha de hoy en Lima (YYYY-MM-DD); se calcula en cliente tras montar para no desajustar la hidratación.
  const [today, setToday] = useState('');
  const { step, pet, extras, date, time, contact } = state;
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false); // bloquea el doble toque antes del re-render
  const [error, setError] = useState('');
  const [occupied, setOccupied] = useState([]);
  const [availabilityTick, setAvailabilityTick] = useState(0);

  useEffect(() => {
    setToday(todayInBusinessTz());
  }, []);

  // Horarios ocupados de la fecha elegida. Si falla se ignora: el servidor sigue siendo la autoridad (409).
  useEffect(() => {
    setOccupied([]);
    if (!date) return undefined;
    const controller = new AbortController();
    fetch(`/api/reservations/availability?date=${encodeURIComponent(date)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.occupied)) return;
        setOccupied(data.occupied);
        setState((s) => (data.occupied.includes(s.time) ? { ...s, time: '' } : s));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [date, availabilityTick]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step, state.confirmed]);

  const service = booking.services.find((s) => s.title === state.serviceTitle) ?? booking.services[1];

  const canProceed =
    (step === 1 && (!pet.name || !pet.breed)) ||
    (step === 3 && (!date || !time)) ||
    (step === 4 && (!contact.name || !contact.phone || !contact.email))
      ? false
      : true;

  const patchPet = (patch) => setState((s) => ({ ...s, pet: { ...s.pet, ...patch } }));
  const patchContact = (patch) => setState((s) => ({ ...s, contact: { ...s.contact, ...patch } }));
  const goNext = () => {
    setError('');
    setState((s) => ({ ...s, step: Math.min(4, s.step + 1) }));
  };
  const goBack = () => {
    setError('');
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1) }));
  };

  const confirmBooking = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceTitle: service.title,
          servicePriceLabel: service.price,
          extras,
          petName: pet.name,
          petBreed: pet.breed,
          petSize: pet.size,
          petNotes: pet.notes,
          date,
          time,
          contactName: contact.name,
          contactPhone: contact.phone,
          contactEmail: contact.email,
          idempotencyKey: state.idempotencyKey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201 || res.status === 200) {
        setState((s) => ({ ...s, confirmed: true, reservation: data }));
        return;
      }
      const { message, step: backTo } = describeError(data?.error, data?.fields);
      setError(message);
      if (data?.error === 'SLOT_TAKEN') {
        setAvailabilityTick((n) => n + 1);
        setState((s) => ({ ...s, step: 3, time: '' }));
      } else if (backTo !== null) {
        setState((s) => ({ ...s, step: backTo, time: '' }));
      }
    } catch {
      // Falla de red: la idempotencyKey se conserva, el reintento es seguro (ADR-0011).
      setError(booking.errors.NETWORK);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setError('');
    setState(emptyState());
  };
  const toggleExtra = (title) =>
    setState((s) => ({
      ...s,
      extras: s.extras.includes(title) ? s.extras.filter((x) => x !== title) : [...s.extras, title],
    }));

  const dateFmt = formatDateLabel(date);
  const summary = {
    service: service.title,
    price: service.price,
    hasExtras: extras.length > 0,
    extras: extras.length > 0 ? `+ ${extras.join(', ')}` : '',
    pet: pet.name ? `${pet.name} (${pet.breed || 'sin raza'}, ${pet.size})` : '',
    datetime: dateFmt ? `el ${dateFmt} a las ${time}` : '',
  };

  const [stepTitle, stepSubtitle] = booking.steps[step];

  if (state.confirmed) {
    const { confirmation } = booking;
    const r = state.reservation;
    const confirmedSummary = `${r.serviceTitle} para ${r.petName} (${r.petBreed || 'sin raza'}, ${r.petSize}). Te esperamos el ${formatDateLabel(r.date)} a las ${r.time}`;
    return (
      <div className="min-h-screen bg-background font-body-md text-on-surface antialiased">
        <BookingHeader />
        <main className="mx-auto max-w-[560px] px-5 pb-[120px] pt-24 text-center">
          <div className="mx-auto mb-space-lg flex h-[72px] w-[72px] items-center justify-center rounded-full bg-secondary-fixed">
            <Icon name="pets" size={36} filled className="text-secondary" />
          </div>
          <h1 className="mb-space-sm font-headline-lg text-headline-lg-mobile font-semibold text-on-surface sm:text-headline-lg">
            {confirmation.title}
          </h1>
          <p className="mx-auto mb-space-xl max-w-[420px] font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
            {confirmedSummary} {confirmation.tail}
          </p>
          <div className="inline-flex flex-col items-center gap-space-xs">
            {WHATSAPP_NUMBER && (
              <Button href={whatsappLink(r)} variant="soft" icon="chat">
                {confirmation.whatsapp}
              </Button>
            )}
            <Button onClick={resetFlow}>{confirmation.again}</Button>
            <p className="mt-space-md font-body-sm text-body-sm text-outline">{confirmation.reassurance}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface antialiased">
      <BookingHeader />
      <main className="mx-auto max-w-[640px] px-5 pb-24 pt-14">
        <div className="mb-space-xl text-center">
          <Pill className="bg-secondary-fixed text-on-secondary-container">{booking.pill}</Pill>
          <h1 className="mb-space-2xs mt-space-md font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface sm:text-headline-lg">
            {stepTitle}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{stepSubtitle}</p>
        </div>

        <div className="mb-10 flex items-center justify-center gap-space-xs">
          {booking.steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-10 rounded-full transition-colors duration-200 ${
                i <= step ? 'bg-primary' : 'bg-outline-variant'
              }`}
            />
          ))}
        </div>

        <div className="rounded-[28px] bg-surface-container-lowest p-space-xl shadow-[0_16px_40px_-6px_rgba(59,53,48,0.1)]">
          {step === 0 && (
            <div className="grid gap-space-sm">
              {booking.services.map((svc) => {
                const on = svc.title === service.title;
                return (
                  <button
                    key={svc.title}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, serviceTitle: svc.title }))}
                    className={`flex w-full items-center gap-space-md rounded border px-space-md py-space-md text-left transition-colors ${
                      on
                        ? 'border-primary-container bg-primary-fixed'
                        : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${svc.iconBg} ${svc.iconColor}`}
                    >
                      <Icon name={svc.icon} size={22} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-title-md text-title-md font-semibold text-on-surface">
                        {svc.title}
                      </span>
                      <span className="mt-0.5 block font-body-sm text-body-sm text-on-surface-variant">
                        {svc.duration}
                      </span>
                    </span>
                    <span className="font-label-lg text-label-lg font-bold text-primary">{svc.price}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-space-lg">
              <Field label="Nombre de tu mascota">
                <input
                  type="text"
                  value={pet.name}
                  onChange={(e) => patchPet({ name: e.target.value })}
                  placeholder="Ej. Frida"
                  className={inputClass}
                />
              </Field>
              <Field label="Raza">
                <input
                  type="text"
                  value={pet.breed}
                  onChange={(e) => patchPet({ breed: e.target.value })}
                  placeholder="Ej. Caniche"
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-space-2xs">
                <span className="font-label-md text-label-md font-semibold text-on-surface">Tamaño</span>
                <div className="flex gap-space-xs">
                  {booking.sizes.map((sz) => {
                    const on = sz === pet.size;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => patchPet({ size: sz })}
                        className={`flex-1 rounded-full border px-space-sm py-space-xs font-title-md text-label-lg font-semibold transition-colors ${
                          on
                            ? 'border-primary bg-primary-fixed text-primary'
                            : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Notas especiales (opcional)">
                <textarea
                  value={pet.notes}
                  onChange={(e) => patchPet({ notes: e.target.value })}
                  placeholder="Alergias, comportamiento, cosas que debamos saber…"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-space-sm">
              {booking.addOns.map((ad) => {
                const on = extras.includes(ad.title);
                return (
                  <button
                    key={ad.title}
                    type="button"
                    onClick={() => toggleExtra(ad.title)}
                    className={`flex w-full items-center gap-space-md rounded border px-space-md py-space-sm text-left transition-colors ${
                      on
                        ? 'border-secondary bg-secondary-fixed'
                        : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <Icon
                      name={on ? 'check_circle' : ad.icon}
                      size={22}
                      filled={on}
                      className="shrink-0 text-secondary"
                    />
                    <span className="flex-1">
                      <span className="block font-title-md text-title-md font-semibold text-on-surface">
                        {ad.title}
                      </span>
                      <span className="mt-0.5 block font-body-sm text-body-sm text-on-surface-variant">
                        {ad.subtitle}
                      </span>
                    </span>
                    <span className="font-label-lg text-label-lg font-bold text-primary">{ad.price}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-space-lg">
              <Field label="Fecha">
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => {
                    setError('');
                    setState((s) => ({ ...s, date: e.target.value, time: '' }));
                  }}
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-space-2xs">
                <span className="font-label-md text-label-md font-semibold text-on-surface">Hora</span>
                <div className="grid grid-cols-3 gap-space-xs">
                  {booking.slots.map((tm) => {
                    const on = tm === time;
                    const taken = occupied.includes(tm);
                    return (
                      <button
                        key={tm}
                        type="button"
                        disabled={taken}
                        onClick={() => {
                          setError('');
                          setState((s) => ({ ...s, time: tm }));
                        }}
                        className={`rounded-full border px-space-xs py-space-xs font-title-md text-label-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                          on
                            ? 'border-primary bg-primary-fixed text-primary'
                            : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {tm}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-space-lg">
              <Field label="Tu nombre">
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => patchContact({ name: e.target.value })}
                  placeholder="Ej. Camila Peralta"
                  className={inputClass}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => patchContact({ phone: e.target.value })}
                  placeholder="Ej. 555 123 4567"
                  className={inputClass}
                />
              </Field>
              <Field label="Correo electrónico">
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => patchContact({ email: e.target.value })}
                  placeholder="tu@correo.com"
                  className={inputClass}
                />
              </Field>

              <div className="mt-space-2xs border-t border-outline-variant/30 pt-space-lg">
                <div className="mb-space-sm font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                  Resumen
                </div>
                <div className="grid gap-space-xs font-body-md text-body-md text-on-surface">
                  <div className="flex justify-between">
                    <span>{summary.service}</span>
                    <span className="font-bold text-primary">{summary.price}</span>
                  </div>
                  {summary.hasExtras && (
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{summary.extras}</div>
                  )}
                  {summary.pet && (
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{summary.pet}</div>
                  )}
                  {summary.datetime && (
                    <div className="font-body-sm text-body-sm text-on-surface-variant">{summary.datetime}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-space-lg rounded border border-error bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
            >
              {error}
            </p>
          )}

          <div className="mt-space-xl flex min-w-0 gap-space-sm">
            {step > 0 && (
              <div className="shrink-0">
                <Button variant="soft" onClick={goBack}>
                  Atrás
                </Button>
              </div>
            )}
            <div className="min-w-0 flex-1">
              {step < 4 ? (
                <Button
                  fullWidth
                  icon="arrow_forward"
                  iconPosition="right"
                  onClick={goNext}
                  disabled={!canProceed}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  fullWidth
                  icon="calendar_month"
                  onClick={confirmBooking}
                  disabled={!canProceed || submitting}
                >
                  {submitting ? 'Confirmando…' : 'Confirmar reserva'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-space-lg text-center font-body-sm text-body-sm text-outline">{booking.reassurance}</p>
      </main>
    </div>
  );
}
