import {
  CSSProperties,
  FunctionComponent,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { mousePosition } from "../../utils/mouse";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";

export interface ContextMenuPropsWithBindings {
  hotkeys?: { [key: string]: ContextMenuItem[] } | null;
  contextMenu?: ContextMenuItem[] | null;
}
interface ContextMenuWrapperDivProps extends HTMLAttributes<HTMLDivElement> {
  itemStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
  children?: ReactNode;
  keyStack: KeyboardEvent["key"][];
  menus: ContextMenuPropsWithBindings;
}

const ContextMenuWrapperDiv: FunctionComponent<ContextMenuWrapperDivProps> = ({
  menus,
  itemStyle,
  wrapperStyle,
  keyStack,
  ...props
}) => {
  const [menux, setmenux] = useState(-1);
  const [menuy, setmenuy] = useState(-1);
  const [showContextMenu, setshowContextMenu] = useState(false);
  const [displayedMenu, setdisplayedMenu] = useState([] as ContextMenuItem[]);

  const showAddContextMenu = (
    x: number,
    y: number,
    menu: ContextMenuItem[]
  ) => {
    setdisplayedMenu(menu);
    setmenux(x);
    setmenuy(y);
    setshowContextMenu(true);
  };

  useEffect(() => {
    if (menus.hotkeys) {
      Object.keys(menus.hotkeys).forEach((el) => {
        // Show menu on the combination
        if (keyStack.join("").toLowerCase() === el)
          showAddContextMenu(
            mousePosition.x,
            mousePosition.y,
            menus.hotkeys![el]
          );
      });
    }
  }, [keyStack, menus.hotkeys]);

  return (
    <>
      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          wrapperStyle={{
            ...{ zIndex: 2 },
            ...(wrapperStyle ?? {}),
            ...{ top: menuy, left: menux },
          }}
          itemStyle={itemStyle ?? {}}
          contextMenuItems={displayedMenu}
        />
      )}

      {/* Actual Div */}
      <div

        {...props}

        onClick={(ev) => {
          if (props.onClick) props.onClick(ev);
          setshowContextMenu(false);
          setdisplayedMenu([]);
        }}

        onContextMenu={(ev) => {
          ev.preventDefault();

          if (menus.contextMenu) {
            showAddContextMenu(
              mousePosition.x,
              mousePosition.y,
              menus.contextMenu
            );
          }

          if (props.onContextMenu) props.onContextMenu(ev);
        }}
      >
        {props.children}
      </div>
    </>
  );
};

export default ContextMenuWrapperDiv;
