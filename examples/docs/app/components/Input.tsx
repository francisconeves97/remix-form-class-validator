interface Props {
  name: string;
  label: string;
  defaultValue?: number | string;
}

const Input = ({ name, label, defaultValue }: Props) => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginTop: "1rem" }}
    >
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
};

export { Input };
