export type Coordinates = { x: number; y: number; z: number };

export type TagEvidence = {
  image_id: string;
  sweep_index: number;
  face_index: number;
  box: { left: number; top: number; right: number; bottom: number };
};

export type ExtractedText = {
  text: string;
  confidence: number;
  evidence_image_id: string;
};

export type AssetContext = {
  model: string;
  inference: "precomputed";
  official_labels: ExtractedText[];
  inspection_markings: ExtractedText[];
  field_notes: ExtractedText[];
};

export type AssetTag = {
  id: string;
  asset_type: string;
  label: string;
  source: "model" | "manual";
  status: "detected" | "reviewed";
  confidence: number;
  position: Coordinates;
  observation_count: number;
  sweep_count: number;
  spatial_spread: number;
  evidence: TagEvidence[];
  context?: AssetContext | null;
};
