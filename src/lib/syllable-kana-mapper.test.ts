import { describe, expect, it } from 'vitest';
import { SyllableKanaMapper } from './syllable-kana-mapper';
import type { Syllable } from './types';

const s = (cho: string, jung: string, jong = ''): Syllable => ({ cho, jung, jong });

describe('SyllableKanaMapper.toKana', () => {
  it('keeps a plain (voiceless) row at the start of a word', () => {
    // 조 (word-initial) -> チョ, not ジョ
    expect(SyllableKanaMapper.toKana(s('ㅈ', 'ㅗ'))).toBe('チョ');
  });

  it('voices a plain row between two vowel-ending syllables', () => {
    // 가자 -> カジャ: 자 is voiced because 가 ends in a vowel (no batchim)
    const ga = s('ㄱ', 'ㅏ');
    const ja = s('ㅈ', 'ㅑ');
    expect(SyllableKanaMapper.toKana(ja, ga)).toBe('ジャ');
  });

  it('does not voice a tense or aspirated consonant', () => {
    const ga = s('ㄱ', 'ㅏ');
    const tta = s('ㄸ', 'ㅏ');
    expect(SyllableKanaMapper.toKana(tta, ga)).toBe('ッタ');
  });

  it('appends a sokuon suffix for a mid-word ㄱ/ㄷ/ㅂ batchim', () => {
    const hak = s('ㅎ', 'ㅏ', 'ㄱ');
    const kyo = s('ㄲ', 'ㅛ');
    expect(SyllableKanaMapper.toKana(hak, undefined, kyo)).toBe('ハッ');
  });

  it('spells out a word-final ㄱ/ㄷ/ㅂ batchim instead of using a sokuon', () => {
    const hak = s('ㅎ', 'ㅏ', 'ㄱ');
    expect(SyllableKanaMapper.toKana(hak)).toBe('ハク');
  });

  it('appends ン for ㄴ/ㅇ batchim', () => {
    expect(SyllableKanaMapper.toKana(s('ㅇ', 'ㅏ', 'ㄴ'))).toBe('アン');
    expect(SyllableKanaMapper.toKana(s('ㅇ', 'ㅏ', 'ㅇ'))).toBe('アン');
  });
});

describe('SyllableKanaMapper.toRomaji', () => {
  it('romanizes a plain syllable', () => {
    expect(SyllableKanaMapper.toRomaji(s('ㄱ', 'ㅏ'))).toBe('ka');
  });

  it('voices a plain row after a vowel-ending syllable', () => {
    const ga = s('ㄱ', 'ㅏ');
    const ja = s('ㅈ', 'ㅑ');
    expect(SyllableKanaMapper.toRomaji(ja, undefined, ga)).toBe('jya');
  });

  it('approximates a nasalized ㄱ/ㄷ/ㅂ batchim before a following ㄴ/ㅁ', () => {
    // 합니다 -> ham-ni-da: ㅂ batchim before ㄴ becomes "m"
    const hap = s('ㅎ', 'ㅏ', 'ㅂ');
    const ni = s('ㄴ', 'ㅣ');
    expect(SyllableKanaMapper.toRomaji(hap, ni)).toBe('ham');
  });

  it('spells out a word-final ㄱ/ㄷ/ㅂ batchim', () => {
    expect(SyllableKanaMapper.toRomaji(s('ㅎ', 'ㅏ', 'ㄱ'))).toBe('haku');
  });
});
