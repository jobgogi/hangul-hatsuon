import type { Syllable } from './types';

// 겹받침: [현재 음절에 남는 자음, 다음 음절 초성으로 넘어가는 자음]
const COMPOUND_JONG_SPLIT: Record<string, [string, string]> = {
  'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

// ㅎ으로 끝나는 겹받침(ㄶ, ㅀ)은 모음 앞에서 ㅎ이 탈락하고, 남은 자음(ㄴ/ㄹ)이 그대로 다음 음절 초성으로 넘어간다.
// (예: 많아→[마나], 싫어→[시러] — ㅎ 소리 자체가 생기지 않는다)
const H_COMPOUND_MOVE: Record<string, string> = {
  'ㄶ': 'ㄴ', 'ㅀ': 'ㄹ',
};

// 받침의 대표음 (뒤에 자음이 오거나 어말일 때 실제 발음되는 소리, 7종성 규칙)
const JONG_REPRESENTATIVE: Record<string, string> = {
  'ㄲ': 'ㄱ', 'ㅋ': 'ㄱ', 'ㄳ': 'ㄱ', 'ㄺ': 'ㄱ',
  'ㅅ': 'ㄷ', 'ㅆ': 'ㄷ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅎ': 'ㄷ',
  'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ',
  'ㄼ': 'ㄹ', 'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㅀ': 'ㄹ',
  'ㄻ': 'ㅁ',
  'ㅍ': 'ㅂ', 'ㄿ': 'ㅂ', 'ㅄ': 'ㅂ',
};

/**
 * 음절 배열에 연음(連音) 규칙을 적용한다.
 * - 받침이 있는 음절 뒤에 초성 'ㅇ'(무음)으로 시작하는 음절이 오면, 받침이 다음 음절의 초성으로 넘어간다.
 * - 겹받침은 대표음 하나가 남고, 나머지 하나가 다음 음절 초성으로 넘어간다.
 * - 뒤에 자음이 오거나 문장이 끝나면 대표음(7종성)으로 축약된다.
 */
export class LiaisonProcessor {
  static apply(syllables: Syllable[]): Syllable[] {
    const result = syllables.map(s => ({ ...s }));

    for (let i = 0; i < result.length; i++) {
      const cur = result[i];
      if (!cur.jong) continue;

      const next = result[i + 1];
      const isNextVowelStart = next !== undefined && next.cho === 'ㅇ';

      // ㄹ받침 뒤에 오는 ㄴ초성: ㄴ이 ㄹ로 동화된다 (유음화의 반대 방향). 예: 설날→[설랄]
      if (next !== undefined && next.cho === 'ㄴ' && cur.jong === 'ㄹ') {
        next.cho = 'ㄹ';
        continue;
      }

      // ㄴ받침 뒤에 오는 ㄹ초성: ㄴ이 ㄹ로 동화된다 (유음화). 예: 신라→[실라]
      if (next !== undefined && next.cho === 'ㄹ' && cur.jong === 'ㄴ') {
        cur.jong = 'ㄹ';
        continue;
      }

      // ㅁ/ㅇ받침 뒤에 오는 ㄹ초성: ㄹ이 ㄴ으로 바뀐다 (유음의 비음화).
      // 예: 공룡→[공뇽], 종로→[종노], 대통령→[대통녕]. 받침 자체는 그대로 유지된다.
      if (next !== undefined && next.cho === 'ㄹ' && (cur.jong === 'ㅁ' || cur.jong === 'ㅇ')) {
        next.cho = 'ㄴ';
        continue;
      }

      // ㅎ 받침: 모음 앞에서는 다음 초성으로 이동하지 않고 그냥 탈락한다.
      if (cur.jong === 'ㅎ' && isNextVowelStart) {
        cur.jong = '';
        continue;
      }

      // ㅎ으로 끝나는 겹받침(ㄶ, ㅀ): 모음 앞에서 ㅎ은 탈락하고 남은 자음만 다음 초성으로 넘어간다.
      const hMove = H_COMPOUND_MOVE[cur.jong];
      if (hMove) {
        if (isNextVowelStart) {
          cur.jong = '';
          next.cho = hMove;
        } else {
          cur.jong = this.getRepresentative(cur.jong) ?? hMove;
        }
        continue;
      }

      const split = this.splitCompoundJong(cur.jong);
      if (split) {
        const [stay, moved] = split;
        if (isNextVowelStart) {
          cur.jong = stay;
          next.cho = moved;
        } else {
          cur.jong = this.getRepresentative(cur.jong) ?? stay;
        }
        continue;
      }

      if (isNextVowelStart) {
        next.cho = cur.jong;
        cur.jong = '';
      } else {
        const rep = this.getRepresentative(cur.jong);
        if (rep) cur.jong = rep;
      }
    }

    return result;
  }

  private static splitCompoundJong(jong: string): [string, string] | null {
    return COMPOUND_JONG_SPLIT[jong] ?? null;
  }

  private static getRepresentative(jong: string): string | null {
    return JONG_REPRESENTATIVE[jong] ?? null;
  }
}