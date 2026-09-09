export type SampleTagProps = React.HTMLAttributes<HTMLButtonElement>;

export const SampleTag = ({ children, className, ...props }: SampleTagProps) => {
  return (
    <button className={className ? `sample-tag ${className}` : 'sample-tag'} {...props}>
      {children}
    </button>
  );
};