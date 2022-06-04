import { FunctionComponent } from "react";
import { ViewportEventType } from "../../enums";
import { commitTransaction, startTransaction } from "../../utils/transactions";
import NumericSliderInput from "../NumericSliderInput/NumericSliderInput";

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

const TransformPropertyMenu: FunctionComponent<TransformPropertyMenuProps> = ({
  isHidden,
  property,
}) => {
  return (
    <>
      <h3
        style={isHidden ? { width: 0, pointerEvents: "none", opacity: 0 } : {}}
      >
        X:
      </h3>
      <NumericSliderInput
        style={{
          ...(isHidden
            ? { width: 0, pointerEvents: "none", opacity: 0 }
            : { width: "20rem" }),
        }}
        setter={(arg) => {
          const selectedItem = window.selectedItems[0];
          if (selectedItem) {
            startTransaction(getTransformEventType(property));
            selectedItem[property].x = arg;
            commitTransaction();
          }
        }}
        getter={() => {
          const selectedItem = window.selectedItems[0];
          if (selectedItem) return selectedItem[property].x;
          return 0;
        }}
        toUpdate={!isHidden}
      />

      <h3
        style={isHidden ? { width: 0, pointerEvents: "none", opacity: 0 } : {}}
      >
        Y:
      </h3>
      <NumericSliderInput
        style={{
          ...(isHidden
            ? { width: 0, pointerEvents: "none", opacity: 0 }
            : { width: "20rem" }),
        }}
        setter={(arg) => {
          const selectedItem = window.selectedItems[0];
          if (selectedItem) {
            startTransaction(getTransformEventType(property));
            selectedItem[property].y = arg;
            commitTransaction();
          }
        }}
        getter={() => {
          const selectedItem = window.selectedItems[0];
          if (selectedItem) return selectedItem[property].y;
          return 0;
        }}
        toUpdate={!isHidden}
      />

      <h3
        style={isHidden ? { width: 0, pointerEvents: "none", opacity: 0 } : {}}
      >
        Z:
      </h3>
      <NumericSliderInput
        style={{
          ...(isHidden
            ? { width: 0, pointerEvents: "none", opacity: 0 }
            : { width: "20rem" }),
        }}
        setter={(arg) => {
          const selectedItem = window.selectedItems[0];
          if (selectedItem) {
            startTransaction(getTransformEventType(property));
            selectedItem[property].z = arg;
            commitTransaction();
          }
        }}
        getter={() => {
          const selectedItem = window.selectedItems[0];
          if (selectedItem) return selectedItem[property].z;
          return 0;
        }}
        toUpdate={!isHidden}
      />
    </>
  );
};

export default TransformPropertyMenu;
