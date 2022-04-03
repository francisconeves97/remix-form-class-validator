const InputError = ({ errors }: { errors: string[] | undefined }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {errors?.map((error, i) => (
        <span
          key={i}
          style={{ marginTop: "0.2rem", marginBottom: "0.2rem", color: "red" }}
        >
          {error}
        </span>
      ))}
    </div>
  );
};

export { InputError };
