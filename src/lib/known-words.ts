/**
 * 이미 일본어권에 정착된 관용 표기(외래어)를 담은 예외 사전.
 * 음운 규칙을 기계적으로 적용하면 부자연스러운 결과가 나오는 단어들을 여기서 덮어쓴다.
 * (예: 찌개 → 규칙대로면 "ッジゲ"이지만, 실제로는 "チゲ"로 굳어져 있음)
 *
 * key는 한글 원문(단어 전체 또는 접미 부분), 단어의 "끝부분"과 일치하면 적용된다.
 * (예: "김치찌개"도 "찌개"로 끝나므로 뒷부분만 덮어쓰기 대상이 된다)
 */
export const KNOWN_WORDS: Record<string, { kana: string; romaji: string }> = {
  '찌개': { kana: 'チゲ', romaji: 'chige' },
  '짜장면': { kana: 'チャジャンミョン', romaji: 'chajanmyon' },
  '김치': { kana: 'キムチ', romaji: 'kimuchi' },
  '떡볶이': { kana: 'トッポッキ', romaji: 'toppokki' },
  '비빔밥': { kana: 'ビビンバ', romaji: 'bibinba' },
  '불고기': { kana: 'プルコギ', romaji: 'purukogi' },
  '김밥': { kana: 'キンパ', romaji: 'kinpa' },
  '삼계탕': { kana: 'サムゲタン', romaji: 'samugetan' },
  '잡채': { kana: 'チャプチェ', romaji: 'chapuche' },
  '삼겹살': { kana: 'サムギョプサル', romaji: 'samugyopusaru' },
};