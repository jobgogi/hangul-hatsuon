export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <section className={className ? `card ${className}` : 'card'} {...props}>
      {children}
    </section>
  );
};