export type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Slider = ({ className, ...props }: SliderProps) => {
  return (
    <input
      type="range"
      className={className ? `speed-control__slider ${className}` : 'speed-control__slider'}
      {...props}
      />
  );
};
