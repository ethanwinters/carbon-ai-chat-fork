/*
 *  Copyright IBM Corp. 2025
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React, { forwardRef, Ref, useCallback, useMemo } from "react";

import { MinimizeButtonIconType } from "../../types/config/PublicConfig";
import type { AppState } from "../../types/state/AppState";
import type { HasRequestFocus } from "../../types/utilities/HasRequestFocus";
import { useSelector } from "../hooks/useSelector";
import { useLanguagePack } from "../hooks/useLanguagePack";
import { selectHasOpenPanelWithBackButton } from "../store/selectors";
import { Header } from "./header/Header";

interface PanelHeaderProps {
  title?: string;
  displayName?: string;
  labelBackButton?: string;
  onClickBack?: () => void;
  onClickClose?: () => void;
  onClickRestart?: () => void;
  showBackButton?: boolean;
  hideCloseButton?: boolean;
  showRestartButton?: boolean;
  showAiLabel?: boolean;
  enableChatHeaderConfig?: boolean;
  overflowItems?: string[];
  overflowClicked?: (index: number) => void;
  minimizeButtonIconType?: MinimizeButtonIconType;
}

/**
 * Lightweight header wrapper for slotting into CdsAiChatPanel.
 * Derives defaults from header config when a custom title isn't provided.
 */
function PanelHeader(
  {
    title,
    displayName,
    labelBackButton,
    onClickBack,
    onClickClose,
    onClickRestart,
    showBackButton = true,
    hideCloseButton,
    showRestartButton: showRestartButtonProp,
    showAiLabel,
    enableChatHeaderConfig,
    overflowItems: overflowItemsProp,
    overflowClicked: overflowClickedProp,
    minimizeButtonIconType,
  }: PanelHeaderProps,
  ref: Ref<HasRequestFocus>,
) {
  const languagePack = useLanguagePack();
  const derivedHeaderConfig = useSelector(
    (state: AppState) => state.config.derived.header,
  );
  const isRestarting = useSelector((state: AppState) => state.isRestarting);
  const headerMenuOptions = derivedHeaderConfig?.menuOptions;
  const hasPanelWithBackButton = useSelector(selectHasOpenPanelWithBackButton);

  const showRestartButtonFromConfig = derivedHeaderConfig?.showRestartButton;
  const showRestartButton =
    showRestartButtonProp !== undefined
      ? showRestartButtonProp
      : showRestartButtonFromConfig;

  // If another panel with a back button is open, ensure the assistant header "shows through" correctly.
  const isShowingAssistantHeaderThrough =
    hasPanelWithBackButton && !showBackButton;

  const hasCustomTitle = title !== undefined && title !== null;
  const shouldEnableChatHeaderConfig =
    enableChatHeaderConfig ?? !hasCustomTitle;
  const shouldUseConfigChrome =
    shouldEnableChatHeaderConfig && !isShowingAssistantHeaderThrough;

  let headerTitleText: string | undefined;
  let headerDisplayName: string | undefined;
  if (shouldUseConfigChrome) {
    headerTitleText = derivedHeaderConfig?.title ?? undefined;
    headerDisplayName = derivedHeaderConfig?.name ?? undefined;
  } else if (hasCustomTitle) {
    headerDisplayName = title ?? undefined;
  } else if (displayName) {
    headerDisplayName = displayName;
  }

  const isHeaderEnabled = derivedHeaderConfig?.isOn !== false;
  const shouldRenderHeader =
    isHeaderEnabled || isShowingAssistantHeaderThrough || hasCustomTitle;

  const overflowItemsFromConfig = useMemo(() => {
    if (!headerMenuOptions?.length) {
      return undefined;
    }
    return headerMenuOptions.map((option) => option.text);
  }, [headerMenuOptions]);

  const overflowClickedFromConfig = useCallback(
    (index: number) => {
      const option = headerMenuOptions?.[index];
      option?.handler?.();
    },
    [headerMenuOptions],
  );

  const isUsingConfigOverflowItems =
    shouldUseConfigChrome &&
    overflowItemsProp === undefined &&
    Boolean(overflowItemsFromConfig);

  const overflowItemsToUse = isShowingAssistantHeaderThrough
    ? undefined
    : (overflowItemsProp ?? overflowItemsFromConfig ?? undefined);

  const overflowClickedToUse = isShowingAssistantHeaderThrough
    ? undefined
    : (overflowClickedProp ??
      (isUsingConfigOverflowItems ? overflowClickedFromConfig : undefined));

  if (!shouldRenderHeader) {
    return null;
  }

  return (
    <Header
      ref={ref}
      overflowItems={overflowItemsToUse}
      overflowClicked={overflowClickedToUse}
      showRestartButton={
        isShowingAssistantHeaderThrough ? false : showRestartButton
      }
      onClickRestart={onClickRestart}
      showBackButton={showBackButton}
      labelBackButton={labelBackButton}
      title={headerTitleText}
      displayName={headerDisplayName}
      showAiLabel={isShowingAssistantHeaderThrough ? false : showAiLabel}
      hideCloseButton={isShowingAssistantHeaderThrough ? true : hideCloseButton}
      onClickBack={onClickBack}
      onClickClose={onClickClose}
      closeButtonLabel={languagePack.launcher_isOpen}
      overflowMenuTooltip={languagePack.header_overflowMenu_options}
      overflowMenuAriaLabel={languagePack.components_overflow_ariaLabel}
      restartButtonLabel={languagePack.buttons_restart}
      aiSlugLabel={languagePack.ai_slug_label}
      aiSlugTitle={languagePack.ai_slug_title}
      aiSlugDescription={languagePack.ai_slug_description}
      minimizeButtonIconType={
        minimizeButtonIconType ??
        derivedHeaderConfig?.minimizeButtonIconType ??
        MinimizeButtonIconType.MINIMIZE
      }
      isRestarting={isRestarting}
    />
  );
}

const PanelHeaderExport = forwardRef(PanelHeader);

export { PanelHeaderExport as PanelHeader };
export type { PanelHeaderProps };
