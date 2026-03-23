export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Novel {
  id: string;
  userId: string;
  title: string;
  description: string;
  volumes: Volume[];
  characters: Character[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date | null;
}

export interface Volume {
  id: string;
  novelId: string;
  title: string;
  order: number;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  volumeId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  gender?: string;
  age?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldState {
  id: string;
  novelId: string;
  category: WorldCategory;
  name: string;
  description: string;
  attributes: Record<string, string>;
  relatedCharacters: string[];
  relatedChapters: string[];
  statusHistory: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
}

export type WorldCategory = 
  | 'geography'
  | 'politics'
  | 'magic'
  | 'culture'
  | 'economy'
  | 'history'
  | 'other';

export interface StatusChange {
  changedAt: Date;
  oldStatus: string;
  newStatus: string;
  note: string;
}

export interface ResourceLedger {
  id: string;
  novelId: string;
  resourceType: string;
  totalInflow: number;
  totalOutflow: number;
  currentBalance: number;
  transactions: ResourceTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceTransaction {
  id: string;
  resourceId: string;
  amount: number;
  sourceType: 'character' | 'location' | 'event' | 'other';
  sourceId: string;
  targetType: 'character' | 'location' | 'event' | 'other';
  targetId: string;
  chapterId: string;
  note: string;
  transactionAt: Date;
  createdAt: Date;
}

export interface UnresolvedPlot {
  id: string;
  novelId: string;
  content: string;
  buriedChapterId: string;
  expectedResolveChapterId?: string;
  actualResolveChapterId?: string;
  status: PlotStatus;
  relatedCharacterIds: string[];
  resolveDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PlotStatus = 'buried' | 'resolved' | 'invalidated';

export interface ChapterSummary {
  id: string;
  chapterId: string;
  coreEvents: string;
  appearingCharacters: string[];
  plotFlags: string[];
  emotionalTone: EmotionalType;
  customNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EmotionalType = 
  | 'thrill'
  | 'anticipation'
  | 'adoration'
  | 'couple_vibe'
  | 'relief'
  | 'sweetness'
  | 'touching'
  | 'achievement'
  | 'relaxation'
  | 'anger'
  | 'suppressed'
  | 'depression'
  | 'hatred'
  | 'anxiety'
  | 'nervousness'
  | 'worry'
  | 'suffering'
  | 'awkwardness';

export const POSITIVE_EMOTIONS: EmotionalType[] = [
  'thrill', 'anticipation', 'adoration', 'couple_vibe', 
  'relief', 'sweetness', 'touching', 'achievement', 'relaxation'
];

export const NEGATIVE_EMOTIONS: EmotionalType[] = [
  'anger', 'suppressed', 'depression', 'hatred', 
  'anxiety', 'nervousness', 'worry', 'suffering', 'awkwardness'
];

export interface SidequestProgress {
  id: string;
  novelId: string;
  title: string;
  description: string;
  progress: number;
  status: QuestStatus;
  relatedChapterIds: string[];
  relatedPlotIds: string[];
  progressHistory: ProgressChange[];
  createdAt: Date;
  updatedAt: Date;
}

export type QuestStatus = 'in_progress' | 'completed' | 'abandoned';

export interface ProgressChange {
  changedAt: Date;
  oldProgress: number;
  newProgress: number;
  note: string;
}

export interface EmotionalArc {
  id: string;
  novelId: string;
  name: string;
  targetType: 'novel' | 'character';
  targetId?: string;
  points: EmotionalPoint[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmotionalPoint {
  id: string;
  arcId: string;
  chapterId: string;
  emotion: EmotionalType;
  intensity: number;
  note: string;
  createdAt: Date;
}

export interface CharacterInteraction {
  id: string;
  novelId: string;
  characterAId: string;
  characterBId: string;
  relationshipType: RelationshipType;
  events: InteractionEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export type RelationshipType = 
  | 'family'
  | 'friendship'
  | 'romance'
  | 'enmity'
  | 'stranger'
  | 'other';

export interface InteractionEvent {
  id: string;
  interactionId: string;
  eventType: string;
  chapterId: string;
  description: string;
  createdAt: Date;
}
