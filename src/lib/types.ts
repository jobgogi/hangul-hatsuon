/** 한글 음절 하나를 초성/중성/종성으로 분해한 결과 */
export interface Syllable {
  cho: string;
  jung: string;
  /** 받침. 없으면 빈 문자열 */
  jong: string;
}

export interface SyllableReading {
  h: string; // 원문 음절
  k: string; // 가타카나
  r: string; // 로마자
}