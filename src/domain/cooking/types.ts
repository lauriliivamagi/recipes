export interface TimerState {
  opId: string;
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
}

export interface StepPosition {
  current: number;
  total: number;
}
