interface StationEntry {
  code: string;
  name: string;
}

const rawStationData = require('./stations.json') as Array<string | StationEntry>;

const toStationEntry = (item: string | StationEntry): StationEntry | null => {
  if (typeof item === 'string') {
    const name = item.trim();
    if (!name) {
      return null;
    }
    return {code: '', name};
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const code = typeof item.code === 'string' ? item.code.trim().toUpperCase() : '';
  const name = typeof item.name === 'string' ? item.name.trim() : '';

  if (!name) {
    return null;
  }

  return {code, name};
};

const normalizeStationName = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(station|stn|st\.)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeStationCode = (value: string): string => value.trim().toUpperCase();

export const stationCatalog: StationEntry[] = rawStationData
  .map(toStationEntry)
  .filter((entry): entry is StationEntry => entry !== null);

export const stationOptions: string[] = Array.from(
  new Set(stationCatalog.map(station => station.name)),
);

export const findStationByCode = (code: string): StationEntry | null => {
  const normalizedCode = normalizeStationCode(code);
  if (!normalizedCode) {
    return null;
  }

  return (
    stationCatalog.find(
      station => station.code && normalizeStationCode(station.code) === normalizedCode,
    ) ?? null
  );
};

export const findStationByName = (name: string): StationEntry | null => {
  const normalizedCandidate = normalizeStationName(name);
  if (!normalizedCandidate) {
    return null;
  }

  return (
    stationCatalog.find(
      station => normalizeStationName(station.name) === normalizedCandidate,
    ) ?? null
  );
};

export const resolveStationCode = (candidate: string): string | null => {
  const byCode = findStationByCode(candidate);
  if (byCode?.code) {
    return byCode.code;
  }

  const byName = findStationByName(candidate);
  if (byName?.code) {
    return byName.code;
  }

  return null;
};

export const matchStationOption = (candidate: string): string | null => {
  const byCode = findStationByCode(candidate);
  if (byCode) {
    return byCode.name;
  }

  const normalizedCandidate = normalizeStationName(candidate);
  if (!normalizedCandidate) {
    return null;
  }

  const exact = findStationByName(candidate);
  if (exact) {
    return exact.name;
  }

  const partial = stationCatalog.find(station => {
    const normalizedStation = normalizeStationName(station.name);
    return (
      normalizedStation.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedStation)
    );
  });

  return partial ? partial.name : null;
};
