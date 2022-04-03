# Remix form class-validator

Simple helper to parse [Remix](https://github.com/remix-run/remix/) `FormData` and validate them using `class-validator`.

## Features

- Server-side `FormData` **parsing and validation** using `class-validator`
- Provides **typesafe** access to parsed parameters and validation errors
- Support for arrays and nested attributes

## Usage

Start by defining the DTO class that will hold your parameters, and the respective validations using `class-validator`:

```tsx
class PersonDto {
  @IsNotEmpty()
  @MinLength(2)
  name: string;
  @Min(0)
  @Max(150)
  age: number;
}
```

Declare the route action and use `parseRequestParams` to parse and validate your parameters into your declared DTO:

```tsx
const action: ActionFunction = async ({ request }) => {
  const params = await parseRequestParams(request, PersonDto);

  if (params.errors) {
    console.log("Form data is invalid", { errors: params.errors });
  } else {
    console.log("Form data is valid", { data: params.data });
  }

  return json(params);
};
```

Finally you just need to declare your form and use `useActionData` to access any errors resulting from validating your DTO.

```tsx
type ActionData = ParseRequestParamsReturn<PersonDto>;

const SimpleForm = () => {
  const actionData = useActionData<ActionData>();

  return (
    <Form style={{ maxWidth: 400 }} method="post">
      <Input name="name" label="Name:" defaultValue={actionData?.data.name} />
      <InputError errors={actionData?.errors?.name} />
      <Input name="age" label="Age:" defaultValue={actionData?.data.age} />
      <InputError errors={actionData?.errors?.age} />
      <button type="submit" style={{ marginTop: "1rem" }}>
        Submit
      </button>
    </Form>
  );
};
```

## Installation

To install simply run the following command:

```bash
$ npm install --save remix-form-class-validator
```

Because this library uses `class-transformer` [you will need to import](https://github.com/typestack/class-transformer#installation) the `reflect-metadata` shim.
On your `entry.server.tsx` file add the following import statement to import `reflect-metadata`:

```typescript
// entry.server.tsx
import "reflect-metadata";
```

### Configure Typescript

Because `class-validator` relies on annotations to perform validations, you should add the following to your `tsconfig.json`:

```js
{
  // ...
  "compilerOptions": {
    // ...
    "strictPropertyInitialization": false,
    "experimentalDecorators": true
    // ...
  }
  // ...
}
```

## Examples

You can check some example apps on the [examples](./examples) folder.
