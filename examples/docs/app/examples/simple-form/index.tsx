import { IsNotEmpty, Max, Min, MinLength } from "class-validator";
import {
  ParseRequestParamsReturn,
  parseRequestParams,
} from "remix-form-class-validator";
import { ActionFunction, Form, json, useActionData } from "remix";
import { Input } from "../../components/Input";
import { InputError } from "../../components/InputError";

class PersonDto {
  @IsNotEmpty()
  @MinLength(2)
  name: string;
  @Min(0)
  @Max(150)
  age: number;
}

type ActionData = ParseRequestParamsReturn<PersonDto>;

const action: ActionFunction = async ({ request }) => {
  const params = await parseRequestParams(request, PersonDto);

  if (params.errors) {
    console.log("Form data is invalid", { params });
  } else {
    console.log("Form data is valid", { params });
  }

  return json(params);
};

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

export { SimpleForm, action };
