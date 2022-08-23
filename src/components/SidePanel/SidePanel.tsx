import { FunctionComponent, useState } from "react";
import { ViewportSidePanelTabs } from "../../enums";
import GetIcon from "./Icons";
import WorldProperties from "./PropertyTabs/WorldProperties/WorldProperties";
import styles from "./SidePanel.module.css";

interface SidePanelProps {}

const SidePanel: FunctionComponent<SidePanelProps> = () => {
  const [isForcedActive, setisForcedActive] = useState(false);
  const [selectedPropertyTab, setselectedPropertyTab] = useState(
    ViewportSidePanelTabs.world
  );
  return (
    <div
      className={`${styles.sidePanel} ${
        isForcedActive && styles.sidePanelActive
      }`}
    >
      <div className={`${styles.objectList}`}></div>
      <div className={`${styles.properties}`}>
        <div className={`${styles.iconTab}`}>
          {Object.values(ViewportSidePanelTabs).map((tab, index) => (
            <div
              onClick={() => setselectedPropertyTab(tab)}
              key={index}
              style={
                selectedPropertyTab === tab ? { filter: "brightness(2)" } : {}
              }
              className={styles.iconWrapper}
            >
              {GetIcon(tab)}
            </div>
          ))}
        </div>
        <div className={`${styles.propertyTab}`}>
          <h2 className={`${styles.propertyTabHeader} unselectable`}>
            {`${selectedPropertyTab}${
              selectedPropertyTab.endsWith("s") ? "" : " Properties"
            }`}
          </h2>
          <div className={`${styles.propertyTabContent}`}>
            {
              {
                [ViewportSidePanelTabs.world]: <WorldProperties />,
              }[selectedPropertyTab as string]
            }
          </div>
        </div>
      </div>

      {/* Side Panel Active Holder */}
      <div
        onClick={() => {
          setisForcedActive(!isForcedActive);
        }}
        className={`${styles.panelPin}`}
      >
        <div
          className={`${styles.panelPinIndicator} ${
            isForcedActive && styles.panelPinIndicatorActive
          }`}
        />
      </div>
    </div>
  );
};

export default SidePanel;
