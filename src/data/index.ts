import settingsData from './settings.json';
import routesData from './routes.json';
import scenarioData from './scenario.json';
import templatesData from './templates.json';
import plansData from './plans.json';
import mapRouteData from './mapRoute.json';

// Type definitions
export interface SpeedOption {
  label: string;
  minMeterPerMin?: number;
  maxMeterPerMin?: number;
  minutes?: number;
  description?: string;
}

export type SpeedLevel = 'fast' | 'normal' | 'slow';

export interface Settings {
  walkingSpeed: Record<SpeedLevel, SpeedOption>;
  elevatorSpeed: Record<SpeedLevel, SpeedOption>;
}

export interface WalkSegment {
  distanceMeters: number;
  trafficLights: number;
}

export interface BusSchedule {
  weekday: {
    morning: {
      firstBus: string;
      lastBus: string;
      avgIntervalMinutes: number;
      intervalStdDevMinutes: number;
    };
  };
}

export interface BoardingProbability {
  minutesBefore: number[];
  probability: number[];
}

export interface Route {
  id: string;
  busNumber: string;
  departure: string;
  arrival: string;
  walkToStop: WalkSegment;
  walkFromStop: WalkSegment;
  busSchedule: BusSchedule;
  avgRideMinutes: number;
  rideStdDevMinutes: number;
  boardingProbability: BoardingProbability;
}

export interface Routes {
  routes: Route[];
}

export interface User {
  name: string;
  age: number;
  occupation: string;
  floor: number;
}

export interface Commute {
  destination: string;
  desiredArrivalTime: string;
  selectedWalkingSpeed: SpeedLevel;
  selectedElevatorSpeed: SpeedLevel;
  selectedRouteId: string;
}

export interface Scenario {
  user: User;
  commute: Commute;
}

export interface Template {
  id: string;
  name: string;
  origin: string;
  destination: string;
  routeId: string;
  walkingSpeed: SpeedLevel;
  elevatorSpeed: SpeedLevel;
}

export interface MovingPlan {
  id: string;
  templateId: string;
  date: string;
  mode: 'arrival' | 'departure';
  targetTime: string;
}

export interface LatLng {
  lat: number;
  lng: number;
  label?: string;
}

export interface MapRouteData {
  origin: LatLng;
  busStop: LatLng;
  destinationStop: LatLng;
  destination: LatLng;
  walkPath: LatLng[];
  busPath: LatLng[];
  walkPathFromStop: LatLng[];
}

// Export data with types
export const settings = settingsData as Settings;
export const routes = routesData as Routes;
export const scenario = scenarioData as Scenario;
export const templates = templatesData.templates as Template[];
export const plans = plansData.plans as MovingPlan[];
export const mapRoute = mapRouteData as MapRouteData;

export const mockData = {
  settings,
  routes,
  scenario,
  templates,
  plans,
  mapRoute,
} as const;

export default mockData;
