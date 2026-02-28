const stationData = require('./stations.json') as string[];

const normalizeStationName = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(station|stn|st\.)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const stationOptions: string[] = Array.from(
  new Set(stationData.filter(item => typeof item === 'string' && item.trim().length > 0)),
);

export const matchStationOption = (candidate: string): string | null => {
  const normalizedCandidate = normalizeStationName(candidate);
  if (!normalizedCandidate) {
    return null;
  }

  const exact = stationOptions.find(
    station => normalizeStationName(station) === normalizedCandidate,
  );
  if (exact) {
    return exact;
  }

  const partial = stationOptions.find(station => {
    const normalizedStation = normalizeStationName(station);
    return (
      normalizedStation.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedStation)
    );
  });

  return partial ?? null;
};
