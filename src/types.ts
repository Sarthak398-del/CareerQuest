export interface UserProfile {
  name: string;
  email: string;
  class: string;
  age: number;
  country: string;
  lang: string;
  xp: number;
  badges: string[];
  unlockedPaths: string[];
  savedCareers: string[];
  interests: string[];
  isPremium: boolean;
  mentorshipRequests: string[]; // List of mentor IDs
  mentorshipRequestTimestamps: Record<string, number>; // mentorId -> timestamp
  acceptedMentors: string[]; // List of mentor IDs that have "accepted"
  bookedSessions: { mentorId: string, date: string, time: string }[];
  hobbies: string[];
  strengths: string[];
  xpHistory: { date: string, xp: number }[];
  skillProficiency: Record<string, number>;
}

export interface Career {
  id: string;
  title: string;
  category: string;
  description: string;
  skills: string[];
  salary: string;
  scope: string;
  exams: string[];
  pathway: string[];
  responsibilities: string[];
  outlook: string;
  avgSalary?: string;
  outlookPercentage?: string;
  certifications?: string[];
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  experience: string;
  expertise: string[];
  bio: string;
  image: string;
  xp: number;
  badges: string[];
  sessionsCount: number;
  rating: number;
  profileViews: number;
}

export interface QuizQuestion {
  id: number;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options: {
    text: string;
    value: string;
    points: Record<string, number>;
  }[];
}

export interface Exam {
  id: string;
  name: string;
  category: string;
  eligibility: string;
  subjects: string[];
  pattern: string;
  difficulty: string;
  outcome: string;
  strategy: string;
  keyDates?: string;
  syllabusHighlights?: string[];
  officialWebsite?: string;
}

export interface GlobalCountry {
  id: string;
  name: string;
  flag: string;
  description: string;
  topUniversities: string[];
  requirements: string[];
  costOfLiving: string;
  visaProcess: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

export interface Review {
  id: string;
  careerId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Feedback {
  id: string;
  userId: string;
  type: 'Bug' | 'Improvement' | 'Other';
  message: string;
  createdAt: any;
}
