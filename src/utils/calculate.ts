import type { Scenario, Settings, Route, RouteLeg } from '../data';

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
  isTransfer?: boolean;
  transferCount?: number;
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

/** 단일 구간의 역산에 필요한 값을 계산 */
function calcLegBackward(
  arrivalMin: number,
  leg: RouteLeg,
  walkSpeed: number
) {
  const walkFromMin = Math.ceil(leg.walkFromStop.distanceMeters / walkSpeed);
  const tlFrom = leg.walkFromStop.trafficLights * 2;
  const busExitMin = arrivalMin - walkFromMin - tlFrom;
  const busBoardMin = busExitMin - leg.avgRideMinutes;

  // Safe station arrival (≥88% probability)
  let stationMin = busBoardMin;
  let prob = 0.5;
  for (let i = 0; i < leg.boardingProbability.minutesBefore.length; i++) {
    if (leg.boardingProbability.probability[i] >= 0.88) {
      stationMin = busBoardMin - leg.boardingProbability.minutesBefore[i];
      prob = leg.boardingProbability.probability[i];
      break;
    }
  }

  const walkToMin = Math.ceil(leg.walkToStop.distanceMeters / walkSpeed);
  const tlTo = leg.walkToStop.trafficLights * 2;

  return { walkFromMin, tlFrom, busExitMin, busBoardMin, stationMin, prob, walkToMin, tlTo };
}

export function calculateTimeline(
  scenario: Scenario,
  settings: Settings,
  route: Route
): CalculationResult {
  const { desiredArrivalTime, selectedWalkingSpeed, selectedElevatorSpeed } =
    scenario.commute;

  const walkSpeedSettings = settings.walkingSpeed[selectedWalkingSpeed];
  const walkSpeedPerMin =
    ((walkSpeedSettings.minMeterPerMin || 0) +
      (walkSpeedSettings.maxMeterPerMin || 0)) / 2;

  const elevatorTime = settings.elevatorSpeed[selectedElevatorSpeed].minutes || 4;
  const arrivalTimeMinutes = timeToMinutes(desiredArrivalTime);

  // ── 환승 경로 ──
  if (route.isTransfer && route.legs && route.legs.length >= 2) {
    return calculateTransferTimeline(
      scenario, route, arrivalTimeMinutes, walkSpeedPerMin, elevatorTime
    );
  }

  // ── 단일 경로 (기존 로직) ──
  const walkToStationMinutes = Math.ceil(route.walkToStop.distanceMeters / walkSpeedPerMin);
  const trafficLightDelayMinutes = route.walkToStop.trafficLights * 2;
  const walkFromStationMinutes = Math.ceil(route.walkFromStop.distanceMeters / walkSpeedPerMin);
  const trafficLightDelayFromStation = route.walkFromStop.trafficLights * 2;

  const busArrivalMinutes = arrivalTimeMinutes - walkFromStationMinutes - trafficLightDelayFromStation;
  const stationBoardMinutes = busArrivalMinutes - route.avgRideMinutes;

  const boardingProb = route.boardingProbability;
  let stationArrivalMinutes = stationBoardMinutes;
  let safeProbability = 0.5;

  for (let i = 0; i < boardingProb.minutesBefore.length; i++) {
    if (boardingProb.probability[i] >= 0.88) {
      stationArrivalMinutes = stationBoardMinutes - boardingProb.minutesBefore[i];
      safeProbability = boardingProb.probability[i];
      break;
    }
  }

  const departureMinutes = stationArrivalMinutes - walkToStationMinutes - trafficLightDelayMinutes;
  const leaveHomeMinutes = departureMinutes - elevatorTime;

  const departureTime = minutesToTime(leaveHomeMinutes);
  const stationArrivalTime = minutesToTime(stationArrivalMinutes);
  const busTimeOnBoard = minutesToTime(stationBoardMinutes);
  const busArrivalAtDestination = minutesToTime(busArrivalMinutes);

  const departureDetails: string[] = [
    `엘리베이터 대기 ${elevatorTime}분`,
    `도보 ${walkToStationMinutes}분`,
    `신호등 대기 ${trafficLightDelayMinutes}분`,
  ];

  const timeline: TimelineStep[] = [
    { time: departureTime, title: '출발', description: `${departureTime} 집에서 출발`, details: departureDetails },
    { time: stationArrivalTime, title: '정류장 도착', description: `${stationArrivalTime} 정류장 도착`, details: [`${Math.round(safeProbability * 100)}% 확률 탑승 안전 시각`] },
    { time: busTimeOnBoard, title: '버스 탑승', description: `${busTimeOnBoard} ${route.busNumber}번 버스 탑승`, details: [`예상 탑승 시간`] },
    { time: busArrivalAtDestination, title: '버스 하차', description: `${busArrivalAtDestination} 버스 하차`, details: [`주행 ${route.avgRideMinutes}분 소요`] },
    { time: desiredArrivalTime, title: '도착', description: `${desiredArrivalTime} ${scenario.commute.destination} 도착`, details: [`목적지 도착 완료`] },
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

/** 환승 경로 역산 */
function calculateTransferTimeline(
  scenario: Scenario,
  route: Route,
  arrivalTimeMinutes: number,
  walkSpeed: number,
  elevatorTime: number
): CalculationResult {
  const legs = route.legs!;
  const desiredArrivalTime = scenario.commute.desiredArrivalTime;

  // 마지막 leg부터 역산
  const legResults: ReturnType<typeof calcLegBackward>[] = [];
  let cursor = arrivalTimeMinutes;

  for (let i = legs.length - 1; i >= 0; i--) {
    const calc = calcLegBackward(cursor, legs[i], walkSpeed);
    legResults.unshift(calc);
    // 다음(이전) leg의 도착 기준 = 이 leg 정류장 도착 시각 - 환승 도보
    cursor = calc.stationMin - calc.walkToMin - calc.tlTo;
  }

  // 첫 leg 기준으로 집 출발 시각
  const firstLeg = legResults[0];
  const leaveHomeMinutes = firstLeg.stationMin - firstLeg.walkToMin - firstLeg.tlTo - elevatorTime;

  const departureTime = minutesToTime(leaveHomeMinutes);
  const firstStationTime = minutesToTime(firstLeg.stationMin);

  // 전체 탑승 확률: 각 leg 확률의 곱
  const totalProb = legResults.reduce((p, lr) => p * lr.prob, 1);

  // departure details
  const departureDetails: string[] = [
    `엘리베이터 대기 ${elevatorTime}분`,
    `도보 ${firstLeg.walkToMin}분`,
    `신호등 대기 ${firstLeg.tlTo}분`,
    `환승 ${legs.length - 1}회`,
  ];

  // Build timeline
  const timeline: TimelineStep[] = [];

  // 출발
  timeline.push({
    time: departureTime,
    title: '출발',
    description: `${departureTime} 집에서 출발`,
    details: departureDetails,
  });

  // 첫 정류장 도착
  timeline.push({
    time: firstStationTime,
    title: '정류장 도착',
    description: `${firstStationTime} ${legs[0].departure} 도착`,
    details: [`${Math.round(legResults[0].prob * 100)}% 확률 탑승 안전 시각`],
  });

  // 각 leg
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const lr = legResults[i];

    // 버스 탑승
    timeline.push({
      time: minutesToTime(lr.busBoardMin),
      title: `${leg.busNumber}번 탑승`,
      description: `${minutesToTime(lr.busBoardMin)} ${leg.busNumber}번 버스 탑승`,
      details: [`${leg.departure} → ${leg.arrival}`],
    });

    // 버스 하차
    timeline.push({
      time: minutesToTime(lr.busExitMin),
      title: `${leg.busNumber}번 하차`,
      description: `${minutesToTime(lr.busExitMin)} ${leg.arrival} 하차`,
      details: [`주행 ${leg.avgRideMinutes}분 소요`],
    });

    // 환승 도보 (마지막 leg 아닐 때)
    if (i < legs.length - 1) {
      const nextLr = legResults[i + 1];
      const transferWalkMin = Math.ceil(legs[i + 1].walkToStop.distanceMeters / walkSpeed);
      const transferTime = minutesToTime(nextLr.stationMin);
      timeline.push({
        time: transferTime,
        title: '환승 정류장 도착',
        description: `${transferTime} ${legs[i + 1].departure} 도착`,
        details: [
          `환승 도보 ${transferWalkMin}분`,
          `${Math.round(nextLr.prob * 100)}% 확률 탑승 안전 시각`,
        ],
      });
    }
  }

  // 최종 도착
  timeline.push({
    time: desiredArrivalTime,
    title: '도착',
    description: `${desiredArrivalTime} ${scenario.commute.destination} 도착`,
    details: [`목적지 도착 완료`],
  });

  return {
    desiredArrivalTime,
    busArrivalTime: minutesToTime(legResults[legResults.length - 1].busExitMin),
    stationArrivalTime: firstStationTime,
    departureTime,
    busNumber: route.busNumber,
    isTransfer: true,
    transferCount: legs.length - 1,
    timeline,
    summary: {
      arrivalTime: desiredArrivalTime,
      stationArrivalTime: firstStationTime,
      stationArrivalProbability: Math.round(totalProb * 100),
      departureTime,
      departureDetails,
    },
  };
}
