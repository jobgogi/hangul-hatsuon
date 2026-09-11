import { describe, expect, it } from 'vitest';
import { HangulToKatakanaConverter } from './hangul-to-katakana-converter';

describe('HangulToKatakanaConverter', () => {
  it('converts Hangul to katakana, applying liaison rules', () => {
    expect(HangulToKatakanaConverter.convert('안녕하세요')).toBe('アンニョンハセヨ');
    expect(HangulToKatakanaConverter.convert('감사합니다')).toBe('カムサハムニダ');
  });

  it('converts Hangul to romaji', () => {
    expect(HangulToKatakanaConverter.convert('안녕하세요', 'romaji')).toBe('annyonhaseyo');
    expect(HangulToKatakanaConverter.convert('감사합니다', 'romaji')).toBe('kamsahamnida');
  });

  it('passes non-Hangul characters (spaces, punctuation) through unchanged', () => {
    expect(HangulToKatakanaConverter.convert('한국어 공부')).toBe('ハングゴ コンブ');
  });

  it('preserves line breaks', () => {
    expect(HangulToKatakanaConverter.convert('안녕\n감사')).toBe('アンニョン\nカムサ');
  });

  it('overrides mechanical conversion with the known-word dictionary', () => {
    // 찌개: rule-based conversion would be unnatural (ッジゲ); the dictionary overrides it.
    expect(HangulToKatakanaConverter.convert('찌개')).toBe('チゲ');
    expect(HangulToKatakanaConverter.convert('찌개', 'romaji')).toBe('chige');
  });

  it('matches a known word by suffix even inside a longer word', () => {
    expect(HangulToKatakanaConverter.convert('김치찌개')).toBe('キムチチゲ');
  });

  it('overrides common Korean food words whose mechanical reading would be unnatural', () => {
    // rule-based: ットッポッキ / established: トッポッキ
    expect(HangulToKatakanaConverter.convert('떡볶이')).toBe('トッポッキ');
    // rule-based: ピビムバプ / established: ビビンバ
    expect(HangulToKatakanaConverter.convert('비빔밥')).toBe('ビビンバ');
    // rule-based: プルゴギ (voiced ゴ) / established: プルコギ
    expect(HangulToKatakanaConverter.convert('불고기')).toBe('プルコギ');
    expect(HangulToKatakanaConverter.convert('삼겹살')).toBe('サムギョプサル');
  });

  it('convertAll returns matching kana, romaji and per-syllable readings', () => {
    const result = HangulToKatakanaConverter.convertAll('학교에 갑니다');

    expect(result.kana).toBe('ハッキョエ カムニダ');
    expect(result.romaji).toBe('hakkkyoe kamnida');
    expect(result.syllables).toEqual([
      [
        { h: '학', k: 'ハッ', r: 'hak' },
        { h: '교', k: 'キョ', r: 'kkyo' },
        { h: '에', k: 'エ', r: 'e' },
        { h: ' ', k: ' ', r: ' ' },
        { h: '갑', k: 'カム', r: 'kam' },
        { h: '니', k: 'ニ', r: 'ni' },
        { h: '다', k: 'ダ', r: 'da' },
      ],
    ]);
  });

  it('collapses a known-word match into a single syllable reading chip', () => {
    const result = HangulToKatakanaConverter.convertAll('김치찌개');

    expect(result.syllables).toEqual([
      [
        { h: '김', k: 'キム', r: 'kim' },
        { h: '치', k: 'チ', r: 'chi' },
        { h: '찌개', k: 'チゲ', r: 'chige' },
      ],
    ]);
  });
});
