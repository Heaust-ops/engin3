import { FunctionComponent, HTMLAttributes, useEffect, useState } from "react";
import ContextMenu, { ContextMenuProps } from "./ContextMenu";

interface ContextMenuWrapperDivProps
  extends HTMLAttributes<HTMLDivElement>,
    ContextMenuProps {
  children?: React.ReactNode;
}

const keyPressStack = [] as KeyboardEvent["key"][];

const ContextMenuWrapperDiv: FunctionComponent<ContextMenuWrapperDivProps> = ({
  contextMenuItems,
  ...props
}) => {
  const [menux, setmenux] = useState(-1);
  const [menuy, setmenuy] = useState(-1);
  const [showContextMenu, setshowContextMenu] = useState(false);

  // KEYBOARDHANDLER
  useEffect(() => {
    const showAddContextMenu = (x: number, y: number) => {
      setmenux(x);
      setmenuy(y);
      setshowContextMenu(true);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (!keyPressStack.includes(ev.key)) keyPressStack.push(ev.key);
      if (keyPressStack.join("").toLowerCase() === "shifta")
        showAddContextMenu(window.mousePosition.x, window.mousePosition.y);
    };

    // Release Keys from Stack
    const onKeyUp = (ev: KeyboardEvent) => {
      if (keyPressStack.indexOf(ev.key) >= 0)
        keyPressStack.splice(keyPressStack.indexOf(ev.key), 1);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [showContextMenu]);

  return (
    <>
      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          wrapperStyle={{
            ...{ zIndex: 2 },
            ...props.wrapperStyle,
            ...{ top: menuy, left: menux },
          }}
          itemStyle={props.itemStyle}
          contextMenuItems={contextMenuItems}
        />
      )}

      {/* Actual Div */}
      <div
        {...props}
        onClick={(ev) => {
          if (props.onClick) props.onClick(ev);
          setshowContextMenu(false);
        }}
        onContextMenu={(ev) => {
          ev.preventDefault();
          if (props.onContextMenu) props.onContextMenu(ev);
        }}
      >
        {props.children}
      </div>
    </>
  );
};

export default ContextMenuWrapperDiv;
