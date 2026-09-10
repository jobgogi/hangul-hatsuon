import type { Syllable } from './types';

// 겹받침: [현재 음절에 남는 자음, 다음 음절 초성으로 넘어가는 자음]
const COMPOUND_JONG_SPLIT: Record<string, [string, string]> = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

// ㅎ으로 끝나는 겹받침
// 모음 앞에서는 ㅎ이 탈락하고 남은 자음이 다음 초성으로 이동
const H_COMPOUND_MOVE: Record<string, string> = {
  'ㄶ': 'ㄴ',
  'ㅀ': 'ㄹ',
};

// 받침 대표음 (7종성)
const JONG_REPRESENTATIVE: Record<string, string> = {
  'ㄲ': 'ㄱ',
  'ㅋ': 'ㄱ',
  'ㄳ': 'ㄱ',
  'ㄺ': 'ㄱ',

  'ㅅ': 'ㄷ',
  'ㅆ': 'ㄷ',
  'ㅈ': 'ㄷ',
  'ㅊ': 'ㄷ',
  'ㅌ': 'ㄷ',
  'ㅎ': 'ㄷ',

  'ㄵ': 'ㄴ',
  'ㄶ': 'ㄴ',

  'ㄼ': 'ㄹ',
  'ㄽ': 'ㄹ',
  'ㄾ': 'ㄹ',
  'ㅀ': 'ㄹ',

  'ㄻ': 'ㅁ',

  'ㅍ': 'ㅂ',
  'ㄿ': 'ㅂ',
  'ㅄ': 'ㅂ',
};

// 비음화
// ㄱ 계열 → ㅇ
// ㄷ 계열 → ㄴ
// ㅂ 계열 → ㅁ
const NASALIZATION_JONG: Record<string, string> = {
  'ㄱ': 'ㅇ',
  'ㄷ': 'ㄴ',
  'ㅂ': 'ㅁ',
};

// 된소리되기
const TENSIFICATION_CHO: Record<string, string> = {
  'ㄱ': 'ㄲ',
  'ㄷ': 'ㄸ',
  'ㅂ': 'ㅃ',
  'ㅅ': 'ㅆ',
  'ㅈ': 'ㅉ',
};

// ㅎ + 평음 → 거센소리
const ASPIRATION_CHO: Record<string, string> = {
  'ㄱ': 'ㅋ',
  'ㄷ': 'ㅌ',
  'ㅂ': 'ㅍ',
  'ㅈ': 'ㅊ',
};

export class LiaisonProcessor {
  static apply(syllables: Syllable[]): Syllable[] {
    const result = syllables.map(s => ({ ...s }));

    for (let i = 0; i < result.length; i++) {
      const cur = result[i];

      if (!cur.jong) continue;

      const next = result[i + 1];

      const isNextVowelStart =
        next !== undefined && next.cho === 'ㅇ';

      /**
       * 1. 구개음화
       *
       * ㄷ + 이 → 지
       * ㅌ + 이 → 치
       *
       * 예:
       * 굳이 → 구지
       * 같이 → 가치
       */
      if (
        next &&
        next.cho === 'ㅇ' &&
        next.jung === 'ㅣ'
      ) {
        if (cur.jong === 'ㄷ') {
          cur.jong = '';
          next.cho = 'ㅈ';
          continue;
        }

        if (cur.jong === 'ㅌ') {
          cur.jong = '';
          next.cho = 'ㅊ';
          continue;
        }
      }

      /**
       * 2. 유음화
       *
       * ㄹ + ㄴ → ㄹ + ㄹ
       *
       * 설날 → 설랄
       */
      if (
        next &&
        cur.jong === 'ㄹ' &&
        next.cho === 'ㄴ'
      ) {
        next.cho = 'ㄹ';
        continue;
      }

      /**
       * ㄴ + ㄹ → ㄹ + ㄹ
       *
       * 신라 → 실라
       */
      if (
        next &&
        cur.jong === 'ㄴ' &&
        next.cho === 'ㄹ'
      ) {
        cur.jong = 'ㄹ';
        continue;
      }

      /**
       * 3. 유음의 비음화
       *
       * ㅁ/ㅇ + ㄹ → ㅁ/ㅇ + ㄴ
       *
       * 공룡 → 공뇽
       * 종로 → 종노
       */
      if (
        next &&
        next.cho === 'ㄹ' &&
        (cur.jong === 'ㅁ' || cur.jong === 'ㅇ')
      ) {
        next.cho = 'ㄴ';
        continue;
      }

      /**
       * 4. 비음화
       *
       * ㄱ/ㄷ/ㅂ 계열 받침 + ㄴ/ㅁ
       *
       * 국물 → 궁물
       * 합니다 → 함니다
       * 받는 → 반는
       */
      if (
        next &&
        (next.cho === 'ㄴ' || next.cho === 'ㅁ')
      ) {
        const representative =
          this.getRepresentative(cur.jong) ?? cur.jong;

        const nasalized =
          NASALIZATION_JONG[representative];

        if (nasalized) {
          cur.jong = nasalized;
          continue;
        }
      }

      /**
       * 받침 + ㅎ 거센소리화
       *
       * ㄱ + ㅎ → ㅋ
       * ㄷ + ㅎ → ㅌ
       * ㅂ + ㅎ → ㅍ
       * ㅈ + ㅎ → ㅊ
       *
       * 도착하고 → 도차카고
       * 대답하다 → 대다파다
       */
      if (next && next.cho === 'ㅎ') {
        const representative =
          this.getRepresentative(cur.jong) ?? cur.jong;

        const aspirated =
          ASPIRATION_CHO[representative];

        if (aspirated) {
          cur.jong = '';
          next.cho = aspirated;
          continue;
        }
      }

      /**
       * 5. ㅎ에 의한 거센소리화
       *
       * ㅎ + ㄱ → ㅋ
       * ㅎ + ㄷ → ㅌ
       * ㅎ + ㅂ → ㅍ
       * ㅎ + ㅈ → ㅊ
       *
       * 좋다 → 조타
       * 놓고 → 노코
       */
      if (next && cur.jong === 'ㅎ') {
        const aspirated = ASPIRATION_CHO[next.cho];

        if (aspirated) {
          cur.jong = '';
          next.cho = aspirated;
          continue;
        }
      }

      /**
       * ㄶ / ㅀ + 평음
       *
       * 많다 → 만타
       * 싫다 → 실타
       */
      if (
        next &&
        (cur.jong === 'ㄶ' || cur.jong === 'ㅀ')
      ) {
        const aspirated = ASPIRATION_CHO[next.cho];

        if (aspirated) {
          cur.jong =
            cur.jong === 'ㄶ' ? 'ㄴ' : 'ㄹ';

          next.cho = aspirated;

          continue;
        }
      }

      /**
       * 6. ㅎ 탈락
       *
       * ㅎ 받침 + 모음
       *
       * 좋아 → 조아
       */
      if (
        cur.jong === 'ㅎ' &&
        isNextVowelStart
      ) {
        cur.jong = '';
        continue;
      }

      /**
       * ㄶ / ㅀ + 모음
       *
       * 많아 → 마나
       * 싫어 → 시러
       */
      const hMove = H_COMPOUND_MOVE[cur.jong];

      if (hMove) {
        if (isNextVowelStart) {
          cur.jong = '';
          next!.cho = hMove;
        } else {
          cur.jong =
            this.getRepresentative(cur.jong) ?? hMove;
        }

        continue;
      }

      /**
       * 7. 된소리되기
       *
       * ㄱ/ㄷ/ㅂ 받침 뒤 평음
       *
       * 학교 → 학꾜
       * 먹다 → 먹따
       * 국밥 → 국빱
       *
       * 여기서는 next.cho만 변경하고 continue하지 않는다.
       * 아래에서 현재 받침 처리도 계속 해야 하기 때문.
       */
      if (next) {
        const representative =
          this.getRepresentative(cur.jong) ?? cur.jong;

        if (
          representative === 'ㄱ' ||
          representative === 'ㄷ' ||
          representative === 'ㅂ'
        ) {
          const tense =
            TENSIFICATION_CHO[next.cho];

          if (tense) {
            next.cho = tense;
          }
        }
      }

      /**
       * 8. 겹받침
       */
      const split =
        this.splitCompoundJong(cur.jong);

      if (split) {
        const [stay, moved] = split;

        if (isNextVowelStart) {
          cur.jong = stay;
          next!.cho = moved;
        } else {
          cur.jong =
            this.getRepresentative(cur.jong) ?? stay;
        }

        continue;
      }

      /**
       * 받침 ㅇ은 모음 앞에서도 이동하지 않는다.
       *
       * 강아지 → 강아지
       * 중앙에 → 중앙에
       */
      if (
        cur.jong === 'ㅇ' &&
        isNextVowelStart
      ) {
        continue;
      }

      /**
       * 9. 일반 연음
       *
       * 받침 + ㅇ 초성
       *
       * 먹어 → 머거
       */
      if (isNextVowelStart) {
        next!.cho = cur.jong;
        cur.jong = '';
        continue;
      }

      /**
       * 10. 자음 앞 / 어말
       *
       * 받침을 대표음으로 축약
       */
      const representative =
        this.getRepresentative(cur.jong);

      if (representative) {
        cur.jong = representative;
      }
    }

    return result;
  }

  private static splitCompoundJong(
    jong: string
  ): [string, string] | null {
    return COMPOUND_JONG_SPLIT[jong] ?? null;
  }

  private static getRepresentative(
    jong: string
  ): string | null {
    return JONG_REPRESENTATIVE[jong] ?? null;
  }
}