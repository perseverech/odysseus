export type AiRouteLength = "short" | "long";

export type AiRouteRequest = {
  country: string;
  lengths: AiRouteLength[];
  interests?: string[];
  budget?: "budget" | "moderate" | "premium";
  startDate?: string;
};

export type AiRouteStop = {
  name: string;
  description: string;
  latitude?: number;
  longitude?: number;
};

export type AiRouteRecommendation = {
  id: string;
  length: AiRouteLength;
  title: string;
  summary: string;
  durationDays: number;
  stops: AiRouteStop[];
};

export type GenerateAiRoutes = (
  request: AiRouteRequest
) => Promise<AiRouteRecommendation[]>;
