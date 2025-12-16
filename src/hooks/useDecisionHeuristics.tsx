import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ItemToScore, 
  DecisionResult, 
  FinalClassification,
  calculateTotalScore,
  classifyByScore,
} from '@/lib/aiDecisionHeuristics';

interface UseDecisionHeuristicsReturn {
  scoreItem: (item: ItemToScore) => Promise<DecisionResult | null>;
  scoreBatch: (items: ItemToScore[]) => Promise<Map<string, DecisionResult>>;
  isScoring: boolean;
  lastResult: DecisionResult | null;
}

export const useDecisionHeuristics = (): UseDecisionHeuristicsReturn => {
  const [isScoring, setIsScoring] = useState(false);
  const [lastResult, setLastResult] = useState<DecisionResult | null>(null);

  const scoreItem = useCallback(async (item: ItemToScore): Promise<DecisionResult | null> => {
    setIsScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-decision-heuristics', {
        body: { item },
      });

      if (error) {
        console.error('Decision scoring error:', error);
        return null;
      }

      setLastResult(data);
      return data as DecisionResult;
    } catch (err) {
      console.error('Failed to score item:', err);
      return null;
    } finally {
      setIsScoring(false);
    }
  }, []);

  const scoreBatch = useCallback(async (items: ItemToScore[]): Promise<Map<string, DecisionResult>> => {
    const results = new Map<string, DecisionResult>();
    
    // Score items in parallel (max 5 at a time)
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const promises = batch.map(async (item) => {
        const result = await scoreItem(item);
        if (result) {
          results.set(item.id, result);
        }
      });
      await Promise.all(promises);
    }

    return results;
  }, [scoreItem]);

  return {
    scoreItem,
    scoreBatch,
    isScoring,
    lastResult,
  };
};

// Utility to filter items by classification
export function filterByClassification(
  items: ItemToScore[],
  results: Map<string, DecisionResult>,
  classification: FinalClassification
): ItemToScore[] {
  return items.filter(item => {
    const result = results.get(item.id);
    return result?.classification === classification;
  });
}

// Get only "Act Now" items - what surfaces in Driver Mode
export function getActNowItems(
  items: ItemToScore[],
  results: Map<string, DecisionResult>
): ItemToScore[] {
  return filterByClassification(items, results, 'act_now');
}

// Get items that would break something if ignored
export function getCriticalItems(
  items: ItemToScore[],
  results: Map<string, DecisionResult>
): ItemToScore[] {
  return items.filter(item => {
    const result = results.get(item.id);
    return result?.breaksSomething === true;
  });
}
