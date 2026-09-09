import type { Syllable } from './types';

type Row = 'none' | 'k' | 'n' | 't' | 'r' | 'm' | 'p' | 's' | 'j' | 'ch' | 'h';
type VowelBucket =
  | { type: 'plain'; base: 'a' | 'i' | 'u' | 'e' | 'o' }
  | { type: 'y'; base: 'a' | 'u' | 'o' | 'e' }
  | { type: 'w'; base: 'a' | 'i' | 'e' | 'o' };

// 초성(19) → 행(row) + 경음(된소리) 여부
// 격음(ㅋㅌㅍ)은 가나/로마자에서 평음과 구분되지 않으므로 같은 행을 공유한다 (근사치).
const CHO_TO_ROW: Record<string, { row: Row; tense: boolean }> = {
  'ㄱ': { row: 'k', tense: false }, 'ㄲ': { row: 'k', tense: true }, 'ㅋ': { row: 'k', tense: false },
  'ㄴ': { row: 'n', tense: false },
  'ㄷ': { row: 't', tense: false }, 'ㄸ': { row: 't', tense: true }, 'ㅌ': { row: 't', tense: false },
  'ㄹ': { row: 'r', tense: false },
  'ㅁ': { row: 'm', tense: false },
  'ㅂ': { row: 'p', tense: false }, 'ㅃ': { row: 'p', tense: true }, 'ㅍ': { row: 'p', tense: false },
  'ㅅ': { row: 's', tense: false }, 'ㅆ': { row: 's', tense: true },
  'ㅇ': { row: 'none', tense: false },
  'ㅈ': { row: 'j', tense: false }, 'ㅉ': { row: 'j', tense: true },
  'ㅊ': { row: 'ch', tense: false },
  'ㅎ': { row: 'h', tense: false },
};

// 중성(21) → 모음 버킷 (일본어 5모음 + 요음/합용 근사)
const JUNG_TO_BUCKET: Record<string, VowelBucket> = {
  'ㅏ': { type: 'plain', base: 'a' }, 'ㅐ': { type: 'plain', base: 'e' },
  'ㅑ': { type: 'y', base: 'a' }, 'ㅒ': { type: 'y', base: 'e' },
  'ㅓ': { type: 'plain', base: 'o' }, 'ㅔ': { type: 'plain', base: 'e' },
  'ㅕ': { type: 'y', base: 'o' }, 'ㅖ': { type: 'y', base: 'e' },
  'ㅗ': { type: 'plain', base: 'o' },
  'ㅘ': { type: 'w', base: 'a' }, 'ㅙ': { type: 'w', base: 'e' }, 'ㅚ': { type: 'w', base: 'e' },
  'ㅛ': { type: 'y', base: 'o' },
  'ㅜ': { type: 'plain', base: 'u' },
  'ㅝ': { type: 'w', base: 'o' }, 'ㅞ': { type: 'w', base: 'e' }, 'ㅟ': { type: 'w', base: 'i' },
  'ㅠ': { type: 'y', base: 'u' },
  'ㅡ': { type: 'plain', base: 'u' }, // 근사
  'ㅢ': { type: 'plain', base: 'i' }, // 근사 (한계: 문맥에 따라 ウィ가 더 자연스러운 경우도 있음)
  'ㅣ': { type: 'plain', base: 'i' },
};

// 행별 기본 5모음 가나 (a, i, u, e, o 순서)
// j, ch 행은 일본어 오십음도에 단독 항이 없어, 요음 결합형을 그대로 기본값으로 둔다.
const ROW_BASE_KANA: Record<Row, [string, string, string, string, string]> = {
  none: ['ア', 'イ', 'ウ', 'エ', 'オ'],
  k: ['カ', 'キ', 'ク', 'ケ', 'コ'],
  n: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  t: ['タ', 'ティ', 'トゥ', 'テ', 'ト'],
  r: ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  m: ['マ', 'ミ', 'ム', 'メ', 'モ'],
  p: ['パ', 'ピ', 'プ', 'ペ', 'ポ'],
  s: ['サ', 'シ', 'ス', 'セ', 'ソ'],
  j: ['ジャ', 'ジ', 'ジュ', 'ジェ', 'ジョ'],
  ch: ['チャ', 'チ', 'チュ', 'チェ', 'チョ'],
  h: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
};

// 행별 기본 5모음 로마자 (가나와 1:1 대응하는 발음 표기)
const ROW_BASE_ROMAJI: Record<Row, [string, string, string, string, string]> = {
  none: ['a', 'i', 'u', 'e', 'o'],
  k: ['ka', 'ki', 'ku', 'ke', 'ko'],
  n: ['na', 'ni', 'nu', 'ne', 'no'],
  t: ['ta', 'ti', 'tu', 'te', 'to'],
  r: ['ra', 'ri', 'ru', 're', 'ro'],
  m: ['ma', 'mi', 'mu', 'me', 'mo'],
  p: ['pa', 'pi', 'pu', 'pe', 'po'],
  s: ['sa', 'shi', 'su', 'se', 'so'],
  j: ['ja', 'ji', 'ju', 'je', 'jo'],
  ch: ['cha', 'chi', 'chu', 'che', 'cho'],
  h: ['ha', 'hi', 'fu', 'he', 'ho'],
};

const SMALL_Y_KANA: Record<'a' | 'u' | 'o' | 'e', string> = { a: 'ャ', u: 'ュ', o: 'ョ', e: 'ェ' };
const SMALL_W_KANA: Record<'a' | 'i' | 'e' | 'o', string> = { a: 'ァ', i: 'ィ', e: 'ェ', o: 'ォ' };

// 요음/합용 로마자는 "자음 + 모음"을 그대로 이어붙이면 되므로, 자음만 별도로 관리한다.
const ROW_CONSONANT_ROMAJI: Record<Row, string> = {
  none: '', k: 'k', n: 'n', t: 't', r: 'r', m: 'm', p: 'p', s: 'sh', j: 'j', ch: 'ch', h: 'h',
};

// 받침(7종성, 연음 처리 이후 남은 것) → 가나 접미사
const JONG_SUFFIX_KANA: Record<string, string> = {
  'ㄱ': 'ッ', 'ㄷ': 'ッ', 'ㅂ': 'ッ',
  'ㄴ': 'ン', 'ㅇ': 'ン',
  'ㅁ': 'ム', // ㄴ/ㅇ과 구분하여 표기 (감사합니다 → カムサハムニダ 관례)
  'ㄹ': 'ル',
};

// 받침(7종성) → 로마자 접미사
// ㄱ/ㄷ/ㅂ 받침은 촉음(っ)에 대응하며, 정확한 표기는 다음 음절 자음을 겹쳐 써야 한다
// (예: 학교→hakkyo). 이 부분은 toRomaji에서 후처리로 별도 반영한다.
const JONG_SUFFIX_ROMAJI: Record<string, string> = {
  'ㄴ': 'n', 'ㅇ': 'n',
  'ㅁ': 'm',
  'ㄹ': 'ru',
};

// 촉음(っ)으로 이어지는 받침 — 다음 음절 로마자의 첫 자음을 겹쳐 써야 하는 대상
const SOKUON_JONG = new Set(['ㄱ', 'ㄷ', 'ㅂ']);

// 비음(n, m) 앞에서의 비음화 근사: ㄱ→ng, ㄷ→n, ㅂ→m
const NASALIZED_BEFORE_NASAL: Record<string, string> = {
  'ㄱ': 'ng', 'ㄷ': 'n', 'ㅂ': 'm',
};

const VOWEL_INDEX = { a: 0, i: 1, u: 2, e: 3, o: 4 } as const;

/**
 * 연음 처리가 끝난 음절(Syllable) 하나를 가나 또는 로마자로 직접 매핑한다.
 * (문자열 치환이 아니라, 초성×중성 조합을 표에서 바로 찾는 방식)
 */
export class SyllableKanaMapper {
  /** 음절 하나를 가타카나로 변환한다. */
  static toKana(syllable: Syllable): string {
    const { row, tense } = CHO_TO_ROW[syllable.cho] ?? { row: 'none', tense: false };
    const bucket = JUNG_TO_BUCKET[syllable.jung];
    const base = ROW_BASE_KANA[row];

    let kana = this.composeKana(row, base, bucket);
    if (tense) kana = 'ッ' + kana;

    const suffix = JONG_SUFFIX_KANA[syllable.jong] ?? '';
    return kana + suffix;
  }

  /**
   * 음절 배열 전체를 로마자로 변환한다.
   * 촉음(ㄱ/ㄷ/ㅂ 받침)은 다음 음절 자음을 겹쳐 써야 하므로, 음절 단위가 아니라
   * 배열 단위로 처리한다 (예: 학교 → hak + kyo → hakkyo).
   */
  static toRomajiAll(syllables: Syllable[]): string {
    return syllables
      .map((s, i) => this.toRomaji(s, syllables[i + 1]))
      .join('');
  }

  /** 음절 하나를 로마자로 변환한다. 다음 음절(next)을 넘기면 촉음 표기를 정확히 처리한다. */
  static toRomaji(syllable: Syllable, next?: Syllable): string {
    const { row, tense } = CHO_TO_ROW[syllable.cho] ?? { row: 'none', tense: false };
    const bucket = JUNG_TO_BUCKET[syllable.jung];
    const base = ROW_BASE_ROMAJI[row];

    let romaji = this.composeRomaji(row, base, bucket);
    if (tense) romaji = romaji.charAt(0) + romaji;

    if (SOKUON_JONG.has(syllable.jong) && next) {
      const nextRow = CHO_TO_ROW[next.cho]?.row ?? 'none';
      // 비음(n, m) 앞에서는 촉음(자음 겹침) 대신 비음화 근사로 처리한다
      // (예: 합니다 → hamnita, 학년 → hangnyon)
      if (nextRow === 'n' || nextRow === 'm') {
        return romaji + NASALIZED_BEFORE_NASAL[syllable.jong];
      }
      const nextConsonant = ROW_CONSONANT_ROMAJI[nextRow];
      return romaji + (nextConsonant || 't'); // 다음이 모음(none)이면 t로 근사
    }

    const suffix = JONG_SUFFIX_ROMAJI[syllable.jong] ?? '';
    return romaji + suffix;
  }

  private static composeKana(
    row: Row,
    base: [string, string, string, string, string],
    bucket: VowelBucket
  ): string {
    // 'ㅇ' 초성(무음)일 때는 일본어에 이미 존재하는 단독 가나를 우선 사용한다.
    if (row === 'none') {
      if (bucket.type === 'y') {
        const nativeY: Record<'a' | 'u' | 'o' | 'e', string> = { a: 'ヤ', u: 'ユ', o: 'ヨ', e: 'イェ' };
        return nativeY[bucket.base];
      }
      if (bucket.type === 'w' && bucket.base === 'a') return 'ワ';
    }

    if (bucket.type === 'plain') {
      return base[VOWEL_INDEX[bucket.base]];
    }
    if (bucket.type === 'y') {
      return base[VOWEL_INDEX.i] + SMALL_Y_KANA[bucket.base];
    }
    // w
    return base[VOWEL_INDEX.u] + SMALL_W_KANA[bucket.base];
  }

  private static composeRomaji(
    row: Row,
    base: [string, string, string, string, string],
    bucket: VowelBucket
  ): string {
    if (bucket.type === 'plain') {
      return base[VOWEL_INDEX[bucket.base]];
    }

    const consonant = ROW_CONSONANT_ROMAJI[row];
    if (bucket.type === 'y') {
      const yRoman: Record<'a' | 'u' | 'o' | 'e', string> = { a: 'ya', u: 'yu', o: 'yo', e: 'ye' };
      return consonant + yRoman[bucket.base];
    }
    // w
    const wRoman: Record<'a' | 'i' | 'e' | 'o', string> = { a: 'wa', i: 'wi', e: 'we', o: 'wo' };
    return consonant + wRoman[bucket.base];
  }
}