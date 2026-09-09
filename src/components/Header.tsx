export const Header = () => {
  return (
    <header className="header">
      <div className="header__eyebrow">Hangul → Katakana</div>
      <h1 className="header__title">ハングルの発音をカタカナで</h1>
      <p className="header__desc">ハングルを入力すると、発音変化（連音・鼻音化・濃音化）を反映したカタカナ読みを表示します。音声は Web Speech API の韓国語音声で再生します。</p>
    </header>
  );
};