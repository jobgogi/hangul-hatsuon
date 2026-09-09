import './App.css';
import { Card, ControlButton, Header, SampleTag, Slider, SyllableChip } from './components';
import { useHangulToKana } from './hooks/useHanguleToKana';

function App() {
  const SAMPLES = ['안녕하세요', '감사합니다', '한국어 공부', '김치찌개', '학교에 갑니다', '사랑해요'];

  const {
    hangul,
    resultAll,
    copyState,
    hasKo,
    voiceReady,
    rate,
    handleChangeHangul,
    handleClickSample,
    handleClickKanaCopy,
    handleClickPlay,
    handleClickStop,
    handleChangeRate,
  } = useHangulToKana();

  return (
    <div className="page">
      <Header />
      {/* 入力セクション */}
      <Card>
        <label htmlFor="hangul-input" className="input-label">ハングルを入力</label>
        <textarea id="hangul-input" className="input-textarea" rows={3} placeholder="예: 안녕하세요" value={hangul} onChange={handleChangeHangul} />
        <div className="sample-row">
          <span className="sample-row__label">例</span>
          {SAMPLES.map((sample, i) => 
            <SampleTag 
              key={i} 
              onClick={()=>{
                handleClickSample(sample)
              }}
            >
              {sample}
            </SampleTag>)}
        </div>
      </Card>
      {/* 結果セクション */}
      {resultAll && (
        <Card className="result-section">
          <div className="result-block">
            <label className="result-label">カタカナ発音</label>
            <div className="result-kana">{resultAll?.kana}</div>
          </div>
          <div className="result-block result-block--tight">
            <label className="result-label">ローマ字（発音表記）</label>
            <div className="result-romaja">{resultAll?.romaji}</div>
          </div>
          {/* TODO: WebSpeechのコントローラー部分 */}
          <div className="controls-row">
            <ControlButton 
              className="btn-primary btn-primary:hover"
              onClick={() => {
                handleClickPlay(hangul)
              }}>韓国語で再生</ControlButton>
            <ControlButton 
              className="btn-secondary btn-secondary:hover"
              onClick={handleClickStop}>
                停止
            </ControlButton>
            <ControlButton 
              className="btn-secondary btn-secondary:hover"
              onClick={handleClickKanaCopy}
              >
              {copyState ? "コピーしました" : "カタカナをコピー"}
            </ControlButton>
            <div className="speed-control">
              <span className="speed-control__label">速さ</span>
              <Slider min={0.5} max={1.3} step={0.05} value={rate} onChange={handleChangeRate} />
              <span className="speed-control__value">{rate}</span>
            </div>
          </div>
          <div className="voice-note">
            {
              !voiceReady ? 
                "このブラウザは Web Speech API に対応していません。" : 
                !hasKo ? 
                  "韓国語（ko-KR）の音声が見つかりません。OS に韓国語の音声を追加すると再生できます。" :
                  "音声は端末にインストールされた韓国語音声で再生されます。"
            }
          </div>
        </Card>
      )}
      {resultAll?.syllables.length && (
        <>
          <Card className="syllable-section">
          <label className="syllable-section__label">音節ごとの読み（クリックで再生）</label>
          {resultAll?.syllables.map((syllable, i) => (
            <div key={i} className="word-card word-card:hover">
              <div className="word-card__header">
                <span className="word-card__text">{syllable.reduce((ph, s) => (ph + s.h), '')}</span>
                <span className="word-card__kana">{syllable.reduce((pk, s) => (pk + s.k), '')}</span>
                <button
                  className="word-card__play word-card__play:hover"
                  onClick={() => {
                    const text = syllable.reduce((ph, s) => (ph + s.k), '');
                    handleClickPlay(text, 'ja-JP');
                  }}
                  >
                    再生
                </button>
              </div>
              <div className="syllable-grid">
                {syllable.map((s, i) => 
                  (
                    s.h !== ' ' ?
                    <SyllableChip 
                      key={i}
                      {...s} 
                      onClick={() => {
                        handleClickPlay(s.h);
                      }} 
                    />
                    : <div key={i} className="syllable-chip syllable-chip-blank"></div>
                  )
                )}
              </div>
            </div>
          )
        )}
          </Card>
          <p className="footnote">カタカナは近似表記です。ㅓ / ㅗ、ㅡ / ㅜ、평음 / 격음 の区別はカタカナでは表せないため、実際の音は再生音声で確認してください。</p>
        </>
      )}
    </div>
  );
}

export default App;
