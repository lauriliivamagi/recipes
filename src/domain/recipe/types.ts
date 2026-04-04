export interface RecipeMeta {
  title: string;
  slug: string;
  language: string;
  source?: string;
  originalText: string;
  tags: string[];
  servings: number;
  totalTime: { relaxed: number; optimized: number };
  difficulty: 'easy' | 'medium' | 'hard';
  notes?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  group: string;
}

export interface Equipment {
  id: string;
  name: string;
  count: number;
}

export interface OperationEquipment {
  use: string;
  release: boolean;
}

export interface Operation {
  id: string;
  type: 'prep' | 'cook';
  action: string;
  inputs: string[];
  equipment?: OperationEquipment;
  time: number;
  activeTime: number;
  scalable?: boolean;
  heat?: string;
  details?: string;
  output?: string;
}

export interface SubProduct {
  id: string;
  name: string;
  finalOp: string;
}

export interface FinishStep {
  action: string;
  inputs: string[];
  details?: string;
}

export interface Recipe {
  meta: RecipeMeta;
  ingredients: Ingredient[];
  equipment: Equipment[];
  operations: Operation[];
  subProducts: SubProduct[];
  finishSteps: FinishStep[];
}
