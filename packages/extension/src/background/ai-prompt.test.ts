import { describe, it, expect } from 'vitest';
import { parseIsoDuration, buildUserPrompt } from './ai-prompt.js';

describe('parseIsoDuration', () => {
  it('parses hours + minutes', () => {
    expect(parseIsoDuration('PT1H30M')).toBe(5400);
  });

  it('parses minutes only', () => {
    expect(parseIsoDuration('PT30M')).toBe(1800);
  });

  it('parses hours only', () => {
    expect(parseIsoDuration('PT2H')).toBe(7200);
  });

  it('parses seconds only', () => {
    expect(parseIsoDuration('PT45S')).toBe(45);
  });

  it('parses full H+M+S', () => {
    expect(parseIsoDuration('PT1H15M30S')).toBe(4530);
  });

  it('returns 0 for non-string', () => {
    expect(parseIsoDuration(null)).toBe(0);
    expect(parseIsoDuration(42)).toBe(0);
  });

  it('returns 0 for unparseable string', () => {
    expect(parseIsoDuration('30 minutes')).toBe(0);
    expect(parseIsoDuration('')).toBe(0);
  });
});

describe('buildUserPrompt verified facts', () => {
  const baseExtraction = {
    url: 'https://example.com/recipe',
    title: 'Test Recipe',
    contentMarkdown: 'Mix flour and sugar.',
    language: 'en',
    schemaOrgData: null as unknown,
  };

  it('includes verified servings from recipeYield', () => {
    const extraction = {
      ...baseExtraction,
      schemaOrgData: { '@type': 'Recipe', recipeYield: '4' },
    };
    const prompt = buildUserPrompt(extraction);
    expect(prompt).toContain('Servings: 4');
    expect(prompt).toContain('Verified Facts');
  });

  it('includes verified times from ISO durations', () => {
    const extraction = {
      ...baseExtraction,
      schemaOrgData: { '@type': 'Recipe', prepTime: 'PT15M', cookTime: 'PT1H' },
    };
    const prompt = buildUserPrompt(extraction);
    expect(prompt).toContain('Prep time: 900s');
    expect(prompt).toContain('Cook time: 3600s');
  });

  it('includes ingredient count', () => {
    const extraction = {
      ...baseExtraction,
      schemaOrgData: { '@type': 'Recipe', recipeIngredient: ['flour', 'sugar', 'eggs'] },
    };
    const prompt = buildUserPrompt(extraction);
    expect(prompt).toContain('Ingredient count: 3');
  });

  it('skips verified facts section when no schema.org data', () => {
    const prompt = buildUserPrompt(baseExtraction);
    expect(prompt).not.toContain('Verified Facts');
  });

  it('skips verified facts section when schema.org has no useful fields', () => {
    const extraction = {
      ...baseExtraction,
      schemaOrgData: { '@type': 'Recipe' },
    };
    const prompt = buildUserPrompt(extraction);
    expect(prompt).not.toContain('Verified Facts');
  });
});
