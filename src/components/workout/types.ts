export interface WorkoutRow {
  id: number;
  part: string;
  name: string;
  reps: string;
  sets: string;
  restTime: string;
}

export interface SavedWorkout {
  id: number;
  date: Date;
  part: string;
  workoutName: string;
  reps: number;
  sets: number;
  restTime: string;
}

export const emptyRow = (): WorkoutRow => ({
  id: Date.now() + Math.random(),
  part: "",
  name: "",
  reps: "",
  sets: "",
  restTime: "",
});
