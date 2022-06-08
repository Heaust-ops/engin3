import { FunctionComponent, useState } from "react";
import { ViewportSidePanelTabs } from "../../enums";
import { AllViewportSidePanelTabs } from "../../utils/constants";
import GetIcon from "./Icons";
import styles from "./SidePanel.module.css";

interface SidePanelProps {}

const SidePanel: FunctionComponent<SidePanelProps> = () => {
  const [selectedPropertyTab, setselectedPropertyTab] = useState(
    ViewportSidePanelTabs.world
  );
  return (
    <div className={`${styles.sidePanel}`}>
      <div className={`${styles.objectList}`}></div>
      <div className={`${styles.properties}`}>
        <div className={`${styles.iconTab}`}>
          {AllViewportSidePanelTabs.map((tab, index) => (
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
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
