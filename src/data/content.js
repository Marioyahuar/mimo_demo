/**
 * All landing page copy and asset URLs in one place so sections stay
 * presentational. Images point to the original Stitch-hosted assets.
 */

export const brand = {
  name: 'Mimo',
  fullName: 'Mimo Pet Spa & Wellness',
  logo: 'https://lh3.googleusercontent.com/aida/AEtjO1VBK6RWWQO5ku7U2Pty0R_Q8v_uTqD2yvNYP1cYmQKxqO63Hgl-ywA1Yv5zjW4jl8mVr-V5nN88sA2CSgkXceNXPRVbmsudX8z5U6_B2ARoFAK4IjM9kYSEE3r0ETj3jShMADTJ3LVEKlgHc3NKxPP9WlFLdgwOUQeMFmgj_iv-Ze5HTMHs2uxkrQsiNNpnOwLVDf7H18FP8Uj0TKqzYEZcpkTplP7Nks17d50Vo0vgPCXBLj3O-jZOjGY',
};

export const nav = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Precios', href: '#precios' },
];

export const hero = {
  rating: '4.9/5 por más de 850 familias felices',
  titleLead: 'El día de spa que',
  titleHighlight: 'tu mascota',
  titleTail: 'merece',
  subtitle:
    'Experiencias de baño, peluquería y relajación diseñadas sin estrés, con aromaterapia suave, cosmética orgánica y el trato más cariñoso de la ciudad.',
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDnH5rdpA9VMO-PsLqy3Tgzq_Re69suC2XfgvHKP7iGZmwNZriEHXBRNIzPeaF2FBm5Efl3rrH3AbB1LKRI4W5SjtN8JlJ1KX4pO588TFi4U8msrs276XxgwF_REdsRdRsufp59mYdbc6cn7hQn9G4ZxDVDczS13ECXLqnLimtUwMoOAUddHKjtRXTv8hW4tyRWy93HIDiaeDCrJV9PBkYQI_4_pyzxMyHf9y7G3jvnTaYgUIvWWCDW',
  imageAlt:
    'Cachorro de Golden Retriever feliz y relajado envuelto en toalla suave de algodón tras su baño en Mimo Spa',
  highlights: [
    { value: '100%', label: 'Libre de jaulas', tone: 'text-on-surface' },
    { value: 'Orgánico', label: 'Botánica natural', tone: 'text-secondary' },
    { value: '1 a 1', label: 'Cuidado exclusivo', tone: 'text-primary' },
  ],
  badgeTop: { icon: 'eco', title: '100% Natural', subtitle: 'Cero estrés sonoro' },
  badgeBottom: { icon: 'hot_tub', title: 'Toallas tibias', subtitle: 'Aromaterapia de lavanda' },
};

export const sensory = [
  { icon: 'self_improvement', tone: 'text-secondary', title: 'Música Terapéutica', subtitle: 'Frecuencias calmantes' },
  { icon: 'clean_hands', tone: 'text-primary-container', title: 'Sin Jaulas', subtitle: 'Espacio de libre tránsito' },
  { icon: 'water_drop', tone: 'text-secondary', title: 'Agua Osmotizada', subtitle: 'pH neutro regulado' },
  {
    icon: 'volunteer_activism',
    tone: 'text-primary-container',
    title: 'Refuerzo Positivo',
    subtitle: 'Premios saludables libres de grano',
  },
];

export const services = {
  eyebrow: 'Nuestros Tratamientos',
  title: 'Cuidados pensados en cada detalle',
  lead: 'Cada sesión es un ritual personalizado adaptado al temperamento, la piel y el pelaje de tu mejor amigo.',
  items: [
    {
      icon: 'bath',
      iconWrap: 'bg-secondary-container/40 text-secondary',
      title: 'Baño y secado',
      description:
        'Limpieza profunda con champús hipoalergénicos botánicos, secado a mano a temperatura templada y cepillado sedoso sin tirones ni fricción.',
      tags: [
        { label: 'Desde $28', className: 'bg-surface-container text-on-surface' },
        { label: '45 min', className: 'bg-surface-container text-on-surface-variant' },
        { label: 'Aromaterapia', className: 'bg-secondary-fixed/50 text-secondary' },
      ],
      featured: false,
    },
    {
      icon: 'content_cut',
      iconWrap: 'bg-primary-fixed text-primary',
      title: 'Peluquería canina',
      description:
        'Cortes a tijera personalizados según la morfología y raza de tu perrito. Perfilado suave de patitas, despeje de almohadillas, higiene de orejas y corte estético seguro.',
      tags: [
        { label: 'Desde $42', className: 'bg-surface-container text-on-surface' },
        { label: '60-90 min', className: 'bg-surface-container text-on-surface-variant' },
        { label: 'Estilismo de raza', className: 'bg-primary-fixed/60 text-primary' },
      ],
      featured: true,
      badge: 'Más Solicitado',
    },
    {
      icon: 'spa',
      iconWrap: 'bg-secondary-container/40 text-secondary',
      title: 'Spa relajante',
      description:
        'Hidromasaje con sales marinas calmantes, bálsamo nutritivo orgánico en almohadillas y masaje relajante craneofacial para reducir la tensión y la ansiedad por completo.',
      tags: [
        { label: 'Desde $35', className: 'bg-surface-container text-on-surface' },
        { label: '50 min', className: 'bg-surface-container text-on-surface-variant' },
        { label: 'Antiestrés total', className: 'bg-secondary-fixed/50 text-secondary' },
      ],
      featured: false,
    },
    {
      icon: 'dentistry',
      iconWrap: 'bg-primary-fixed text-primary',
      title: 'Cuidado dental',
      description:
        'Limpieza dental enzimática suave que elimina placa y sarro sin anestesia, complementada con gel bucal saborizado para un aliento fresco y encías saludables.',
      tags: [
        { label: 'Desde $18', className: 'bg-surface-container text-on-surface' },
        { label: '20-30 min', className: 'bg-surface-container text-on-surface-variant' },
        { label: 'Aliento fresco', className: 'bg-primary-fixed/60 text-primary' },
      ],
      featured: false,
    },
    {
      icon: 'pets',
      iconWrap: 'bg-secondary-container/40 text-secondary',
      title: 'Corte de uñas',
      description:
        'Recorte cuidadoso de uñas con esmerilado suave que evita astillados y molestias, ideal para mantener patitas sanas y una pisada cómoda entre visitas de spa.',
      tags: [
        { label: 'Desde $10', className: 'bg-surface-container text-on-surface' },
        { label: '15 min', className: 'bg-surface-container text-on-surface-variant' },
        { label: 'Sin estrés', className: 'bg-secondary-fixed/50 text-secondary' },
      ],
      featured: false,
    },
    {
      icon: 'grass',
      iconWrap: 'bg-secondary-container/40 text-secondary',
      title: 'Baño herbal',
      description:
        'Inmersión relajante con infusión de hierbas botánicas naturales que calman la piel, refuerzan el pelaje y envuelven a tu mascota en un aroma fresco y herbal de principio a fin.',
      tags: [
        { label: 'Desde $30', className: 'bg-surface-container text-on-surface' },
        { label: '60 min', className: 'bg-surface-container text-on-surface-variant' },
        { label: 'Ingredientes naturales', className: 'bg-secondary-fixed/50 text-secondary' },
      ],
      featured: false,
    },
  ],
};

export const addOns = {
  eyebrow: 'Personaliza su estancia',
  title: 'Tratamientos botánicos complementarios',
  note: 'Puedes sumarlos en tu reserva para una experiencia todavía más nutritiva e inolvidable.',
  items: [
    { icon: 'spa', title: 'Mascarilla de Arándanos', subtitle: 'Limpia y abrillanta el lagrimal', price: '+$8' },
    { icon: 'healing', title: 'Bálsamo de Karité & Cera', subtitle: 'Protección profunda de patitas', price: '+$6' },
    { icon: 'air', title: 'Ozono & Manzanilla', subtitle: 'Regeneración dérmica y picores', price: '+$12' },
    { icon: 'dentistry', title: 'Higiene Dental Enzimática', subtitle: 'Aliento fresco y prevención', price: '+$10' },
  ],
};

export const whyUs = {
  eyebrow: 'La Experiencia Mimo',
  title: '¿Por qué los dueños eligen Mimo?',
  lead: 'Entendemos que tu compañero de cuatro patas es parte de tu familia. Por eso reimaginamos la peluquería tradicional eliminando el ruido, las jaulas y las prisas.',
  points: [
    {
      title: 'Cero jaulas y sin tiempos de espera',
      description:
        'Atendemos con cita exclusiva para que tu mascota disfrute de atención individualizada sin estrés, demoras ni ladridos molestos en boxes oscuros.',
    },
    {
      title: 'Cosmética natural y ecológica',
      description:
        'Utilizamos productos certificados libres de sulfatos, parabenos y perfumes artificiales, cuidando las pieles reactivas y alérgicas.',
    },
    {
      title: 'Especialistas certificados en manejo positivo',
      description:
        'Nuestro equipo está entrenado en lenguaje corporal canino, pausas de confort y refuerzo positivo para generar vínculos de absoluta confianza.',
    },
  ],
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAxsqddxZlhE8EtIG9C2xhnJqei2oGsKZZt8X_vDKC_kT8ynde4_CO0steeJ69Gr_JQ5nPGHx_PR3OWJMb3yOwJfpTMX6qgCkwH6HIdWjVeTTR0K7OKg8oWEZADwhEnKEZ46ycP9W9yHi6VQEWpRo8NQ5tX5MqdaqEAOrUf4ERuitUTPa8uKIL_192xMFz9wM1rkSbckdjeTglZEKE86XxDp4clu7CYOChc27W7VqhBhyEPVqMCp4Cb',
  imageAlt:
    'Estilista canina profesional peinando amorosamente a un perrito feliz en mesa de madera de estilo nórdico',
  stat: { value: '99%', label: 'de satisfacción', note: 'Más de 3,500 consentidos' },
};

export const testimonials = {
  eyebrow: 'Testimonios Reales',
  title: 'Palabras de quienes más nos importan',
  items: [
    {
      quote:
        'Mi perrita Frida siempre salía temblando de las veterinarias. En Mimo salió saltando de felicidad y con un perfume a lavanda delicioso. Nunca más la llevo a otro lugar.',
      initials: 'CP',
      avatar: 'bg-secondary-fixed text-secondary',
      name: 'Camila Peralta',
      role: 'Mamá de Frida (Caniche)',
    },
    {
      quote:
        'El corte a tijera que le hicieron a Milo fue arte puro. Se nota el respeto y el tiempo que le dedican. ¡Cero jaulas es una bendición real para ellos!',
      initials: 'JS',
      avatar: 'bg-primary-fixed text-primary',
      name: 'Javier Santander',
      role: 'Papá de Milo (Cockapoo)',
    },
    {
      quote:
        'Excelente atención y el servicio de spa con hidromasaje ayudó muchísimo a las articulaciones de mi Golden viejito. Salieron relajadísimos y felices.',
      initials: 'MB',
      avatar: 'bg-tertiary-fixed text-tertiary',
      name: 'Mariana Beltrán',
      role: 'Mamá de Bruno (Golden Retriever)',
    },
  ],
};

export const ctaBanner = {
  badge: 'Promoción Bienvenida',
  title: 'Reserva el primer baño con 20% de descuento',
  subtitle:
    'Queremos que descubras por qué somos el spa favorito de tu vecindario. Cupos limitados por día para garantizar paz, calma y mimos sin prisa.',
  button: 'Reclamar 20% y Reservar',
  reassurance: 'Sin cargos de cancelación hasta 24h antes • Pago seguro',
};

export const faq = {
  title: 'Preguntas Frecuentes',
  lead: 'Resolvemos las dudas más comunes de nuestras familias.',
  items: [
    {
      question: '¿Puedo quedarme a esperar a mi mascota durante la sesión?',
      answer:
        '¡Por supuesto! Contamos con un rincón lounge con café orgánico, té relajante y vista acristalada donde puedes observar cómo consentimos a tu compañero sin interrumpir su proceso de calma.',
    },
    {
      question: '¿Qué pasa si mi perro es nervioso o reactivo?',
      answer:
        'Asignamos turnos especiales de adaptación de 15 minutos previos sin agua ni tijeras, utilizando aromaterapia ambiental de manzanilla y premios para que reconozca el espacio como un lugar seguro.',
    },
    {
      question: '¿Qué productos utilizan en perritos con alergias?',
      answer:
        'Disponemos de una línea dermatológica botánica formulada a base de avena coloidal, aloe vera orgánico y aceite de caléndula, 100% libre de sulfatos y parabenos.',
    },
  ],
};

export const booking = {
  pill: 'Reserva tu cita',
  reassurance: 'Sin cargos de cancelación hasta 24h antes • Pago seguro',
  steps: [
    ['Elige el ritual', 'Selecciona el tratamiento perfecto para tu mejor amigo.'],
    ['Cuéntanos de tu mascota', 'Así preparamos todo a su medida.'],
    ['¿Sumamos algún botánico?', 'Personaliza su estancia con extras.'],
    ['Elige fecha y hora', 'Cupos limitados por día para garantizar calma.'],
    ['Tus datos de contacto', 'Últimos detalles antes de confirmar.'],
  ],
  services: [
    {
      icon: 'bathtub',
      title: 'Baño y secado',
      price: 'Desde $28',
      duration: '45 min',
      iconBg: 'bg-secondary-container',
      iconColor: 'text-secondary',
    },
    {
      icon: 'content_cut',
      title: 'Peluquería canina',
      price: 'Desde $42',
      duration: '60-90 min',
      iconBg: 'bg-primary-fixed',
      iconColor: 'text-primary',
    },
    {
      icon: 'spa',
      title: 'Spa relajante',
      price: 'Desde $35',
      duration: '50 min',
      iconBg: 'bg-secondary-container',
      iconColor: 'text-secondary',
    },
    {
      icon: 'dentistry',
      title: 'Cuidado dental',
      price: 'Desde $18',
      duration: '20-30 min',
      iconBg: 'bg-primary-fixed',
      iconColor: 'text-primary',
    },
    {
      icon: 'pets',
      title: 'Corte de uñas',
      price: 'Desde $10',
      duration: '15 min',
      iconBg: 'bg-secondary-container',
      iconColor: 'text-secondary',
    },
    {
      icon: 'grass',
      title: 'Baño herbal',
      price: 'Desde $30',
      duration: '60 min',
      iconBg: 'bg-secondary-container',
      iconColor: 'text-secondary',
    },
  ],
  sizes: ['Pequeño', 'Mediano', 'Grande'],
  addOns: [
    { icon: 'spa', title: 'Mascarilla de Arándanos', subtitle: 'Limpia y abrillanta el lagrimal', price: '+$8' },
    { icon: 'healing', title: 'Bálsamo de Karité & Cera', subtitle: 'Protección profunda de patitas', price: '+$6' },
    { icon: 'air', title: 'Ozono & Manzanilla', subtitle: 'Regeneración dérmica y picores', price: '+$12' },
    { icon: 'dentistry', title: 'Higiene Dental Enzimática', subtitle: 'Aliento fresco y prevención', price: '+$10' },
  ],
  slots: ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'],
  confirmation: {
    title: '¡Cita reservada!',
    tail: 'con toallas tibias y aromaterapia de lavanda.',
    again: 'Reservar otra cita',
    reassurance: 'Sin cargos de cancelación hasta 24h antes',
    whatsapp: 'Reenviar por WhatsApp',
  },
  errors: {
    SLOT_TAKEN: 'Ese horario acaba de ser reservado por otra persona. Elige otro horario.',
    DATE_IN_PAST: 'Ese horario ya pasó. Elige una fecha y hora futuras.',
    VALIDATION_ERROR: 'Revisa estos datos antes de confirmar:',
    INTERNAL_ERROR: 'Tuvimos un problema al guardar tu reserva. Intenta confirmar de nuevo.',
    NETWORK: 'No pudimos conectar con el servidor. Revisa tu conexión e intenta confirmar de nuevo.',
  },
  fieldLabels: {
    serviceTitle: 'servicio',
    petName: 'nombre de la mascota',
    petBreed: 'raza',
    petSize: 'tamaño',
    petNotes: 'notas',
    extras: 'extras',
    date: 'fecha',
    time: 'hora',
    contactName: 'nombre',
    contactPhone: 'teléfono',
    contactEmail: 'correo',
  },
};

export const footer = {
  tagline:
    'Cuidado boutique, bienestar holístico y cariño genuino para el miembro más peludo de tu familia.',
  socials: [
    { label: 'Instagram', icon: 'photo_camera' },
    { label: 'Facebook', icon: 'public' },
    { label: 'TikTok', icon: 'music_note' },
  ],
  columns: [
    {
      title: 'Explorar',
      links: [
        { label: 'Servicios', href: '#servicios' },
        { label: 'Nosotros', href: '#nosotros' },
        { label: 'Precios', href: '#precios' },
      ],
    },
    {
      title: 'Atención',
      links: [
        { label: 'Preguntas Frecuentes', href: '#faq' },
        { label: 'Contacto', href: '#contacto' },
        { label: 'Agendar Sesión', href: '/reservar' },
      ],
    },
    {
      title: 'Compromiso',
      links: [
        { label: 'Políticas de Cuidado', href: '#politicas' },
        { label: 'Protocolo Higiénico', href: '#higiene' },
        { label: 'Filosofía Holística', href: '#bienestar' },
      ],
    },
  ],
  legal:
    '© 2025 Mimo Pet Spa & Wellness. Todos los derechos reservados. Diseñado con amor para consentir a tu mascota.',
};
