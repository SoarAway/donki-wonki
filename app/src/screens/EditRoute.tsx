import React, {useCallback, useEffect, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';

import {BackButton} from '../components/atoms/BackButton';
import {Button} from '../components/atoms/Button';
import {AutocompleteInput} from '../components/atoms/AutoCompleteInput';
import {Dropdown} from '../components/atoms/Dropdown';
import {Input} from '../components/atoms/Input';
import {TagDropdown} from '../components/atoms/Tag';
import {Time} from '../components/atoms/Time';
import {colorTokens, spacing, typography} from '../components/config';
import {BaseScreen} from '../models/BaseScreen';
import {editRoute, getSpecificRoute, nearestStation} from '../services/api/apiEndpoints';
import {getUserId} from '../services/authStorage';
import {matchStationOption, resolveStationCode, stationOptions} from '../utils/stationCatalog';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface TimeValue {
  hour: string;
  minute: string;
  period: string;
}

export default function EditRoute({navigation, route}: any) {
  const routeIdParam = route?.params?.routeId;
  const [userEmail, setUserEmail] = useState('');
  const [routeId, setRouteId] = useState(routeIdParam ?? '');
  const [label, setLabel] = useState('');
  const [departingLocation, setDepartingLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState<TimeValue>({hour: '08', minute: '00', period: 'AM'});
  const [departurePlaceId, setDeparturePlaceId] = useState('');
  const [destinationPlaceId, setDestinationPlaceId] = useState('');
  const [departingStation, setDepartingStation] = useState('');
  const [destinationStation, setDestinationStation] = useState('');

  const pickString = useCallback((source: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }, []);

  const normalizeDay = (day: string): string => {
    const compact = day.trim().toLowerCase();
    if (!compact) {
      return '';
    }
    return `${compact.charAt(0).toUpperCase()}${compact.slice(1)}`;
  };

  const extractDays = useCallback((routeData: Record<string, unknown>): string[] => {
    const singleDay = pickString(routeData, ['day_of_week', 'dayOfWeek', 'day']);
    if (singleDay) {
      const normalized = normalizeDay(singleDay);
      return DAYS.includes(normalized) ? [normalized] : [];
    }

    const daysValue = routeData.days;
    if (Array.isArray(daysValue)) {
      const normalizedDays = daysValue
        .filter((item): item is string => typeof item === 'string')
        .map(normalizeDay)
        .filter(day => DAYS.includes(day));
      if (normalizedDays.length > 0) {
        return Array.from(new Set(normalizedDays));
      }
    }

    const schedules = routeData.schedules;
    if (Array.isArray(schedules)) {
      const scheduleDays = schedules
        .map(item => {
          if (typeof item === 'string') {
            return item;
          }

          if (item && typeof item === 'object') {
            const schedule = item as Record<string, unknown>;
            return pickString(schedule, ['day_of_week', 'dayOfWeek', 'day']);
          }

          return '';
        })
        .map(normalizeDay)
        .filter(day => DAYS.includes(day));

      if (scheduleDays.length > 0) {
        return Array.from(new Set(scheduleDays));
      }
    }

    return [];
  }, [pickString]);

  const extractTimeString = useCallback((routeData: Record<string, unknown>): string => {
    const directTime = pickString(routeData, ['time', 'time_from', 'timeFrom', 'departure_time', 'departureTime']);
    if (directTime) {
      return directTime;
    }

    const schedules = routeData.schedules;
    if (Array.isArray(schedules)) {
      for (const item of schedules) {
        if (item && typeof item === 'object') {
          const schedule = item as Record<string, unknown>;
          const scheduleTime = pickString(schedule, ['time', 'time_from', 'timeFrom']);
          if (scheduleTime) {
            return scheduleTime;
          }
        }
      }
    }

    return '';
  }, [pickString]);

  const parseTime = (timeValue: string): TimeValue => {
    const raw = timeValue.trim();
    if (!raw) {
      return {hour: '08', minute: '00', period: 'AM'};
    }

    const normalized = raw
      .split('-')[0]
      .trim()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .toUpperCase();

    const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (twelveHour) {
      const hour = String(parseInt(twelveHour[1], 10)).padStart(2, '0');
      return {hour, minute: twelveHour[2], period: twelveHour[3].toUpperCase()};
    }

    const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!twentyFourHour) {
      return {hour: '08', minute: '00', period: 'AM'};
    }

    const rawHour = parseInt(twentyFourHour[1], 10);
    const minute = twentyFourHour[2];
    const period = rawHour >= 12 ? 'PM' : 'AM';
    const hour12 = rawHour % 12 === 0 ? 12 : rawHour % 12;

    return {
      hour: String(hour12).padStart(2, '0'),
      minute,
      period,
    };
  };

  const to24Hour = (hour: string, period: string): string => {
    const parsedHour = parseInt(hour, 10);
    if (Number.isNaN(parsedHour)) {
      return '00';
    }

    if (period === 'AM') {
      return parsedHour === 12 ? '00' : String(parsedHour).padStart(2, '0');
    }

    return parsedHour === 12 ? '12' : String(parsedHour + 12).padStart(2, '0');
  };

  useEffect(() => {
    let active = true;

    const loadRoute = async () => {
      if (!routeIdParam) {
        Alert.alert('Error', 'Route ID is missing.');
        navigation.goBack();
        return;
      }

      const email = await getUserId();
      if (!email) {
        Alert.alert('Error', 'No signed-in user found. Please log in again.');
        navigation.goBack();
        return;
      }

      setUserEmail(email);

      try {
        const response = await getSpecificRoute(email, routeIdParam);
        const rawRouteData = response.route as Record<string, unknown>;
        const routeDataCandidate = rawRouteData.route;
        const routeData =
          routeDataCandidate && typeof routeDataCandidate === 'object'
            ? (routeDataCandidate as Record<string, unknown>)
            : rawRouteData;

        if (!active) {
          return;
        }

        setRouteId(pickString(routeData, ['route_id', 'id', 'routeId']) || routeIdParam);
        setLabel(pickString(routeData, ['route_desc', 'description', 'label', 'name']));
        setDepartingLocation(pickString(routeData, ['departing_location', 'departingLocation']));
        setDestinationLocation(pickString(routeData, ['destination_location', 'destinationLocation']));
        setSelectedDays(extractDays(routeData));
        setTime(parseTime(extractTimeString(routeData)));
        const apiDepartureStation = pickString(routeData, ['departing_station', 'departingStation']);
        const apiDestinationStation = pickString(routeData, ['destination_station', 'destinationStation']);
        setDepartingStation(matchStationOption(apiDepartureStation) ?? apiDepartureStation);
        setDestinationStation(matchStationOption(apiDestinationStation) ?? apiDestinationStation);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load route details.';
        Alert.alert('Error', message);
        navigation.goBack();
      }
    };

    loadRoute();

    return () => {
      active = false;
    };
  }, [navigation, routeIdParam, extractDays, extractTimeString, pickString]);

  useEffect(() => {
    if (!departurePlaceId || !destinationPlaceId) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const nearestStationResponse = await nearestStation({
          departure_place_id: departurePlaceId,
          destination_place_id: destinationPlaceId,
        });
        setDepartingStation(
          matchStationOption(nearestStationResponse.departure_nearest_station) ??
            nearestStationResponse.departure_nearest_station,
        );
        setDestinationStation(
          matchStationOption(nearestStationResponse.destination_nearest_station) ??
            nearestStationResponse.destination_nearest_station,
        );
      } catch {
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [departurePlaceId, destinationPlaceId]);

  const handleSave = async () => {
    if (
      !userEmail ||
      !routeId ||
      !label ||
      !departingLocation ||
      !destinationLocation ||
      selectedDays.length === 0 ||
      !departingStation ||
      !destinationStation
    ) {
      Alert.alert('Error', 'Please complete all required fields.');
      return;
    }

    const dayOfWeek = selectedDays[0];
    const hour24 = to24Hour(time.hour, time.period);
    const timeValue = `${hour24}:${String(time.minute).padStart(2, '0')}:00`;
    const departingStationCode = resolveStationCode(departingStation);
    const destinationStationCode = resolveStationCode(destinationStation);

    if (!departingStationCode || !destinationStationCode) {
      Alert.alert('Error', 'Please select stations from the station list.');
      return;
    }

    try {
      await editRoute({
        route_id: routeId,
        email: userEmail,
        departing_location: departingLocation,
        destination_location: destinationLocation,
        day_of_week: dayOfWeek,
        time: timeValue,
        departing_station: departingStationCode,
        destination_station: destinationStationCode,
        route_desc: label,
      });

      Alert.alert('Success', 'Route updated successfully.');
      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update route.';
      Alert.alert('Error', message);
    }
  };

  return (
    <BaseScreen style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Edit Route</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Input label="Label:" placeholder="Route label" value={label} onChangeText={setLabel} />
        <AutocompleteInput
          label="Departure Location:"
          placeholder="Departure location"
          value={departingLocation}
          onChangeText={text => {
            setDepartingLocation(text);
            setDeparturePlaceId('');
          }}
          onSelect={setDepartingLocation}
          onSelectSuggestion={suggestion => setDeparturePlaceId(suggestion.place_id)}
          containerStyle={styles.departureAutocomplete}
        />
        <AutocompleteInput
          label="Destination Location:"
          placeholder="Destination location"
          value={destinationLocation}
          onChangeText={text => {
            setDestinationLocation(text);
            setDestinationPlaceId('');
          }}
          onSelect={setDestinationLocation}
          onSelectSuggestion={suggestion => setDestinationPlaceId(suggestion.place_id)}
          containerStyle={styles.destinationAutocomplete}
        />
        <View style={styles.departureStationWrapper}>
          <Dropdown
            label="Departure Station:"
            placeholder="Select departure station"
            options={stationOptions}
            selectedValue={departingStation}
            onSelect={setDepartingStation}
          />
        </View>
        <View style={styles.destinationStationWrapper}>
          <Dropdown
            label="Destination Station:"
            placeholder="Select destination station"
            options={stationOptions}
            selectedValue={destinationStation}
            onSelect={setDestinationStation}
          />
        </View>
        <View style={styles.daySelectorWrapper}>
          <TagDropdown
            label="Day:"
            placeholder="Select day(s)"
            options={DAYS}
            selectedValues={selectedDays}
            onSelect={setSelectedDays}
          />
        </View>
        <View style={styles.timeSectionWrapper}>
          <Time value={time} onChange={setTime} />
        </View>

        <View style={styles.bottomContainer}>
          <Button title="Save Changes" onPress={handleSave} />
        </View>
      </ScrollView>

    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colorTokens.background_default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingTop: spacing[24] - spacing[2],
    paddingBottom: spacing[6] + 1,
  },
  title: {
    fontSize: typography.sizes['3xl'] - 3,
    fontWeight: typography.weights.bold,
    color: colorTokens.text_primary_soft,
    marginLeft: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing[8],
    paddingTop: spacing[2] + 2,
    paddingBottom: spacing[12] + spacing[12],
  },
  departureAutocomplete: {
    zIndex: 3000,
  },
  destinationAutocomplete: {
    zIndex: 3000,
  },
  departureStationWrapper: {
    zIndex: 2000,
  },
  destinationStationWrapper: {
    zIndex: 1500,
  },
  daySelectorWrapper: {
    zIndex: 1000,
  },
  timeSectionWrapper: {
    marginTop: spacing[2] + 2,
    zIndex: 0,
  },
  bottomContainer: {
    paddingHorizontal: spacing[8],
    paddingTop: spacing[8],
  },
});
