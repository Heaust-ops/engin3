import { testDriver } from "./drivers";
import { selectedItems } from "./selection";

/**
 *
 * @param types The Types to check against
 * @returns Whether any of the selected items have any of the given types
 */
export const isSelectedType = (...types: string[]) =>
  selectedItems.length &&
  selectedItems.filter((x) => types.includes(x.type)).length;

/**
 * @param arg The object to the type of
 * @param types Types to check against
 * @returns Whether the given object is any of the given types
 */
export const isType = (arg: any, ...types: string[]) =>
  arg?.type && typeof arg.type === "string" && types.includes(arg.type);

/**
 * Used to test driver expression's syntax
 *
 * @param arg the expression
 * @param returnTypes the expected return type of the expression
 * @returns whether the syntax is alright
 */
export const isSyntaxOk = (
  arg: string,
  returnTypes: string[] | null = null
) => {
  try {
    // eslint-disable-next-line no-new-func
    const x = new Function(testDriver(arg))();
    if (
      returnTypes &&
      returnTypes.length &&
      // eslint-disable-next-line no-new-func
      (!returnTypes.includes(typeof x) || isNaN(x))
    )
      return false;
  } catch {
    return false;
  }
  return true;
};
