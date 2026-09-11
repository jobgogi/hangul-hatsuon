import { describe, expect, it } from 'vitest';
import { HangulDecomposer } from './hangul-decomposer';

describe('HangulDecomposer', () => {
  it('decomposes a syllable with no batchim', () => {
    expect(HangulDecomposer.decompose('가')).toEqual({ cho: 'ㄱ', jung: 'ㅏ', jong: '' });
  });

  it('decomposes a syllable with a simple batchim', () => {
    expect(HangulDecomposer.decompose('학')).toEqual({ cho: 'ㅎ', jung: 'ㅏ', jong: 'ㄱ' });
  });

  it('decomposes a syllable with a compound batchim', () => {
    expect(HangulDecomposer.decompose('닭')).toEqual({ cho: 'ㄷ', jung: 'ㅏ', jong: 'ㄺ' });
  });

  it('returns null for non-Hangul characters', () => {
    expect(HangulDecomposer.decompose('a')).toBeNull();
    expect(HangulDecomposer.decompose(' ')).toBeNull();
    expect(HangulDecomposer.decompose('ㄱ')).toBeNull();
  });

  it('recognizes the Hangul syllable range boundaries', () => {
    expect(HangulDecomposer.isHangul('가')).toBe(true);
    expect(HangulDecomposer.isHangul('힣')).toBe(true);
    expect(HangulDecomposer.isHangul('a')).toBe(false);
    expect(HangulDecomposer.isHangul('ㄱ')).toBe(false);
  });
});
