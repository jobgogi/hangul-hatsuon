import type { Syllable, SyllableReading } from './types';
import { HangulDecomposer } from './hangul-decomposer';
import { LiaisonProcessor } from './liaison-processor';
import { SyllableKanaMapper } from './syllable-kana-mapper';

interface LineDecomposed {
  chars: string[];
  syllableIndices: number[];
  liaised: Syllable[];
}

/**
 * 한글 텍스트를 가타카나 발음/로마자로 변환하는 최상위 진입점.
 * 한글이 아닌 문자(공백, 문장부호 등)는 그대로 통과시킨다.
 *
 * 줄바꿈(\n, \r\n)은 연음이 적용되지 않는 경계로 취급한다 — 즉 한 줄의 끝과
 * 다음 줄의 시작은 서로 이어진 문장이 아니라고 보고, 줄 단위로 각각 분해·연음 처리한다.
 */
export class HangulToKatakanaConverter {
  static convertAll(text: string): { kana: string; romaji: string; syllables: SyllableReading[][] } {
    const lines = this.splitLines(text).map(line => this.textDecomposed(line));

    const kanaLines: string[] = [];
    const romajiLines: string[] = [];
    const syllableLines: SyllableReading[][] = [];

    for (const line of lines) {
      kanaLines.push(this.merge(line.chars, line.syllableIndices, this.convertToKana(line.liaised)));
      romajiLines.push(this.merge(line.chars, line.syllableIndices, this.convertToRomaji(line.liaised)));
      syllableLines.push(this.buildSyllableReadings(line.chars, line.syllableIndices, line.liaised));
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

  /** 한 줄의 텍스트를 문자 배열로 쪼개고, 한글 음절만 분해+연음 처리한 결과를 반환한다. */
  private static textDecomposed(line: string): LineDecomposed {
    const chars = Array.from(line);
    const decomposed = chars.map(c => HangulDecomposer.decompose(c));

    const syllableIndices: number[] = [];
    const syllables: Syllable[] = [];
    decomposed.forEach((s, i) => {
      if (s) {
        syllableIndices.push(i);
        syllables.push(s);
      }
    });

    const liaised = LiaisonProcessor.apply(syllables);
    return { chars, syllableIndices, liaised };
  }

  private static convertToKana(liaised: Syllable[]): string[] {
    return liaised.map(s => SyllableKanaMapper.toKana(s));
  }

  private static convertToRomaji(liaised: Syllable[]): string[] {
    return liaised.map((s, i) => SyllableKanaMapper.toRomaji(s, liaised[i + 1]));
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

  private static buildSyllableReadings(
    chars: string[],
    syllableIndices: number[],
    liaised: Syllable[]
  ): SyllableReading[] {
    const syllableIndexSet = new Set(syllableIndices);
    let sIdx = 0;

    return chars.map((char, i) => {
      if (!syllableIndexSet.has(i)) {
        // 한글이 아닌 문자(공백, 문장부호 등)는 그대로 통과시킨다
        return { h: char, k: char, r: char };
      }
      const syllable = liaised[sIdx];
      const next = liaised[sIdx + 1];
      sIdx++;
      return {
        h: char,
        k: SyllableKanaMapper.toKana(syllable),
        r: SyllableKanaMapper.toRomaji(syllable, next),
      };
    });
  }
}