import { FunctionComponent } from "react";
import NumericSliderInput from "../NumericSliderInput/NumericSliderInput";

interface TransformPropertyMenuProps {
  isHidden: boolean;
  property: "position" | "rotation" | "scale";
}

const TransformPropertyMenu: FunctionComponent<TransformPropertyMenuProps> = ({
  isHidden,
  property
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
          if (selectedItem) selectedItem[property].x = arg;
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
          if (selectedItem) selectedItem[property].y = arg;
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
          if (selectedItem) selectedItem[property].z = arg;
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
