export type Grade = {
  id: number;
  name: string;
  multiplier: number;
  multLabel: string;
  count: number;
  ink: string;
  fill: string;
};

export const GRADES: Grade[] = [
  { id: 0, name: "Skim", multiplier: 1.0, multLabel: "1.0\u00d7", count: 1111, ink: "#5A3A22", fill: "#E8DCC0" },
  { id: 1, name: "2% Milk", multiplier: 1.25, multLabel: "1.25\u00d7", count: 622, ink: "#1E4FB8", fill: "#C9D8F5" },
  { id: 2, name: "Whole", multiplier: 1.6, multLabel: "1.6\u00d7", count: 311, ink: "#6E4326", fill: "#F4E7C2" },
  { id: 3, name: "Extra Heavy", multiplier: 2.2, multLabel: "2.2\u00d7", count: 133, ink: "#FFFCF3", fill: "#6E4326" },
  { id: 4, name: "Golden", multiplier: 3.5, multLabel: "3.5\u00d7", count: 34, ink: "#2A180C", fill: "#E2B63A" },
  { id: 5, name: "Sacred", multiplier: 5.0, multLabel: "5.0\u00d7", count: 11, ink: "#FFFCF3", fill: "#2F6DE0" },
];

export function gradeById(id: number): Grade {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

/** Always the full name. Never shorten "2% Milk" to "2%". */
export function gradeName(id: number): string {
  return gradeById(id).name;
}

export const GRADE_TOTAL = GRADES.reduce((sum, g) => sum + g.count, 0);
