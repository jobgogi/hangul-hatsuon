import type { Syllable } from './types';
import { HangulDecomposer } from './hangul-decomposer';
import { LiaisonProcessor } from './liaison-processor';
import { SyllableKanaMapper } from './syllable-kana-mapper';
import { KNOWN_WORDS } from './known-words';

export interface SyllableReading {
  h: string; // 원문 (예외 사전에 걸린 경우 여러 글자가 합쳐질 수 있음)
  k: string; // 가타카나
  r: string; // 로마자
}

interface RunRange {
  /** liaised/syllableIndices 배열 기준, 이 단어(run)의 시작 인덱스(포함) */
  start: number;
  /** 이 단어(run)의 끝 인덱스(포함) */
  end: number;
}

interface KnownWordMatch {
  /** liaised 배열 기준 시작 인덱스(포함) */
  start: number;
  /** liaised 배열 기준 끝 인덱스(포함) */
  end: number;
  override: { kana: string; romaji: string };
}

interface LineDecomposed {
  chars: string[];
  syllableIndices: number[];
  liaised: Syllable[];
  /** liaised[i]가 자신이 속한 "단어(연속된 한글 덩어리)"의 첫 음절인가 */
  isRunStart: boolean[];
  /** liaised[i]가 자신이 속한 "단어"의 마지막 음절인가 */
  isRunEnd: boolean[];
  /** 줄 안에 등장하는 단어(run)들의 범위 목록 */
  runRanges: RunRange[];
}

// 예외 사전을 접미 매칭에 쓰기 편하도록, 긴 것부터 정렬해둔다.
const KNOWN_WORD_ENTRIES = Object.entries(KNOWN_WORDS).sort(
  (a, b) => Array.from(b[0]).length - Array.from(a[0]).length
);

/**
 * 한글 텍스트를 가타카나 발음/로마자로 변환하는 최상위 진입점.
 * 한글이 아닌 문자(공백, 문장부호, 줄바꿈 등)는 그대로 통과시킨다.
 *
 * 연음(連音)·유성음화·어말 받침 보정은 모두 "연속된 한글 덩어리(단어)" 안에서만 적용된다.
 * 또한 이미 굳어진 외래어(예: 찌개→チゲ)는 음운 규칙 대신 예외 사전을 우선 적용하며,
 * 이 경우 음절별 표시(syllables)에서도 해당 구간을 하나의 칩으로 합쳐서 반환한다.
 */
export class HangulToKatakanaConverter {
  static convert(text: string, options: 'kana' | 'romaji' = 'kana'): string {
    const lines = this.splitLines(text).map(line => this.textDecomposed(line));

    const convertedLines = lines.map(line => {
      const matches = this.collectKnownWordMatches(line);
      const converted =
        options === 'kana'
          ? this.convertToKana(line, matches)
          : this.convertToRomaji(line, matches);
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
      const matches = this.collectKnownWordMatches(line);
      const kanaArr = this.convertToKana(line, matches);
      const romajiArr = this.convertToRomaji(line, matches);

      kanaLines.push(this.merge(line.chars, line.syllableIndices, kanaArr));
      romajiLines.push(this.merge(line.chars, line.syllableIndices, romajiArr));
      syllableLines.push(this.buildSyllableReadings(line, matches, kanaArr, romajiArr));
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
    const runRanges: RunRange[] = [];

    let runStart = 0;
    for (let k = 1; k <= syllableIndices.length; k++) {
      // 원문 문자 인덱스가 연속되지 않으면(중간에 공백/문장부호가 있으면) 여기서 단어가 끊긴다.
      const isBoundary = k === syllableIndices.length || syllableIndices[k] !== syllableIndices[k - 1] + 1;
      if (isBoundary) {
        const run = rawSyllables.slice(runStart, k);
        const liaisedRun = LiaisonProcessor.apply(run);

        const rangeStart = liaised.length;
        liaisedRun.forEach((s, idx) => {
          liaised.push(s);
          isRunStart.push(idx === 0);
          isRunEnd.push(idx === liaisedRun.length - 1);
        });
        runRanges.push({ start: rangeStart, end: liaised.length - 1 });

        runStart = k;
      }
    }

    return { chars, syllableIndices, liaised, isRunStart, isRunEnd, runRanges };
  }

  /** 단어(run)의 원문 한글 텍스트를 복원한다. */
  private static runText(line: LineDecomposed, range: RunRange): string {
    const startChar = line.syllableIndices[range.start];
    const endChar = line.syllableIndices[range.end];
    return line.chars.slice(startChar, endChar + 1).join('');
  }

  /** 줄 전체에서 예외 사전에 걸리는 모든 구간을 찾는다 (한 단어당 최대 1개, 접미 매칭). */
  private static collectKnownWordMatches(line: LineDecomposed): KnownWordMatch[] {
    const matches: KnownWordMatch[] = [];
    for (const range of line.runRanges) {
      const text = this.runText(line, range);
      for (const [key, override] of KNOWN_WORD_ENTRIES) {
        if (text.endsWith(key)) {
          const keyLen = Array.from(key).length;
          matches.push({ start: range.end - keyLen + 1, end: range.end, override });
          break; // 이 단어(run)는 가장 긴 매치 하나만 적용
        }
      }
    }
    return matches;
  }

  private static findMatch(matches: KnownWordMatch[], liaisedIndex: number): KnownWordMatch | undefined {
    return matches.find(m => liaisedIndex >= m.start && liaisedIndex <= m.end);
  }

  private static convertToKana(line: LineDecomposed, matches: KnownWordMatch[]): string[] {
    const result = line.liaised.map((s, i) => {
      const prev = line.isRunStart[i] ? undefined : line.liaised[i - 1];
      const next = line.isRunEnd[i] ? undefined : line.liaised[i + 1];
      return SyllableKanaMapper.toKana(s, prev, next);
    });

    this.overwriteWithMatches(result, matches, m => m.override.kana);
    return result;
  }

  private static convertToRomaji(line: LineDecomposed, matches: KnownWordMatch[]): string[] {
    const result = line.liaised.map((s, i) => {
      const prev = line.isRunStart[i] ? undefined : line.liaised[i - 1];
      const next = line.isRunEnd[i] ? undefined : line.liaised[i + 1];
      return SyllableKanaMapper.toRomaji(s, next, prev);
    });

    this.overwriteWithMatches(result, matches, m => m.override.romaji);
    return result;
  }

  private static overwriteWithMatches(
    converted: string[],
    matches: KnownWordMatch[],
    pick: (m: KnownWordMatch) => string
  ): void {
    for (const match of matches) {
      for (let i = match.start; i < match.end; i++) {
        converted[i] = '';
      }
      converted[match.end] = pick(match);
    }
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

  /**
   * 음절별 상세 정보를 만든다. 예외 사전에 걸린 구간은 여러 음절을 하나의 칩으로 합친다.
   * (예: 찌개 → { h: '찌개', k: 'チゲ' } 하나로, { h: '찌', k: '' }/{ h: '개', k: 'チゲ' }로 쪼개지 않음)
   */
  private static buildSyllableReadings(
    line: LineDecomposed,
    matches: KnownWordMatch[],
    kanaArr: string[],
    romajiArr: string[]
  ): SyllableReading[] {
    const syllableIndexSet = new Set(line.syllableIndices);
    const readings: SyllableReading[] = [];

    let sIdx = 0;
    let i = 0;
    while (i < line.chars.length) {
      if (!syllableIndexSet.has(i)) {
        readings.push({ h: line.chars[i], k: line.chars[i], r: line.chars[i] });
        i++;
        continue;
      }

      const match = this.findMatch(matches, sIdx);
      if (match) {
        const startChar = line.syllableIndices[match.start];
        const endChar = line.syllableIndices[match.end];
        readings.push({
          h: line.chars.slice(startChar, endChar + 1).join(''),
          k: match.override.kana,
          r: match.override.romaji,
        });
        sIdx = match.end + 1;
        i = endChar + 1;
        continue;
      }

      readings.push({ h: line.chars[i], k: kanaArr[sIdx], r: romajiArr[sIdx] });
      sIdx++;
      i++;
    }

    return readings;
  }
}