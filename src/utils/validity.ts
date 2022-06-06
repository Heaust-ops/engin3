import { testDriver } from "./drivers";

export const isSelectedMesh = () =>
  window.selectedItems.length &&
  window.selectedItems.filter((x) => ["Mesh"].includes(x.type)).length;

export const isSelectedType = (...args: string[]) =>
  window.selectedItems.length &&
  window.selectedItems.filter((x) => args.includes(x.type)).length;

export const isMesh = (arg: any) =>
  arg?.type && typeof arg.type === "string" && ["Mesh"].includes(arg.type);

export const isType = (arg: any, ...args: string[]) =>
  arg?.type && typeof arg.type === "string" && args.includes(arg.type);

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
