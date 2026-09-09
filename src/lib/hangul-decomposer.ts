import type { Syllable } from './types';

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] as const;
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'] as const;
// index 0 = 받침 없음
const JONG = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] as const;

/** 한글 문자를 초성/중성/종성으로 분해한다. */
export class HangulDecomposer {
  static decompose(char: string): Syllable | null {
    const code = char.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return null;
    const choIdx = Math.floor(code / (21 * 28));
    const jungIdx = Math.floor((code % (21 * 28)) / 28);
    const jongIdx = code % 28;
    return { cho: CHO[choIdx], jung: JUNG[jungIdx], jong: JONG[jongIdx] };
  }

  static isHangul(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 0xac00 && code <= 0xd7a3;
  }
}
