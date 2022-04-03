import { validate, ValidationError, ValidatorOptions } from "class-validator";
import { ClassTransformOptions, plainToInstance } from "class-transformer";
import qs from "qs";

// eslint-disable-next-line
type ConstructorOf<C> = { new (...args: any[]): C };

type Primitive = string | number | boolean | null | undefined;

type Errors<T> = T extends Primitive
  ? string[]
  : {
      [K in keyof T]: T[K] extends (infer U)[]
        ? Errors<U>[] | undefined
        : Errors<T[K]> | undefined;
    };

type ParseRequestParamsReturn<T> =
  | {
      data: T;
      errors: undefined;
    }
  | {
      errors: Errors<T>;
      data: Partial<T>;
    };

interface ParseRequestParamsOptions {
  qsParseOptions?: qs.IParseOptions;
  plainToInstanceOptions?: ClassTransformOptions;
  validatorOptions?: ValidatorOptions;
}

function mapClassValidatorError<T>(
  error: ValidationError
): Errors<T> | undefined {
  const fieldErrors: Errors<T> = {} as Errors<T>;
  if (error.constraints) {
    const errorMessages = Object.values(error.constraints);
    return errorMessages as Errors<T>;
  }

  if (error.children) {
    error.children.forEach((childError) => {
      // @ts-expect-error TODO: fix this type
      fieldErrors[childError.property] = mapClassValidatorError(childError);
      return fieldErrors;
    });
  }

  return fieldErrors;
}

function mapClassValidatorErrors<T>(errors: ValidationError[]) {
  const fieldErrorsMap = {} as Errors<T>;

  errors.forEach((error) => {
    // @ts-expect-error TODO: fix this type
    fieldErrorsMap[error.property as keyof T] = mapClassValidatorError(error);
  });

  return fieldErrorsMap;
}

async function parseRequestParams<T>(
  request: Request,
  ParamsClass: ConstructorOf<T>,
  options?: ParseRequestParamsOptions
): Promise<ParseRequestParamsReturn<T>> {
  const text = await request.text();

  const object = qs.parse(text, {
    decoder(str, decoder, charset) {
      const strWithoutPlus = str.replace(/\+/g, " ");
      if (charset === "iso-8859-1") {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
      }

      if (/^[+-]?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str);
      }

      const keywords = {
        true: true,
        false: false,
        null: null,
        undefined,
      };
      if (str in keywords) {
        const key = str as keyof typeof keywords;
        return keywords[key];
      }

      // utf-8
      try {
        return decodeURIComponent(strWithoutPlus);
      } catch (e) {
        return strWithoutPlus;
      }
    },
    ...options?.qsParseOptions,
  });
  const instance = plainToInstance(
    ParamsClass,
    object,
    options?.plainToInstanceOptions
  );

  const validationErrors = await validate(
    instance as unknown as object,
    options?.validatorOptions
  );
  if (validationErrors.length === 0) {
    return {
      data: instance,
      errors: undefined,
    };
  }

  return {
    data: instance,
    errors: mapClassValidatorErrors(validationErrors),
  };
}

export type { ParseRequestParamsReturn };
export { parseRequestParams };
