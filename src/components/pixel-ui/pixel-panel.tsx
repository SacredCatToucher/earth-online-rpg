import type { HTMLAttributes, ReactNode } from "react";

type PixelPanelProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  children: ReactNode;
};

export function PixelPanel({ title, children, className = "", ...props }: PixelPanelProps) {
  return (
    <section className={`pixel-panel ${className}`} {...props}>
      {title ? <h2 className="panel-title">{title}</h2> : null}
      {children}
    </section>
  );
}
