import { FunctionComponent, useEffect, useState } from "react";
import { ViewportEventType } from "../../enums";
import { commitTransaction, startTransaction } from "../../utils/transactions";
import NumericReactiveInput from "../NumericReactiveInput/NumericReactiveInput";

interface TransformPropertyMenuProps {
  isHidden: boolean;
  property: "position" | "rotation" | "scale";
}

const getTransformEventType = (property: "position" | "rotation" | "scale") => {
  switch (property) {
    case "position":
      return ViewportEventType.grab;
    case "rotation":
      return ViewportEventType.rotate;
    case "scale":
      return ViewportEventType.scale;
  }
};

let selectedItemInterval: NodeJS.Timer | null = null;

const TransformPropertyMenu: FunctionComponent<TransformPropertyMenuProps> = ({
  isHidden,
  property,
}) => {
  const [selectedItem, setselectedItem] = useState<THREE.Object3D | null>(null);
  useEffect(() => {
    if (!isHidden)
      selectedItemInterval = setInterval(
        () => setselectedItem(window.selectedItems[0]),
        40
      );
    return () => {
      if (selectedItemInterval) clearInterval(selectedItemInterval);
    };
  }, [isHidden]);

  return (
    <>
      <h3
        style={isHidden ? { width: 0, pointerEvents: "none", opacity: 0 } : {}}
      >
        X:
      </h3>
      <NumericReactiveInput
        property={`${property}.x`}
        style={{
          ...(isHidden
            ? { width: 0, pointerEvents: "none", opacity: 0 }
            : { width: "20rem" }),
        }}
        setter={(arg, asTransaction: boolean) => {
          if (selectedItem) {
            if (asTransaction)
              startTransaction(getTransformEventType(property));
            selectedItem[property].x = arg;
            if (asTransaction) commitTransaction();
          }
        }}
        getter={() => {
          if (selectedItem) return selectedItem[property].x;
          return 0;
        }}
        toUpdate={!isHidden}
        objectId={selectedItem ? selectedItem.id : -1}
      />

      <h3
        style={isHidden ? { width: 0, pointerEvents: "none", opacity: 0 } : {}}
      >
        Y:
      </h3>
      <NumericReactiveInput
        property={`${property}.y`}
        style={{
          ...(isHidden
            ? { width: 0, pointerEvents: "none", opacity: 0 }
            : { width: "20rem" }),
        }}
        setter={(arg, asTransaction: boolean) => {
          if (selectedItem) {
            if (asTransaction)
              startTransaction(getTransformEventType(property));
            selectedItem[property].y = arg;
            if (asTransaction) commitTransaction();
          }
        }}
        getter={() => {
          if (selectedItem) return selectedItem[property].y;
          return 0;
        }}
        toUpdate={!isHidden}
        objectId={selectedItem ? selectedItem.id : -1}
      />

      <h3
        style={isHidden ? { width: 0, pointerEvents: "none", opacity: 0 } : {}}
      >
        Z:
      </h3>
      <NumericReactiveInput
        property={`${property}.z`}
        style={{
          ...(isHidden
            ? { width: 0, pointerEvents: "none", opacity: 0 }
            : { width: "20rem" }),
        }}
        setter={(arg, asTransaction: boolean) => {
          if (selectedItem) {
            if (asTransaction)
              startTransaction(getTransformEventType(property));
            selectedItem[property].z = arg;
            if (asTransaction) commitTransaction();
          }
        }}
        getter={() => {
          if (selectedItem) return selectedItem[property].z;
          return 0;
        }}
        toUpdate={!isHidden}
        objectId={selectedItem ? selectedItem.id : -1}
      />
    </>
  );
};

export default TransformPropertyMenu;
