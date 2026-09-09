import type { Syllable } from './types';
import { HangulDecomposer } from './hangul-decomposer';
import { LiaisonProcessor } from './liaison-processor';
import { SyllableKanaMapper } from './syllable-kana-mapper';

export interface SyllableReading {
  h: string; // 원문 음절
  k: string; // 가타카나
  r: string; // 로마자
}

interface LineDecomposed {
  chars: string[];
  syllableIndices: number[];
  liaised: Syllable[];
  /** liaised[i]가 자신이 속한 "단어(연속된 한글 덩어리)"의 첫 음절인가 */
  isRunStart: boolean[];
  /** liaised[i]가 자신이 속한 "단어"의 마지막 음절인가 */
  isRunEnd: boolean[];
}

/**
 * 한글 텍스트를 가타카나 발음/로마자로 변환하는 최상위 진입점.
 * 한글이 아닌 문자(공백, 문장부호, 줄바꿈 등)는 그대로 통과시킨다.
 *
 * 연음(連音)·유성음화·어말 받침 보정은 모두 "연속된 한글 덩어리(단어)" 안에서만 적용된다.
 * 공백·문장부호·줄바꿈으로 끊긴 다음 단어까지 이어지지 않는다.
 */
export class HangulToKatakanaConverter {
  static convert(text: string, options: 'kana' | 'romaji' = 'kana'): string {
    const lines = this.splitLines(text).map(line => this.textDecomposed(line));

    const convertedLines = lines.map(line => {
      const converted =
        options === 'kana' ? this.convertToKana(line) : this.convertToRomaji(line);
      return this.merge(line.chars, line.syllableIndices, converted);
    });

    return convertedLines.join('\n');
  }

  static convertAll(text: string): { kana: string; romaji: string; syllables: SyllableReading[][] } {
    const lines = this.splitLines(text).map(line => this.textDecomposed(line));

    const kanaLines: string[] = [];
    const romajiLines: string[] = [];
    const syllableLines: SyllableReading[][] = [];

    for (const line of lines) {
      kanaLines.push(this.merge(line.chars, line.syllableIndices, this.convertToKana(line)));
      romajiLines.push(this.merge(line.chars, line.syllableIndices, this.convertToRomaji(line)));
      syllableLines.push(this.buildSyllableReadings(line));
    }

    return {
      kana: kanaLines.join('\n'),
      romaji: romajiLines.join('\n'),
      syllables: syllableLines,
    };
  }

  /** \n, \r\n, \r 를 모두 줄바꿈으로 인식해 줄 단위로 나눈다. */
  private static splitLines(text: string): string[] {
    return text.split(/\r\n|\r|\n/);
  }

  /**
   * 한 줄의 텍스트를 문자 배열로 쪼개고, 한글 음절만 분해한다.
   * 연음은 "줄 안에서 공백·문장부호로 끊기지 않고 연속된 한글 구간(단어)" 단위로만 적용한다.
   */
  private static textDecomposed(line: string): LineDecomposed {
    const chars = Array.from(line);
    const decomposedPerChar = chars.map(c => HangulDecomposer.decompose(c));

    const syllableIndices: number[] = [];
    const rawSyllables: Syllable[] = [];
    decomposedPerChar.forEach((s, i) => {
      if (s) {
        syllableIndices.push(i);
        rawSyllables.push(s);
      }
    });

    const liaised: Syllable[] = [];
    const isRunStart: boolean[] = [];
    const isRunEnd: boolean[] = [];

    let runStart = 0;
    for (let k = 1; k <= syllableIndices.length; k++) {
      // 원문 문자 인덱스가 연속되지 않으면(중간에 공백/문장부호가 있으면) 여기서 단어가 끊긴다.
      const isBoundary = k === syllableIndices.length || syllableIndices[k] !== syllableIndices[k - 1] + 1;
      if (isBoundary) {
        const run = rawSyllables.slice(runStart, k);
        const liaisedRun = LiaisonProcessor.apply(run);
        liaisedRun.forEach((s, idx) => {
          liaised.push(s);
          isRunStart.push(idx === 0);
          isRunEnd.push(idx === liaisedRun.length - 1);
        });
        runStart = k;
      }
    }

    return { chars, syllableIndices, liaised, isRunStart, isRunEnd };
  }

  private static convertToKana(line: LineDecomposed): string[] {
    return line.liaised.map((s, i) => {
      const prev = line.isRunStart[i] ? undefined : line.liaised[i - 1];
      const next = line.isRunEnd[i] ? undefined : line.liaised[i + 1];
      return SyllableKanaMapper.toKana(s, prev, next);
    });
  }

  private static convertToRomaji(line: LineDecomposed): string[] {
    return line.liaised.map((s, i) => {
      const prev = line.isRunStart[i] ? undefined : line.liaised[i - 1];
      const next = line.isRunEnd[i] ? undefined : line.liaised[i + 1];
      return SyllableKanaMapper.toRomaji(s, next, prev);
    });
  }

  /** 변환된 음절 리스트를 원래 문자열의 한글 아닌 부분(공백, 문장부호 등)과 합친다. */
  private static merge(chars: string[], syllableIndices: number[], converted: string[]): string {
    let result = '';
    let sIdx = 0;
    for (let i = 0; i < chars.length; i++) {
      if (syllableIndices.includes(i)) {
        result += converted[sIdx];
        sIdx++;
      } else {
        result += chars[i];
      }
    }
    return result;
  }

  private static buildSyllableReadings(line: LineDecomposed): SyllableReading[] {
    const syllableIndexSet = new Set(line.syllableIndices);
    let sIdx = 0;

    return line.chars.map((char, i) => {
      if (!syllableIndexSet.has(i)) {
        return { h: char, k: char, r: char };
      }
      const syllable = line.liaised[sIdx];
      const prev = line.isRunStart[sIdx] ? undefined : line.liaised[sIdx - 1];
      const next = line.isRunEnd[sIdx] ? undefined : line.liaised[sIdx + 1];
      sIdx++;
      return {
        h: char,
        k: SyllableKanaMapper.toKana(syllable, prev, next),
        r: SyllableKanaMapper.toRomaji(syllable, next, prev),
      };
    });
  }
}