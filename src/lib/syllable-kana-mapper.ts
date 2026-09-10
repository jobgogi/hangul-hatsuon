import type { Syllable } from './types';

type Row =
  | 'none'
  | 'k'
  | 'g'
  | 'n'
  | 't'
  | 'd'
  | 'r'
  | 'm'
  | 'p'
  | 'b'
  | 's'
  | 'j'
  | 'ch'
  | 'h';

type VowelBucket =
  | {
      type: 'plain';
      base: 'a' | 'i' | 'u' | 'e' | 'o';
    }
  | {
      type: 'y';
      base: 'a' | 'u' | 'o' | 'e';
    }
  | {
      type: 'w';
      base: 'a' | 'i' | 'e' | 'o';
    };

// 초성(19) → 행(row) + 경음(된소리) 여부 + 격음(거센소리) 여부
//
// 중요:
// ㅈ은 기본적으로 무성에 가까운 ch 계열로 잡고,
// 유성 환경에서는 resolveVoicing()에서 j 계열로 바꾼다.
//
// 예:
// 조 → チョ
// 가자 → カジャ
const CHO_TO_ROW: Record<
  string,
  {
    row: Row;
    tense: boolean;
    aspirate: boolean;
  }
> = {
  'ㄱ': {
    row: 'k',
    tense: false,
    aspirate: false,
  },

  'ㄲ': {
    row: 'k',
    tense: true,
    aspirate: false,
  },

  'ㅋ': {
    row: 'k',
    tense: false,
    aspirate: true,
  },

  'ㄴ': {
    row: 'n',
    tense: false,
    aspirate: false,
  },

  'ㄷ': {
    row: 't',
    tense: false,
    aspirate: false,
  },

  'ㄸ': {
    row: 't',
    tense: true,
    aspirate: false,
  },

  'ㅌ': {
    row: 't',
    tense: false,
    aspirate: true,
  },

  'ㄹ': {
    row: 'r',
    tense: false,
    aspirate: false,
  },

  'ㅁ': {
    row: 'm',
    tense: false,
    aspirate: false,
  },

  'ㅂ': {
    row: 'p',
    tense: false,
    aspirate: false,
  },

  'ㅃ': {
    row: 'p',
    tense: true,
    aspirate: false,
  },

  'ㅍ': {
    row: 'p',
    tense: false,
    aspirate: true,
  },

  'ㅅ': {
    row: 's',
    tense: false,
    aspirate: false,
  },

  'ㅆ': {
    row: 's',
    tense: true,
    aspirate: false,
  },

  'ㅇ': {
    row: 'none',
    tense: false,
    aspirate: false,
  },

  // 기존 j → ch 로 변경
  'ㅈ': {
    row: 'ch',
    tense: false,
    aspirate: false,
  },

  'ㅉ': {
    row: 'j',
    tense: true,
    aspirate: false,
  },

  'ㅊ': {
    row: 'ch',
    tense: false,
    aspirate: true,
  },

  'ㅎ': {
    row: 'h',
    tense: false,
    aspirate: false,
  },
};

// 예사소리의 유성음화
//
// ㄱ → g
// ㄷ → d
// ㅂ → b
// ㅈ → j
const VOICED_ROW: Partial<Record<Row, Row>> = {
  k: 'g',
  t: 'd',
  p: 'b',
  ch: 'j',
};

// 중성(21) → 모음 버킷
const JUNG_TO_BUCKET: Record<string, VowelBucket> = {
  'ㅏ': {
    type: 'plain',
    base: 'a',
  },

  'ㅐ': {
    type: 'plain',
    base: 'e',
  },

  'ㅑ': {
    type: 'y',
    base: 'a',
  },

  'ㅒ': {
    type: 'y',
    base: 'e',
  },

  'ㅓ': {
    type: 'plain',
    base: 'o',
  },

  'ㅔ': {
    type: 'plain',
    base: 'e',
  },

  'ㅕ': {
    type: 'y',
    base: 'o',
  },

  'ㅖ': {
    type: 'y',
    base: 'e',
  },

  'ㅗ': {
    type: 'plain',
    base: 'o',
  },

  'ㅘ': {
    type: 'w',
    base: 'a',
  },

  'ㅙ': {
    type: 'w',
    base: 'e',
  },

  'ㅚ': {
    type: 'w',
    base: 'e',
  },

  'ㅛ': {
    type: 'y',
    base: 'o',
  },

  'ㅜ': {
    type: 'plain',
    base: 'u',
  },

  'ㅝ': {
    type: 'w',
    base: 'o',
  },

  'ㅞ': {
    type: 'w',
    base: 'e',
  },

  'ㅟ': {
    type: 'w',
    base: 'i',
  },

  'ㅠ': {
    type: 'y',
    base: 'u',
  },

  // 일본어 근사
  'ㅡ': {
    type: 'plain',
    base: 'u',
  },

  // 문맥에 따라 ウィ 등이 더 자연스러운 경우가 있지만
  // 현재 구조에서는 i로 근사
  'ㅢ': {
    type: 'plain',
    base: 'i',
  },

  'ㅣ': {
    type: 'plain',
    base: 'i',
  },
};

// 행별 기본 5모음 가나
// a, i, u, e, o 순서
const ROW_BASE_KANA: Record<
  Row,
  [string, string, string, string, string]
> = {
  none: ['ア', 'イ', 'ウ', 'エ', 'オ'],

  k: ['カ', 'キ', 'ク', 'ケ', 'コ'],

  g: ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],

  n: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],

  t: ['タ', 'ティ', 'トゥ', 'テ', 'ト'],

  d: ['ダ', 'ディ', 'ドゥ', 'デ', 'ド'],

  r: ['ラ', 'リ', 'ル', 'レ', 'ロ'],

  m: ['マ', 'ミ', 'ム', 'メ', 'モ'],

  p: ['パ', 'ピ', 'プ', 'ペ', 'ポ'],

  b: ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],

  s: ['サ', 'シ', 'ス', 'セ', 'ソ'],

  j: ['ジャ', 'ジ', 'ジュ', 'ジェ', 'ジョ'],

  ch: ['チャ', 'チ', 'チュ', 'チェ', 'チョ'],

  h: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
};

// 행별 기본 로마자
const ROW_BASE_ROMAJI: Record<
  Row,
  [string, string, string, string, string]
> = {
  none: ['a', 'i', 'u', 'e', 'o'],

  k: ['ka', 'ki', 'ku', 'ke', 'ko'],

  g: ['ga', 'gi', 'gu', 'ge', 'go'],

  n: ['na', 'ni', 'nu', 'ne', 'no'],

  t: ['ta', 'ti', 'tu', 'te', 'to'],

  d: ['da', 'di', 'du', 'de', 'do'],

  r: ['ra', 'ri', 'ru', 're', 'ro'],

  m: ['ma', 'mi', 'mu', 'me', 'mo'],

  p: ['pa', 'pi', 'pu', 'pe', 'po'],

  b: ['ba', 'bi', 'bu', 'be', 'bo'],

  s: ['sa', 'shi', 'su', 'se', 'so'],

  j: ['ja', 'ji', 'ju', 'je', 'jo'],

  ch: ['cha', 'chi', 'chu', 'che', 'cho'],

  h: ['ha', 'hi', 'fu', 'he', 'ho'],
};

const SMALL_Y_KANA: Record<
  'a' | 'u' | 'o' | 'e',
  string
> = {
  a: 'ャ',
  u: 'ュ',
  o: 'ョ',
  e: 'ェ',
};

const SMALL_W_KANA: Record<
  'a' | 'i' | 'e' | 'o',
  string
> = {
  a: 'ァ',
  i: 'ィ',
  e: 'ェ',
  o: 'ォ',
};

const ROW_CONSONANT_ROMAJI: Record<Row, string> = {
  none: '',
  k: 'k',
  g: 'g',
  n: 'n',
  t: 't',
  d: 'd',
  r: 'r',
  m: 'm',
  p: 'p',
  b: 'b',
  s: 'sh',
  j: 'j',
  ch: 'ch',
  h: 'h',
};

// 받침 → 가나 접미사
const JONG_SUFFIX_KANA: Record<string, string> = {
  'ㄱ': 'ッ',
  'ㄷ': 'ッ',
  'ㅂ': 'ッ',

  'ㄴ': 'ン',
  'ㅇ': 'ン',

  'ㅁ': 'ム',

  'ㄹ': 'ル',
};

// 단어 끝의 ㄱ/ㄷ/ㅂ
const JONG_WORD_FINAL_KANA: Record<string, string> = {
  'ㄱ': 'ク',
  'ㄷ': 'ト',
  'ㅂ': 'プ',
};

// 받침 → 로마자
const JONG_SUFFIX_ROMAJI: Record<string, string> = {
  'ㄴ': 'n',
  'ㅇ': 'n',

  'ㅁ': 'm',

  'ㄹ': 'ru',
};

// 단어 끝의 ㄱ/ㄷ/ㅂ
const JONG_WORD_FINAL_ROMAJI: Record<string, string> = {
  'ㄱ': 'ku',
  'ㄷ': 'to',
  'ㅂ': 'pu',
};

// 촉음으로 표현되는 받침
const SOKUON_JONG = new Set([
  'ㄱ',
  'ㄷ',
  'ㅂ',
]);

// 비음 앞 받침의 로마자 근사
const NASALIZED_BEFORE_NASAL: Record<string, string> = {
  'ㄱ': 'ng',
  'ㄷ': 'n',
  'ㅂ': 'm',
};

// 유성 환경
//
// ㄹ 추가
const VOICED_ENV_JONG = new Set([
  '',
  'ㄴ',
  'ㅁ',
  'ㅇ',
  'ㄹ',
]);

const VOWEL_INDEX = {
  a: 0,
  i: 1,
  u: 2,
  e: 3,
  o: 4,
} as const;

/**
 * 연음/음운 처리가 끝난 Syllable을
 * 가타카나 또는 로마자로 변환한다.
 */
export class SyllableKanaMapper {
  /**
   * 음절 하나 → 가타카나
   */
  static toKana(
    syllable: Syllable,
    prev?: Syllable,
    next?: Syllable
  ): string {
    const {
      row: baseRow,
      tense,
      aspirate,
    } = CHO_TO_ROW[syllable.cho] ?? {
      row: 'none',
      tense: false,
      aspirate: false,
    };

    const row = this.resolveVoicing(
      baseRow,
      tense,
      aspirate,
      prev
    );

    const bucket = JUNG_TO_BUCKET[syllable.jung];

    const base = ROW_BASE_KANA[row];

    let kana = this.composeKana(
      row,
      base,
      bucket
    );

    /**
     * 된소리
     *
     * 예:
     * 까 → ッカ
     *
     * 단, 앞 음절 받침 ㄱ/ㄷ/ㅂ이 이미
     * ッ을 출력하는 경우에는 중복하지 않는다.
     *
     * 학교:
     *
     * 학 → ハッ
     * 꾜 → キョ
     *
     * 결과:
     * ハッキョ
     *
     * 기존 문제:
     * ハッ + ッキョ
     * → ハッッキョ
     */
    const prevAlreadyHasSokuon =
      prev !== undefined &&
      SOKUON_JONG.has(prev.jong);

    if (
      tense &&
      !prevAlreadyHasSokuon
    ) {
      kana = 'ッ' + kana;
    }

    /**
     * 기존에는
     *
     * ㄹ 초성 + ㄹ 받침
     *
     * 을 장음 ー로 바꾸는 처리가 있었지만 삭제.
     *
     * 설날 → 설랄
     * 랄 → ラル
     *
     * 이 되어야 한다.
     */

    /**
     * 단어 마지막의 ㄱ/ㄷ/ㅂ 받침
     *
     * 학 → ハク
     * 밥 → パプ
     */
    if (
      !next &&
      JONG_WORD_FINAL_KANA[syllable.jong]
    ) {
      return (
        kana +
        JONG_WORD_FINAL_KANA[syllable.jong]
      );
    }

    const suffix =
      JONG_SUFFIX_KANA[syllable.jong] ?? '';

    return kana + suffix;
  }

  /**
   * 음절 배열 전체 → 로마자
   */
  static toRomajiAll(
    syllables: Syllable[]
  ): string {
    return syllables
      .map((s, i) =>
        this.toRomaji(
          s,
          syllables[i + 1],
          syllables[i - 1]
        )
      )
      .join('');
  }

  /**
   * 음절 하나 → 로마자
   */
  static toRomaji(
    syllable: Syllable,
    next?: Syllable,
    prev?: Syllable
  ): string {
    const {
      row: baseRow,
      tense,
      aspirate,
    } = CHO_TO_ROW[syllable.cho] ?? {
      row: 'none',
      tense: false,
      aspirate: false,
    };

    const row = this.resolveVoicing(
      baseRow,
      tense,
      aspirate,
      prev
    );

    const bucket =
      JUNG_TO_BUCKET[syllable.jung];

    const base =
      ROW_BASE_ROMAJI[row];

    let romaji =
      this.composeRomaji(
        row,
        base,
        bucket
      );

    /**
     * 된소리 로마자
     *
     * 기존 동작 유지
     */
    if (tense) {
      romaji =
        romaji.charAt(0) + romaji;
    }

    /**
     * 기존 코드에 있었던
     *
     * ㄹ 초성 + ㄹ 받침 → "-"
     *
     * 특수처리도 제거한다.
     *
     * 라 + ㄹ
     * → rar... 형태가 아니라
     * 아래 ㄹ 받침 suffix를 통해 처리한다.
     */

    /**
     * ㄱ/ㄷ/ㅂ 받침 + 다음 음절
     */
    if (
      SOKUON_JONG.has(syllable.jong) &&
      next
    ) {
      const nextRow =
        CHO_TO_ROW[next.cho]?.row ??
        'none';

      /**
       * 비음 앞
       *
       * 합니다 → hamnita 계열
       */
      if (
        nextRow === 'n' ||
        nextRow === 'm'
      ) {
        return (
          romaji +
          NASALIZED_BEFORE_NASAL[
            syllable.jong
          ]
        );
      }

      const nextConsonant =
        ROW_CONSONANT_ROMAJI[nextRow];

      return (
        romaji +
        (nextConsonant || 't')
      );
    }

    /**
     * 단어 마지막 ㄱ/ㄷ/ㅂ
     */
    if (
      !next &&
      JONG_WORD_FINAL_ROMAJI[
        syllable.jong
      ]
    ) {
      return (
        romaji +
        JONG_WORD_FINAL_ROMAJI[
          syllable.jong
        ]
      );
    }

    const suffix =
      JONG_SUFFIX_ROMAJI[
        syllable.jong
      ] ?? '';

    return romaji + suffix;
  }

  /**
   * 유성음화
   *
   * 어두:
   * 조 → チョ
   *
   * 유성 환경:
   * 가자 → カジャ
   */
  private static resolveVoicing(
    row: Row,
    tense: boolean,
    aspirate: boolean,
    prev?: Syllable
  ): Row {
    // 된소리 / 거센소리는 유성음화하지 않는다.
    if (
      tense ||
      aspirate
    ) {
      return row;
    }

    const voiced =
      VOICED_ROW[row];

    if (!voiced) {
      return row;
    }

    // 단어 처음
    if (!prev) {
      return row;
    }

    // 앞 음절이 유성 환경인지 확인
    if (
      !VOICED_ENV_JONG.has(prev.jong)
    ) {
      return row;
    }

    return voiced;
  }

  /**
   * Row + 모음 버킷 → 가나
   */
  private static composeKana(
    row: Row,
    base: [
      string,
      string,
      string,
      string,
      string,
    ],
    bucket: VowelBucket
  ): string {
    /**
     * ㅇ 초성
     */
    if (row === 'none') {
      if (bucket.type === 'y') {
        const nativeY: Record<
          'a' | 'u' | 'o' | 'e',
          string
        > = {
          a: 'ヤ',
          u: 'ユ',
          o: 'ヨ',
          e: 'イェ',
        };

        return nativeY[bucket.base];
      }

      if (
        bucket.type === 'w' &&
        bucket.base === 'a'
      ) {
        return 'ワ';
      }
    }

    /**
     * 일반 모음
     */
    if (bucket.type === 'plain') {
      return base[
        VOWEL_INDEX[bucket.base]
      ];
    }

    /**
     * 야/여/요/유 계열
     */
    if (bucket.type === 'y') {
      return (
        base[VOWEL_INDEX.i] +
        SMALL_Y_KANA[bucket.base]
      );
    }

    /**
     * 와/워/웨/위 계열
     */
    return (
      base[VOWEL_INDEX.u] +
      SMALL_W_KANA[bucket.base]
    );
  }

  /**
   * Row + 모음 버킷 → 로마자
   */
  private static composeRomaji(
    row: Row,
    base: [
      string,
      string,
      string,
      string,
      string,
    ],
    bucket: VowelBucket
  ): string {
    if (
      bucket.type === 'plain'
    ) {
      return base[
        VOWEL_INDEX[bucket.base]
      ];
    }

    const consonant =
      ROW_CONSONANT_ROMAJI[row];

    if (bucket.type === 'y') {
      const yRoman: Record<
        'a' | 'u' | 'o' | 'e',
        string
      > = {
        a: 'ya',
        u: 'yu',
        o: 'yo',
        e: 'ye',
      };

      return (
        consonant +
        yRoman[bucket.base]
      );
    }

    const wRoman: Record<
      'a' | 'i' | 'e' | 'o',
      string
    > = {
      a: 'wa',
      i: 'wi',
      e: 'we',
      o: 'wo',
    };

    return (
      consonant +
      wRoman[bucket.base]
    );
  }
}