import { testDriver } from "./drivers";

export const isSelectedMesh = () =>
  window.selectedItems &&
  window.selectedItems.filter((x) => ["Mesh"].includes(x.type));

export const isSelectedType = (...args: string[]) =>
  window.selectedItems &&
  window.selectedItems.filter((x) => args.includes(x.type));

export const isMesh = (arg: any) =>
  arg?.type && typeof arg.type === "string" && ["Mesh"].includes(arg.type);

export const isType = (arg: any, ...args: string[]) =>
  arg?.type && typeof arg.type === "string" && args.includes(arg.type);

export const isSyntaxOk = (arg: string) => {
  try {
    // eslint-disable-next-line no-new-func
    new Function(testDriver(arg))();
  } catch {
    return false;
  }
  return true
};
