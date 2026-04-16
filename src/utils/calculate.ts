import type { Scenario, Settings, Route } from '../data';

export interface TimelineStep {
  time: string;
  title: string;
  description: string;
  details?: string[];
}

export interface CalculationResult {
  desiredArrivalTime: string;
  busArrivalTime: string;
  stationArrivalTime: string;
  departureTime: string;
  busNumber: string;
  timeline: TimelineStep[];
  summary: {
    arrivalTime: string;
    stationArrivalTime: string;
    stationArrivalProbability: number;
    departureTime: string;
    departureDetails: string[];
  };
}

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to convert minutes since midnight back to time string
function minutesToTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function calculateTimeline(
  scenario: Scenario,
  settings: Settings,
  route: Route
): CalculationResult {
  const { desiredArrivalTime, selectedWalkingSpeed, selectedElevatorSpeed } =
    scenario.commute;

  // Get walking speed (use average of min and max)
  const walkSpeedSettings = settings.walkingSpeed[selectedWalkingSpeed];
  const walkSpeedPerMin =
    ((walkSpeedSettings.minMeterPerMin || 0) +
      (walkSpeedSettings.maxMeterPerMin || 0)) /
    2;

  // Get elevator time
  const elevatorTime = settings.elevatorSpeed[selectedElevatorSpeed].minutes || 4;

  // Note: floor parameter is used to calculate elevator time in real implementation

  // Calculate walking time to station
  const walkToStationMinutes = Math.ceil(
    route.walkToStop.distanceMeters / walkSpeedPerMin
  );

  // Calculate traffic light delays
  const trafficLightDelayMinutes = route.walkToStop.trafficLights * 2;

  // Calculate walking time from station
  const walkFromStationMinutes = Math.ceil(
    route.walkFromStop.distanceMeters / walkSpeedPerMin
  );
  const trafficLightDelayFromStation = route.walkFromStop.trafficLights * 2;

  // Convert desired arrival time to minutes
  const arrivalTimeMinutes = timeToMinutes(desiredArrivalTime);

  // Work backward from arrival time
  // 1. Subtract walking time from station and traffic lights
  const busArrivalMinutes =
    arrivalTimeMinutes - walkFromStationMinutes - trafficLightDelayFromStation;

  // 2. Subtract bus ride time (use average)
  const stationBoardMinutes = busArrivalMinutes - route.avgRideMinutes;

  // 3. Find safe arrival time at station (with 90% probability)
  // Based on boarding probability data, we need to find when to arrive
  const boardingProb = route.boardingProbability;
  let stationArrivalMinutes = stationBoardMinutes;
  let safeProbability = 0.5;

  // Find the time that gives us closest to 90% probability (or best available)
  for (let i = 0; i < boardingProb.minutesBefore.length; i++) {
    if (boardingProb.probability[i] >= 0.88) {
      stationArrivalMinutes =
        stationBoardMinutes - boardingProb.minutesBefore[i];
      safeProbability = boardingProb.probability[i];
      break;
    }
  }

  // 4. Subtract travel time to station
  const departureMinutes =
    stationArrivalMinutes - walkToStationMinutes - trafficLightDelayMinutes;

  // 5. Subtract elevator time
  const leaveHomeMinutes = departureMinutes - elevatorTime;

  // Convert back to time strings
  const departureTime = minutesToTime(leaveHomeMinutes);
  const stationArrivalTime = minutesToTime(stationArrivalMinutes);
  const busTimeOnBoard = minutesToTime(stationBoardMinutes);
  const busArrivalAtDestination = minutesToTime(busArrivalMinutes);

  // Build departure details
  const departureDetails: string[] = [
    `엘리베이터 대기 ${elevatorTime}분`,
    `도보 ${walkToStationMinutes}분`,
    `신호등 대기 ${trafficLightDelayMinutes}분`,
  ];

  // Build timeline steps
  const timeline: TimelineStep[] = [
    {
      time: departureTime,
      title: '출발',
      description: `${departureTime} 집에서 출발`,
      details: departureDetails,
    },
    {
      time: stationArrivalTime,
      title: '정류장 도착',
      description: `${stationArrivalTime} 정류장 도착`,
      details: [`90% 확률 탑승 안전 시각`],
    },
    {
      time: busTimeOnBoard,
      title: '버스 탑승',
      description: `${busTimeOnBoard} ${route.busNumber}번 버스 탑승`,
      details: [`예상 탑승 시간`],
    },
    {
      time: busArrivalAtDestination,
      title: '버스 하차',
      description: `${busArrivalAtDestination} 버스 하차`,
      details: [`예상 도착 시간: ${route.avgRideMinutes}분 소요`],
    },
    {
      time: desiredArrivalTime,
      title: '도착',
      description: `${desiredArrivalTime} ${scenario.commute.destination} 도착`,
      details: [`목적지 도착 완료`],
    },
  ];

  return {
    desiredArrivalTime,
    busArrivalTime: busArrivalAtDestination,
    stationArrivalTime,
    departureTime,
    busNumber: route.busNumber,
    timeline,
    summary: {
      arrivalTime: desiredArrivalTime,
      stationArrivalTime,
      stationArrivalProbability: Math.round(safeProbability * 100),
      departureTime,
      departureDetails,
    },
  };
}
