import {
  CSSProperties,
  Fragment,
  FunctionComponent,
  useRef,
  useState,
} from "react";
import styles from "./ContextMenu.module.css";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";

export interface ContextMenuItem {
  type: string;
  sub?: ContextMenuItem[] | null;
  onClick?: (arg?: ContextMenuItem) => void;
  text: string;
}

export interface ContextMenuProps {
  contextMenuItems: ContextMenuItem[];
  itemStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
}

const ContextMenu: FunctionComponent<ContextMenuProps> = ({
  contextMenuItems,
  itemStyle,
  wrapperStyle,
}) => {
  const [submenu, setsubmenu] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={`${styles.wrapper} unselectable`}
      style={wrapperStyle ? { ...wrapperStyle } : {}}
    >
      {contextMenuItems.map(
        (item, index) =>
          ({
            text: (
              <Fragment key={index}>
                <div
                  className={`${styles.item}`}
                  style={itemStyle ? { ...itemStyle } : {}}
                  onClick={() => {
                    if (item.onClick) item.onClick(item);
                    if (submenu !== index) setsubmenu(index);
                    else setsubmenu(-1);
                  }}
                >
                  {item.text}
                  {item.sub && (
                    <>
                      <div style={{ width: "0.5rem", height: "0" }} />
                      <ArrowRightIcon
                        style={{
                          width: "1.8rem",
                          height: "1.8rem",
                          transition: "0.5s",
                          transform: `rotate(${
                            submenu === index ? 180 : 0
                          }deg)`,
                        }}
                      />
                    </>
                  )}
                </div>

                {item.sub && submenu === index && (
                  <ContextMenu
                    wrapperStyle={{
                      ...wrapperStyle,
                      ...{
                        top: 0,
                        left: ref.current ? ref.current.offsetWidth : 0,
                        position: "absolute",
                      },
                    }}
                    itemStyle={itemStyle}
                    contextMenuItems={item.sub}
                  />
                )}
              </Fragment>
            ),
          }[item.type])
      )}
    </div>
  );
};

export default ContextMenu;
