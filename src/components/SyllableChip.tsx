import type { SyllableReading } from "../lib/types";

export type SyllableChipProps = Pick<React.HTMLAttributes<HTMLButtonElement>, 'onClick'> & SyllableReading;

export const SyllableChip = (props: SyllableChipProps) => {
  return (
    <button
      type="button"
      className="syllable-chip syllable-chip:hover"
      onClick={props.onClick}
      >
      <span className="syllable-chip__hangul">{props.h}</span>
      <span className="syllable-chip__kana">{props.k}</span>
      <span className="syllable-chip__romaja">{props.r}</span>
    </button>
  );
};