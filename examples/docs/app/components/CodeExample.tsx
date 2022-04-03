import { Children, FC } from "react";

const CodeExample: FC = ({ children }) => {
  if (Children.count(children) !== 2) throw new Error("Need example and code");
  const [example, code] = Children.toArray(children);

  return (
    <div>
      {example}
      {code}
    </div>
  );
};

export { CodeExample };
