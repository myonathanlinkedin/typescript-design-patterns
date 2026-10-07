export type EquatorialCoordinate = {
  /** Right Ascension in hours */
  ra: number;
  /** Declination in degrees */
  dec: number;
};

export type HorizontalCoordinate = {
  /** Azimuth in degrees, measured from North towards East (0° = North) */
  az: number;
  /** Altitude in degrees above the horizon */
  alt: number;
};

export type Observer = {
  /** Latitude in degrees (+ north) */
  latitude: number;
  /** Longitude in degrees (+ east) */
  longitude: number;
};

/** Convert degrees to radians */
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
/** Convert radians to degrees */
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;
/** Convert hours to degrees (1h = 15°) */
export const hoursToDeg = (h: number): number => h * 15;
/** Normalize angle to [0, 360) degrees */
export const normalizeAngle = (deg: number): number => {
  let a = deg % 360;
  if (a < 0) a += 360;
  return a;
};
/** Normalize angle to (-180, 180] degrees */
export const normalizeAngle180 = (deg: number): number => {
  let a = ((deg + 180) % 360) - 180;
  if (a <= -180) a += 360;
  return a;
};

/** Compute Julian Date from a JavaScript Date (UTC) */
export const julianDate = (date: Date): number => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // JS months 0-11
  const day = date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400 +
    date.getUTCMilliseconds() / 86400000;

  let Y = year;
  let M = month;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    day + B - 1524.5;
  return JD;
};

/** Greenwich Sidereal Time in degrees */
export const gst = (jd: number): number => {
  const T = (jd - 2451545.0) / 36525.0;
  let gst = 280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return normalizeAngle(gst);
};

/** Local Sidereal Time in degrees */
export const lst = (gstDeg: number, longitudeDeg: number): number => {
  return normalizeAngle(gstDeg + longitudeDeg);
};

/** Convert equatorial (RA/Dec) to horizontal (Az/Alt) coordinates */
export const raDecToAltAz = (
  eq: EquatorialCoordinate,
  observer: Observer,
  date: Date
): HorizontalCoordinate => {
  const jd = julianDate(date);
  const gstDeg = gst(jd);
  const lstDeg = lst(gstDeg, observer.longitude);
  const raDeg = hoursToDeg(eq.ra);
  const haDeg = normalizeAngle(lstDeg - raDeg); // hour angle

  const haRad = degToRad(haDeg);
  const decRad = degToRad(eq.dec);
  const latRad = degToRad(observer.latitude);

  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad = Math.asin(sinAlt);
  const altDeg = radToDeg(altRad);

  const cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
    (Math.cos(altRad) * Math.cos(latRad));
  // Clamp due to floating point errors
  const cosAzClamped = Math.min(1, Math.max(-1, cosAz));
  let azRad = Math.acos(cosAzClamped);
  // Determine correct quadrant by sign of hour angle
  if (Math.sin(haRad) > 0) {
    azRad = 2 * Math.PI - azRad;
  }
  const azDeg = normalizeAngle(radToDeg(azRad));

  return { az: azDeg, alt: altDeg };
};

/** Angular separation between two horizontal coordinates (degrees) */
export const angularSeparation = (
  a: HorizontalCoordinate,
  b: HorizontalCoordinate
): number => {
  const aRad = {
    az: degToRad(a.az),
    alt: degToRad(a.alt),
  };
  const bRad = {
    az: degToRad(b.az),
    alt: degToRad(b.alt),
  };
  const sinAlt1 = Math.sin(aRad.alt);
  const sinAlt2 = Math.sin(bRad.alt);
  const cosAlt1 = Math.cos(aRad.alt);
  const cosAlt2 = Math.cos(bRad.alt);
  const deltaAz = Math.abs(aRad.az - bRad.az);
  const cosDelta = sinAlt1 * sinAlt2 + cosAlt1 * cosAlt2 * Math.cos(deltaAz);
  const cosDeltaClamped = Math.min(1, Math.max(-1, cosDelta));
  const sepRad = Math.acos(cosDeltaClamped);
  return radToDeg(sepRad);
};

/** Compute required adjustment from current to target orientation */
export const aimAdjustment = (
  current: HorizontalCoordinate,
  target: HorizontalCoordinate
): { deltaAz: number; deltaAlt: number } => {
  const deltaAz = normalizeAngle180(target.az - current.az);
  const deltaAlt = target.alt - current.alt; // altitude difference can be positive/negative directly
  return { deltaAz, deltaAlt };
};
