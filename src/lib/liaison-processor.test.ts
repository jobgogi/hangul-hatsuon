import { describe, expect, it } from 'vitest';
import { HangulDecomposer } from './hangul-decomposer';
import { LiaisonProcessor } from './liaison-processor';
import type { Syllable } from './types';

function toSyllables(word: string): Syllable[] {
  return Array.from(word).map(c => HangulDecomposer.decompose(c) as Syllable);
}

function expectLiaison(input: string, expected: string) {
  expect(LiaisonProcessor.apply(toSyllables(input))).toEqual(toSyllables(expected));
}

describe('LiaisonProcessor', () => {
  it('applies 구개음화 (palatalization)', () => {
    expectLiaison('굳이', '구지');
    expectLiaison('같이', '가치');
  });

  it('applies 유음화 (lateralization)', () => {
    expectLiaison('설날', '설랄');
    expectLiaison('신라', '실라');
  });

  it('applies 유음의 비음화 (nasalization of ㄹ)', () => {
    expectLiaison('공룡', '공뇽');
    expectLiaison('종로', '종노');
  });

  it('applies 비음화 (nasalization)', () => {
    expectLiaison('국물', '궁물');
    expectLiaison('합니다', '함니다');
    expectLiaison('받는', '반는');
  });

  it('applies 거센소리화 triggered by a following ㅎ', () => {
    expectLiaison('도착하고', '도차카고');
    expectLiaison('대답하다', '대다파다');
  });

  it('applies 거센소리화 triggered by a ㅎ batchim', () => {
    expectLiaison('좋다', '조타');
    expectLiaison('놓고', '노코');
  });

  it('applies 거센소리화 for ㄶ/ㅀ batchim before a plain consonant', () => {
    expectLiaison('많다', '만타');
    expectLiaison('싫다', '실타');
  });

  it('applies ㅎ deletion before a vowel', () => {
    expectLiaison('좋아', '조아');
  });

  it('applies ㄶ/ㅀ handling before a vowel', () => {
    expectLiaison('많아', '마나');
    expectLiaison('싫어', '시러');
  });

  it('applies 된소리되기 (tensification) after ㄱ/ㄷ/ㅂ batchim', () => {
    expectLiaison('학교', '학꾜');
    expectLiaison('먹다', '먹따');
    expectLiaison('국밥', '국빱');
  });

  it('applies plain 연음 (linking) of a batchim to a following vowel', () => {
    expectLiaison('먹어', '머거');
  });

  it('splits a compound batchim across syllables before a vowel', () => {
    expectLiaison('닭이', '달기');
  });

  it('reduces a compound batchim to its representative sound before a consonant', () => {
    expectLiaison('닭도', '닥또');
  });

  it('does not move a ㅇ batchim before a vowel', () => {
    expectLiaison('강아지', '강아지');
  });
});
