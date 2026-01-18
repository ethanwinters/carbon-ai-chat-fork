/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import cx from "classnames";
import React, { useContext } from "react";

import Loading from "../components/carbon/Loading";
import { AnnounceOnMountComponent } from "../components-legacy/util/AnnounceOnMountComponent";
import { MountChildrenOnDelay } from "../components-legacy/util/MountChildrenOnDelay";
import { HideComponentContext } from "../contexts/HideComponentContext";
import type { AppState } from "../../types/state/AppState";

type LanguagePack = AppState["config"]["derived"]["languagePack"];

interface HydrationPanelProps {
  isHydrated: boolean;
  useHomeScreenVersion: boolean;
  languagePack: LanguagePack;
}

const HydrationPanel: React.FC<HydrationPanelProps> = ({
  isHydrated,
  useHomeScreenVersion,
  languagePack,
}) => {
  const isHidden = useContext(HideComponentContext);

  return (
    <div className="cds-aichat-- cds-aichat--hydrating-container">
      <div
        className={cx("cds-aichat--hydrating", "cds-aichat--panel-content", {
          "cds-aichat--hydrating--home-screen": useHomeScreenVersion,
        })}
      >
        {!isHidden && (
          <MountChildrenOnDelay delay={400}>
            {!isHydrated && (
              <AnnounceOnMountComponent
                announceOnce={languagePack.window_ariaWindowLoading}
              />
            )}
            <Loading
              active
              overlay={false}
              assistiveText={languagePack.window_ariaWindowLoading}
            />
          </MountChildrenOnDelay>
        )}
      </div>
    </div>
  );
};

export default HydrationPanel;
