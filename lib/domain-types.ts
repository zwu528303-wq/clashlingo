export type RoundStatus =
  | "topic_selection"
  | "confirming"
  | "countdown"
  | "exam_ready"
  | "exam_live"
  | "completed";

export type ExamQuestionType = "mcq" | "fitb" | "translation";

export interface Syllabus {
  topic?: string;
  target_lang?: string;
  can_do?: string[];
  vocabulary?: Record<string, string[]>;
  grammar?: string[];
  expressions?: string[];
  listening?: string[];
  how_tested?: string[];
}

export interface RivalryLedgerRound {
  round_id: string;
  winner_id: string | null;
  scores: Record<string, number>;
}

export interface RivalryLedger {
  wins?: Record<string, number>;
  rounds?: RivalryLedgerRound[];
  shared_weekly_time?: string;
  inactive?: boolean;
  left_by?: string | null;
  left_at?: string | null;
}

export interface Rivalry {
  id: string;
  player_a_id: string;
  player_b_id: string | null;
  invite_code: string;
  player_a_lang: string;
  player_b_lang: string | null;
  player_a_difficulty: string | null;
  player_b_difficulty: string | null;
  current_round_num: number;
  difficulty_adjustment: number | null;
  cumulative_ledger: RivalryLedger | null;
  created_at: string;
}

export interface Round {
  id: string;
  rivalry_id: string;
  round_number: number;
  target_lang: string | null;
  topic: string | null;
  study_days: number | null;
  hours_per_day: number | null;
  prize_text: string | null;
  syllabus: Syllabus | null;
  status: RoundStatus | string;
  countdown_start: string | null;
  exam_at: string | null;
  exam_started_at: string | null;
  player_a_confirmed: boolean;
  player_b_confirmed: boolean;
  player_a_exam_ready: boolean;
  player_b_exam_ready: boolean;
  created_at: string;
}

export interface ExamQuestion {
  id: number;
  type: ExamQuestionType;
  prompt: string;
  options?: string[];
}

export interface ExamRubricItem {
  id: number;
  answer: string;
  points: number;
  keywords?: string[];
}

export interface Exam {
  id: string;
  round_id: string;
  questions: ExamQuestion[];
  rubric: ExamRubricItem[];
  total_points: number;
  created_at: string;
}

export interface Submission {
  id: string;
  exam_id: string;
  user_id: string;
  answers: Record<number, string>;
  scores: Record<number, number>;
  total_score: number;
  started_at: string | null;
  submitted_at: string | null;
  feedback_difficulty: string | null;
  feedback_tags: string[] | null;
}
