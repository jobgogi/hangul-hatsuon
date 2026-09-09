import { useEffect, useState } from 'react';
import { HangulToKatakanaConverter } from '../lib';
import type { SyllableReading } from '../lib/types';

export function useHangulToKana() {
  const [hangul, setHangul] = useState<string>('');
  const [resultAll, setResultAll] = useState<{ kana: string; romaji: string, syllables: SyllableReading[][] } | null>(null);
  const [copyState, setCopyState] = useState<boolean>(false);
  const [voiceReady, setVoiceReady] = useState<boolean>(false);
  const [hasKo, setHasKo] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1);

  const handleClickSample = (sample: string) => {
    setHangul(sample);
  }

  const handleChangeHangul = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!e.target.value.length) {
      setResultAll(null);
    }

    setHangul(e.target.value);
  };

  const handleClickKanaCopy = () => {
    if (navigator.clipboard && resultAll !== null) {
      navigator.clipboard.writeText(resultAll?.kana);
    }

    setCopyState(true);

    setTimeout(() => {
      setCopyState(false);
    }, 1600);
  }

  const handleClickPlay = (text: string) => {
    if (typeof speechSynthesis === 'undefined' || !text.trim()) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = rate;
    const ko = speechSynthesis.getVoices().find(v => /^ko/i.test(v.lang));
    if (ko) u.voice = ko;
    speechSynthesis.speak(u);
  }

  const handleClickStop = () => {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  const handleChangeRate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value: number = Number(e.target.value);
    setRate(isNaN(value) ? 1 : value);
  }

  useEffect(() => {
    if (hangul.length > 0) {
      const convert = HangulToKatakanaConverter.convertAll(hangul);
      console.log(convert);
      setResultAll(convert);
    }
  }, [hangul]);

  useEffect(() => {
    if (typeof speechSynthesis === undefined) {
      setVoiceReady(false);
    }

    const check = () => {
      const vs = speechSynthesis.getVoices();
      if (vs.length) {
        setVoiceReady(true);
        setHasKo(() => vs.some(v => /^ko/i.test(v.lang)));
      }
    }

    check();
    speechSynthesis.onvoiceschanged = check;
  }, []);

  return {
    hangul,
    resultAll,
    copyState,
    voiceReady,
    hasKo,
    rate,
    handleClickSample,
    handleChangeHangul,
    handleClickKanaCopy,
    handleClickPlay,
    handleClickStop,
    handleChangeRate,
  };
}