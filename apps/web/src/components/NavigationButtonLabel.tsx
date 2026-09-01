import { Children, type CSSProperties, type ReactNode } from "react";

export default function NavigationButtonLabel({ children }: { children: ReactNode }) {
  const label = Children.toArray(children).join("");
  const characters = Array.from(label);

  return (
    <span aria-label={label} className="navigation-button-label">
      {["current", "next"].map((layer) => (
        <span aria-hidden="true" className={`navigation-button-label-${layer}`} key={layer}>
          {characters.map((character, index) => (
            <span
              className="navigation-button-label-character"
              key={`${character}-${index}`}
              style={{ "--character-index": index } as CSSProperties}
            >
              {character === " " ? "\u00a0" : character}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
