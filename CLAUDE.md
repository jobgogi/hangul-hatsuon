# CLAUDE.md

## 絶対守るべき名ないもの

* 答えは韓国語でする。
* ドキュメントの作成は日本語にする。

## このプロジェクトの概要

このプロジェクトはハングルを読みにくい日本人を手伝うサービスです。
そのサービスの特徴は以下となります。

### サービスの特徴

1. ハングルで作成になっていた文章をカタカナおよびRomajiで発音を変換してみせる。
2. TTSの機能を利用して、韓国語で読める。
3. また、音節に分けて各、音節別のカタカナ発音表記させ、明確に認識しやすくする。
4. TTSの機能を利用して、カタカナの発音表記通り、読める。

## 開発コマンド

- `npm run dev` — 開発サーバー起動（Vite）
- `npm run build` — 型チェック（`tsc -b`）後にビルド（`vite build`）
- `npm run lint` — プロジェクト全体をESLintでチェック
- `npm run preview` — 本番ビルドをプレビュー
- `npm run deploy` — ビルド後、`gh-pages`で`dist/`を`deploy`ブランチに公開
- `npm test` — Vitestで`src/lib/`のユニットテストを実行（`npx vitest run <path>`で単一ファイルのみ実行可能）

`src/lib/`配下の変換ロジックを変更したら、対応する`*.test.ts`を更新して`npm test`を通すこと。UI（`App.tsx`/コンポーネント/フック）にはテストが無いため、動作確認は開発サーバーで行う。

## アーキテクチャ

変換パイプラインは `src/lib/` に集約されており、UIに依存しません。唯一の利用者は `src/hooks/useHanguleToKana.ts` で、コンポーネントの状態に接続しています。パイプラインの流れ（`src/lib/hangul-to-katakana-converter.ts` の `HangulToKatakanaConverter.convert` / `convertAll` を参照）:

1. **行に分割**し、各行内で **「run」（連続したハングル音節の塊）に分割** する。空白や句読点で途切れずに連続する最大区間が1つのrunとなる。連音・有声音化などの規則は必ずrun内でのみ適用され、単語境界をまたがない。
2. **`HangulDecomposer`**（`hangul-decomposer.ts`）— Unicodeコードポイント演算により、各ハングル音節文字を初声/中声/終声（`Syllable { cho, jung, jong }`）に分解する。
3. **`LiaisonProcessor`**（`liaison-processor.ts`）— run内の`Syllable[]`を音節ごとに直接書き換えながら、固定された優先順位で韓国語の音韻規則を適用する（口蓋音化 → 流音化 → 鼻音化 → 激音化 → ㅎ脱落 → 겹받침（重終声）分離 → 連音 → 語末終声代表音化）。各ルールブロックは条件に一致すると`continue`するため **順序が重要** で、後続の`if`ブロックは前のルールがまだ一致していないことを前提にしている。新しいルールを追加する際はメソッド全体を読んで正しい優先順位の位置に挿入すること（末尾に追加するだけでは不十分）。
4. **`SyllableKanaMapper`**（`syllable-kana-mapper.ts`）— 連音処理後の`Syllable`をカタカナまたはローマ字にマッピングする。基本的に音節単位だが、`prev`/`next`を参照して有声音化（平音の有声音化、例：母音間のㄱ→g）や終声の接尾辞規則（促音ッ、ん、など）を判定する。ファイル冒頭の行/母音バケットのテーブルがカタカナ・ローマ字マッピングの正としての情報源であり、compose系メソッドに特殊分岐を追加するより、これらのテーブルを拡張すること。
5. **既知語の例外処理**（`known-words.ts`、`HangulToKatakanaConverter.collectKnownWordMatches`で適用）— 規則通りに変換すると不自然になる外来語・複合語のための接尾一致による上書き辞書（例：찌개→規則通りなら「ッジゲ」だが、実際は「チゲ」として定着している）。マッチしたrunは音節ごとではなく1つの読みチップにまとめて統合される。
6. ハングル以外の文字（空白、句読点）はそのまま通過し、`merge`で結果に戻し込まれる。

`convertAll`はさらに`syllables: SyllableReading[][]`（行ごとの配列）を返す。これは音節ごとにクリック可能な内訳UI（`App.tsx`内の`SyllableChip`）の描画に使われる。既知語にマッチした箇所は複数音節が1つの`SyllableReading`にまとめられる。

### UI層

`App.tsx`がページ全体で、`src/components/`には小さな表示用コンポーネント（`Card`、`Header`、`ControlButton`、`SampleTag`、`Slider`、`SyllableChip`）があり、`src/components/index.tsx`からまとめてエクスポートされている。`useHangulToKana`（`src/hooks/useHanguleToKana.ts`）が状態をすべて管理する：入力テキスト、変換結果、クリップボードコピー状態、Web Speech API（`speechSynthesis`）による再生（韓国語`ko-KR`は文章全体、日本語`ja-JP`は音節/単語単位のカタカナ）、および再生速度。

### 新しい音韻規則・語彙の追加方法

- 新しい連音・同化規則 → `LiaisonProcessor.apply`を編集し、正しい優先順位の位置に`if`ブロックを挿入する（既存のルール順序はファイル内の番号付きコメントを参照）。必ずしも末尾ではない。
- 新しいカナ・ローマ字マッピングの特殊ケース → `syllable-kana-mapper.ts`内の`CHO_TO_ROW` / `JUNG_TO_BUCKET` / `ROW_BASE_*`テーブルを拡張することを優先し、`composeKana`/`composeRomaji`内で分岐を増やさない。
- 新しい固定表記・外来語の発音 → `known-words.ts`の`KNOWN_WORDS`に接尾一致のエントリを追加する。マッチングは長いキー優先で、runの末尾に対してのみ判定される。
