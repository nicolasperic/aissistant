export type CertLevel = "professional" | "expert" | "master";

export interface CertSection {
  name: string;
  percentage: number;
  topics: string[];
}

export interface CertDefinition {
  /** Stable ID used for DB records, e.g. "ad0-e722" */
  id: string;
  /** Exam code, e.g. "AD0-E722" */
  code: string;
  /** Human-readable name */
  name: string;
  /** Provider key matching the provider folder, e.g. "adobe-commerce" */
  provider: string;
  level: CertLevel;
  description: string;
  sections: CertSection[];
  exam: {
    totalQuestions: number;
    /** Number of correct answers needed to pass */
    passingScore: number;
    timeLimitMinutes: number;
  };
  /** Whether this cert is currently active (not retired) */
  active: boolean;
  studyResources?: {
    officialGuide?: string;
    practiceExam?: string;
  };
}

export interface ProviderDefinition {
  /** Unique key, matches folder name, e.g. "adobe-commerce" */
  id: string;
  name: string;
  website?: string;
  certifications: CertDefinition[];
}
