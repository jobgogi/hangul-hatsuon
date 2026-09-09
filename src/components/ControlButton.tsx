export type ControlButtonProps = React.HTMLAttributes<HTMLButtonElement>;

export const ControlButton = ({ children, className, ...props }: ControlButtonProps) => {
  return (
    <button className={className ? `btn ${className}` : 'btn'} {...props}>
      {children}
    </button>
  );
};