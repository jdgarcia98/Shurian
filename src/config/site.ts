/**
 * SHURIAN - Configuración Centralizada del Sitio y Comercio
 * Todos los componentes deben consumir estos datos para mantener coherencia en:
 * - Horarios comerciales
 * - Dirección física
 * - Teléfonos, WhatsApp y redes sociales
 */

export const SITE_CONFIG = {
  name: "SHURIAN",
  fullName: "SHURIAN - Servicio Técnico & Accesorios",
  tagline: "Venta de tecnología, accesorios y servicio técnico especializado",
  description:
    "Especialistas en venta de accesorios, componentes de tecnología y reparación profesional de celulares y computadoras en Rosario, Santa Fe.",
  
  // Ubicación Oficial
  address: "Bv. Segui 1501",
  city: "Rosario, Santa Fe",
  fullAddress: "Bv. Segui 1501, Rosario, Santa Fe",
  postalCode: "S2000",
  country: "Argentina",
  googleMapsUrl: "https://maps.google.com/?q=Bv.+Segui+1501,+Rosario,+Santa+Fe",

  // Canales de Contacto
  phoneDisplay: "341 755-1501",
  whatsappNumber: "5493417551501",
  whatsappUrl: "https://wa.me/5493417551501",
  instagramHandle: "@shurian.pc",
  instagramUrl: "https://www.instagram.com/shurian.pc/",

  // Horarios Comerciales Oficiales
  // Lun a Vie de 09:00 a 13:00 y de 16:00 a 19:00 hs
  hoursWeekdays: "09:00 - 13:00 hs y 16:00 - 19:00 hs",
  hoursSaturday: "09:30 - 13:30 hs",
  hoursSunday: "Cerrado",
  hoursSummary: "Lun a Vie 09:00 a 13:00 / 16:00 a 19:00 hs. Sábados 09:30 a 13:30 hs.",

  hours: [
    { days: "Lunes a Viernes", time: "09:00 - 13:00 hs y 16:00 - 19:00 hs" },
    { days: "Sábados", time: "09:30 - 13:30 hs" },
    { days: "Domingos y Feriados", time: "Cerrado" },
  ],

  // Enlaces Principales de Navegación
  navLinks: [
    { href: "/", label: "Inicio" },
    { href: "/catalogo", label: "Catálogo" },
    { href: "/servicio-tecnico", label: "Servicio Técnico" },
    { href: "/contacto", label: "Ubicación & Contacto" },
  ],

  // Políticas comerciales destacadas
  features: [
    {
      title: "Diagnóstico Sin Cargo",
      description: "Revisamos tu celular o PC y te presupuestamos sin compromiso.",
      icon: "SearchCheck",
    },
    {
      title: "Reparaciones en el Día",
      description: "Cambios de pantalla, batería y limpieza express garantizada.",
      icon: "Clock",
    },
    {
      title: "Garantía Escrita",
      description: "Todos nuestros repuestos y trabajos cuentan con respaldo formal.",
      icon: "ShieldCheck",
    },
    {
      title: "Retiro en Local",
      description: "Retiro sin costo en Bv. Segui 1501 o envíos a coordinar en Rosario.",
      icon: "Truck",
    },
  ],
};

// Alias export for backward compatibility
export const STORE_INFO = SITE_CONFIG;
