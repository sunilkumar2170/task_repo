export type SourceType = "linkedin" | "instagram";
export interface Source { personId: string; sourceType: SourceType; url: string; rawText: string; extractedAt: string }
export interface Person { id: string; name: string; linkedinUrl: string; instagramUrl: string; sample?: boolean; sources: Source[] }
export interface Profile {
  name: string; profession: string; summary: string; interests: string[]; hobbies: string[]; lifestyle: string[];
  personalityTraits: string[]; relationshipNeeds: string[]; conversationTopics: string[]; values: string[];
  compatibilitySignals: string[]; dealbreakers: string[]; confidence: number;
}
export interface Turn { speaker: "A" | "B"; text: string }
export interface Dims { sharedInterests: number; valuesAlignment: number; lifestyleCompatibility: number; conversationQuality: number; complementarity: number; relationshipNeeds: number; dealbreakers: number }
export interface Match { candidateId: string; score: number; dims: Dims; reasons: string[]; strengths: string[]; concerns: string[]; conversation: Turn[] }
