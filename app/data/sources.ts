export const DATASET_VERSION = "2026.09.14-1";
export const SOURCES: Record<
  string,
  { title: string; url: string; retrievedAt: string; reliability: string }
> = {
  "jpl-physical": {
    title: "JPL planetary physical parameters",
    url: "https://ssd.jpl.nasa.gov/planets/phys_par.html",
    retrievedAt: "2026-09-10",
    reliability:
      "Reference compilation; field reference letters retained. Values may have different publication dates. Gravity is equatorial/reference-level; giant-planet rotation is convention dependent.",
  },
  "jpl-sat-physical": {
    title: "JPL satellite physical parameters",
    url: "https://ssd.jpl.nasa.gov/sats/phys_par/sep.html",
    retrievedAt: "2026-09-10",
    reliability:
      "Mean equivalent-volume radii and fitted GM with quoted uncertainties. Radius and GM can come from different references/epochs.",
  },
  "jpl-planets": {
    title: "JPL approximate planetary positions",
    url: "https://ssd.jpl.nasa.gov/planets/approx_pos.html",
    retrievedAt: "2026-09-09",
    reliability:
      "Table 1 approximate elements and rates, 1800–2050. Earth row is the Earth–Moon barycenter. Not a precision ephemeris.",
  },
  "jpl-sat-elements": {
    title: "JPL satellite mean orbital elements",
    url: "https://ssd.jpl.nasa.gov/sats/elem/",
    retrievedAt: "2026-09-10",
    reliability:
      "Rounded mean elements, not state vectors. Preserve epoch, parent and reference plane. Published P values retained verbatim; do not substitute rotational periods.",
  },
  "naif-pck": {
    title: "NASA/JPL NAIF planetary orientation constants",
    url: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc",
    retrievedAt: "2026-09-14",
    reliability:
      "IAU Working Group orientation models encoded as a generic SPICE text kernel. Used here only for the Uranian equatorial reference-plane pole; this is not a satellite ephemeris.",
  },
  "jpl-constants": {
    title: "JPL astrodynamic parameters",
    url: "https://ssd.jpl.nasa.gov/astro_par.html",
    retrievedAt: "2026-09-10",
    reliability:
      "AU definition, time units, speed of light and DE440 GM; distinguish planetary-system GM from body GM.",
  },
  "iau-nominal": {
    title: "IAU 2015 Resolution B3",
    url: "https://iauarchive.eso.org/static/resolutions/IAU2015_English.pdf",
    retrievedAt: "2026-09-10",
    reliability:
      "Exact nominal conversion constants, not exact measurements of the physical Sun.",
  },
  "nasa-sun": {
    title: "NASA Sun facts",
    url: "https://science.nasa.gov/sun/facts/",
    retrievedAt: "2026-09-10",
    reliability: "Rounded educational facts; rotation varies with latitude.",
  },
  "nasa-moon": {
    title: "NASA Moon facts",
    url: "https://science.nasa.gov/moon/facts/",
    retrievedAt: "2026-09-10",
    reliability:
      "Rounded educational facts, including synchronous rotation; not a lunar ephemeris.",
  },
};
// Exact definitions/conversions, not observations.
export const AU_KM = 149597870.7;
export const LIGHT_KM_S = 299792.458;
export const DAY_MS = 86400000;
export const JULIAN_YEAR_DAYS = 365.25;
export const J2000_UTC_APPROX = Date.UTC(2000, 0, 1, 12);
