"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CART_MAX_QUANTITY, readCart, writeCart, type CartItem } from "../../lib/cart";
import { defaultModuleSettings, resolveDonationProjectCommerce, type DonationCategory, type DonationModuleSettings, type DonationOption, type DonationOptionDesign, type DonationOptionTextDesign, type DonationProject, type DonationProjectMedia } from "../../lib/module-settings";
import styles from "./donation-module.module.css";

type Device = "desktop" | "mobile";
type CardMediaPreferences = {
  mediaThumbnailsVisible?: boolean;
  mediaThumbnailSize?: number;
  mediaThumbnailGap?: number;
  mediaThumbnailRadius?: number;
  mediaThumbnailBottom?: number;
  videoModalWidth?: number;
  videoModalRadius?: number;
  videoModalBackdropOpacity?: number;
};
type ResolvedCardMediaPreferences = {
  thumbnailsVisible: boolean;
  thumbnailSize: number;
  thumbnailGap: number;
  thumbnailRadius: number;
  thumbnailBottom: number;
  modalWidth: number;
  modalRadius: number;
  modalBackdropOpacity: number;
};
type VideoModalState = {
  src: string;
  poster?: string;
  title: string;
  preferences: ResolvedCardMediaPreferences;
};
type ProjectCommerce = ReturnType<typeof resolveDonationProjectCommerce>;
type ProjectAction = ProjectCommerce["actions"][number];
type ProjectActionDevice = ProjectAction["desktop"];
type OptionCssProperties = CSSProperties & Record<`--dm-option-${string}`, string | number>;
type OptionItemCssProperties = CSSProperties & Record<`--dm-option-item-${string}`, string | number>;

const numberSetting = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

function resolveCardMediaPreferences(
  projectDesign: CardMediaPreferences & { useSharedImageDesign?: boolean },
  sharedDesign: CardMediaPreferences,
): ResolvedCardMediaPreferences {
  const source = projectDesign.useSharedImageDesign !== false ? sharedDesign : projectDesign;
  return {
    thumbnailsVisible: source.mediaThumbnailsVisible !== false,
    thumbnailSize: numberSetting(source.mediaThumbnailSize, 54, 24, 160),
    thumbnailGap: numberSetting(source.mediaThumbnailGap, 8, 0, 40),
    thumbnailRadius: numberSetting(source.mediaThumbnailRadius, 8, 0, 40),
    thumbnailBottom: numberSetting(source.mediaThumbnailBottom, 10, 0, 80),
    modalWidth: numberSetting(source.videoModalWidth, 960, 280, 1800),
    modalRadius: numberSetting(source.videoModalRadius, 18, 0, 60),
    modalBackdropOpacity: numberSetting(source.videoModalBackdropOpacity, 84, 0, 100),
  };
}

const actionIcons = {
  none: "",
  plus: "+",
  cart: "▱",
  heart: "♡",
  arrow: "→",
} as const;

function safeActionHref(action: ProjectAction) {
  const href = String(action.href || "").trim();
  if (!href) return "";
  if (action.kind === "internal-link" && href.startsWith("/") && !href.startsWith("//")) return href;
  if (action.kind === "whatsapp" && /^https:\/\/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\/[a-z0-9/?&=._%-]+$/i.test(href)) return href;
  if (action.kind === "external-link" && /^https:\/\/[a-z0-9.-]+(?:[/:?#].*)?$/i.test(href)) return href;
  return "";
}

function isGroupVisible(
  group: ProjectCommerce["optionGroups"][number],
  selections: Record<string, string>,
  optionGroups: ProjectCommerce["optionGroups"],
) {
  if (!group.visibleWhen) return true;
  const selectedOptionId = selections[group.visibleWhen.groupId] || "";
  if (!group.visibleWhen.optionIds.includes(selectedOptionId)) return false;
  const parentGroup = optionGroups.find((candidate) => candidate.id === group.visibleWhen?.groupId);
  const selectedOption = parentGroup?.options.find((option) => option.id === selectedOptionId && option.enabled);
  return Boolean(selectedOption && selectedOption.childFlowEnabled !== false);
}

function resolveProjectSelections(
  commerce: ProjectCommerce,
  source: Record<string, string>,
) {
  const resolved: Record<string, string> = {};
  commerce.optionGroups.filter((group) => group.enabled).forEach((group) => {
    if (!isGroupVisible(group, resolved, commerce.optionGroups)) return;
    const enabledOptions = group.options.filter((option) => option.enabled);
    const selected = enabledOptions.find((option) => option.id === source[group.id])
      || enabledOptions.find((option) => option.id === group.defaultOptionId)
      || (group.required ? enabledOptions[0] : undefined);
    if (selected) resolved[group.id] = selected.id;
  });
  return resolved;
}

function resolveConfiguredAmountMinor(
  commerce: ProjectCommerce,
  selections: Record<string, string>,
) {
  const selectedIds = new Set(Object.values(selections));
  const matchedRule = commerce.priceRules.find(
    (rule) => rule.enabled && rule.optionIds.length > 0 && rule.optionIds.every((id) => selectedIds.has(id)),
  );
  if (matchedRule) return matchedRule.amountMinor;
  const optionTotal = commerce.optionGroups.reduce((total, group) => {
    const selected = group.options.find((option) => option.id === selections[group.id]);
    return total + (selected?.priceMinor || 0);
  }, 0);
  return optionTotal > 0 ? optionTotal : commerce.baseAmountMinor;
}

function actionButtonStyle(action: ProjectAction, device: ProjectActionDevice): CSSProperties {
  const width = device.width === "full" ? "100%" : device.width === "half" ? "calc(50% - 5px)" : "auto";
  const background = action.variant === "gradient"
    ? `linear-gradient(135deg, ${action.background}, ${action.backgroundEnd})`
    : action.variant === "outline"
      ? "transparent"
      : action.variant === "soft"
        ? `color-mix(in srgb, ${action.background} 13%, white)`
        : action.background;
  return {
    order: device.order,
    flexBasis: width,
    width,
    minHeight: device.height,
    borderRadius: device.radius,
    borderColor: action.borderColor,
    background,
    color: action.textColor,
    marginInlineStart: device.align === "end" || device.align === "center" ? "auto" : undefined,
    marginInlineEnd: device.align === "start" || device.align === "center" ? "auto" : undefined,
  };
}

function optionShadow(shadow: DonationOptionDesign["shadow"]) {
  if (shadow === "medium") return "0 8px 20px rgba(18,60,53,.13)";
  if (shadow === "soft") return "0 4px 12px rgba(18,60,53,.08)";
  return "0 0 0 transparent";
}

function optionFontFamily(fontFamily: DonationOptionTextDesign["fontFamily"]) {
  if (fontFamily === "sans") return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  if (fontFamily === "serif") return "Georgia, 'Times New Roman', serif";
  return "inherit";
}

function optionTextAlign(align: DonationOptionTextDesign["align"]) {
  if (align === "start") return "flex-start";
  if (align === "end") return "flex-end";
  return "center";
}

function sharedOptionTextDesign(design: DonationOptionDesign): DonationOptionTextDesign {
  return {
    fontSize: design.labelSize,
    fontWeight: design.labelWeight,
    fontFamily: design.optionFontFamily,
    color: design.textColor,
    align: design.optionTextAlign,
    letterSpacing: design.optionLetterSpacing,
    textTransform: design.optionTextTransform,
  };
}

function optionUsesSharedTextDesign(option: DonationOption, device: Device) {
  return device === "mobile"
    ? option.useSharedTextDesignMobile !== false
    : option.useSharedTextDesignDesktop !== false;
}

function resolveOptionTextDesign(
  option: DonationOption,
  design: DonationOptionDesign,
  device: Device,
) {
  const shared = sharedOptionTextDesign(design);
  if (optionUsesSharedTextDesign(option, device)) return shared;
  return (device === "mobile" ? option.mobileTextDesign : option.desktopTextDesign) || shared;
}

function optionItemStyle(
  option: DonationOption,
  design: DonationOptionDesign,
  device: Device,
): OptionItemCssProperties | undefined {
  if (optionUsesSharedTextDesign(option, device)) return undefined;
  const textDesign = resolveOptionTextDesign(option, design, device);
  return {
    "--dm-option-item-label-size": `${textDesign.fontSize}px`,
    "--dm-option-item-label-weight": textDesign.fontWeight,
    "--dm-option-item-label-family": optionFontFamily(textDesign.fontFamily),
    "--dm-option-item-label-color": textDesign.color,
    "--dm-option-item-label-align": textDesign.align,
    "--dm-option-item-label-justify": optionTextAlign(textDesign.align),
    "--dm-option-item-label-spacing": `${textDesign.letterSpacing}px`,
    "--dm-option-item-label-transform": textDesign.textTransform,
  };
}

function selectOptionStyle(textDesign: DonationOptionTextDesign): CSSProperties {
  return {
    color: textDesign.color,
    fontFamily: optionFontFamily(textDesign.fontFamily),
    fontSize: textDesign.fontSize,
    fontWeight: textDesign.fontWeight,
    letterSpacing: `${textDesign.letterSpacing}px`,
    textAlign: textDesign.align,
    textTransform: textDesign.textTransform,
  };
}

function optionGroupStyle(design: DonationOptionDesign): OptionCssProperties {
  const justify = design.justify === "start"
    ? "flex-start"
    : design.justify === "end"
      ? "flex-end"
      : design.justify;
  return {
    "--dm-option-title-align": design.titleAlign,
    "--dm-option-title-size": `${design.titleSize}px`,
    "--dm-option-title-weight": design.titleWeight,
    "--dm-option-title-color": design.titleColor,
    "--dm-option-description-size": `${design.descriptionSize}px`,
    "--dm-option-description-color": design.descriptionColor,
    "--dm-option-title-description-gap": `${design.titleDescriptionGap}px`,
    "--dm-option-header-gap": `${design.headerGap}px`,
    "--dm-option-group-top-gap": `${design.groupTopGap}px`,
    "--dm-option-height": `${design.optionHeight}px`,
    "--dm-option-width": `${design.optionWidth}px`,
    "--dm-option-min-width": `${design.optionMinWidth}px`,
    "--dm-option-columns": design.columns || 1,
    "--dm-option-justify": justify,
    "--dm-option-column-gap": `${design.columnGap}px`,
    "--dm-option-row-gap": `${design.rowGap}px`,
    "--dm-option-padding-x": `${design.paddingX}px`,
    "--dm-option-white-space": design.textWrap ? "normal" : "nowrap",
    "--dm-option-label-size": `${design.labelSize}px`,
    "--dm-option-label-weight": design.labelWeight,
    "--dm-option-label-family": optionFontFamily(design.optionFontFamily),
    "--dm-option-label-align": design.optionTextAlign,
    "--dm-option-label-justify": optionTextAlign(design.optionTextAlign),
    "--dm-option-label-spacing": `${design.optionLetterSpacing}px`,
    "--dm-option-label-transform": design.optionTextTransform,
    "--dm-option-item-description-size": `${design.optionDescriptionSize}px`,
    "--dm-option-item-description-color": design.optionDescriptionColor,
    "--dm-option-background": design.background,
    "--dm-option-text-color": design.textColor,
    "--dm-option-border-color": design.borderColor,
    "--dm-option-selected-background": design.selectedBackground,
    "--dm-option-selected-text-color": design.selectedTextColor,
    "--dm-option-selected-border-color": design.selectedBorderColor,
    "--dm-option-border-width": `${design.borderWidth}px`,
    "--dm-option-radius": `${design.radius}px`,
    "--dm-option-shadow": optionShadow(design.shadow),
  };
}

function DonationCardCommerce({
  project,
  device,
  onNotice,
}: {
  project: DonationProject;
  device: Device;
  onNotice: (message: string) => void;
}) {
  const commerce = resolveDonationProjectCommerce(project);
  const [selectionState, setSelectionState] = useState<Record<string, string>>({});
  const [presetId, setPresetId] = useState("");
  const [quantity, setQuantity] = useState(commerce.quantityPresets[0] || 1);
  const [customAmount, setCustomAmount] = useState("");
  const selections = resolveProjectSelections(commerce, selectionState);
  const enabledGroups = commerce.optionGroups.filter((group) => group.enabled);
  const visibleGroups = enabledGroups.filter((group) => isGroupVisible(group, selections, commerce.optionGroups));
  const visibleGroupIds = new Set(visibleGroups.map((group) => group.id));
  const enabledPresets = commerce.amountPresets.filter((preset) => preset.enabled);
  const activePreset = enabledPresets.find((preset) => preset.id === presetId) || enabledPresets[0];
  const typedAmount = Number(customAmount.replace(",", "."));
  const typedMinor = Number.isFinite(typedAmount) && typedAmount > 0 ? Math.round(typedAmount * 100) : 0;
  const configuredMinor = resolveConfiguredAmountMinor(commerce, selections);
  const customModeEnabled = (commerce.mode === "amount" || commerce.mode === "configured") && commerce.customAmountEnabled;
  const unitAmountMinor = commerce.mode === "amount"
    ? (typedMinor || activePreset?.amountMinor || commerce.baseAmountMinor)
    : commerce.mode === "configured"
      ? (typedMinor || configuredMinor)
      : commerce.baseAmountMinor;
  const activeQuantity = commerce.quantityPresets.includes(quantity) ? quantity : commerce.quantityPresets[0] || 1;
  const lineQuantity = commerce.mode === "quantity" ? activeQuantity : 1;
  const totalMinor = unitAmountMinor * lineQuantity;
  const invalidCustomAmount = customModeEnabled && typedMinor > 0
    && (typedMinor < commerce.customAmountMinMinor || typedMinor > commerce.customAmountMaxMinor);
  const missingRequired = visibleGroups.some((group) => group.required && !selections[group.id]);
  const validSelection = !missingRequired && !invalidCustomAmount && unitAmountMinor > 0;
  const deviceKey = device === "mobile" ? "mobile" : "desktop";
  const actionLayout = device === "mobile" ? commerce.actionLayoutMobile : commerce.actionLayoutDesktop;
  const actionGap = device === "mobile" ? commerce.actionGapMobile : commerce.actionGapDesktop;

  function chooseOption(groupId: string, optionId: string) {
    setSelectionState((current) => resolveProjectSelections(commerce, { ...current, [groupId]: optionId }));
  }

  function addConfiguredItem(openCheckout: boolean, requiresValidSelection: boolean) {
    const invalidPrice = invalidCustomAmount || unitAmountMinor <= 0;
    if (invalidPrice || (requiresValidSelection && !validSelection)) {
      onNotice(commerce.validationMessage);
      return;
    }
    const selectionSummary = visibleGroups.flatMap((group) => {
      const option = group.options.find((candidate) => candidate.id === selections[group.id]);
      return option ? [{ group: group.label, option: option.label }] : [];
    });
    const selectionKey = Object.entries(selections).sort(([a], [b]) => a.localeCompare(b)).map(([groupId, optionId]) => `${groupId}:${optionId}`).join("|");
    const amount = Math.round(unitAmountMinor) / 100;
    const id = `${project.id}-${selectionKey || "standard"}-${amount}`;
    const current = readCart();
    const existing = current.find((item) => item.id === id);
    const next: CartItem[] = existing
      ? current.map((item) => item.id === id ? { ...item, quantity: Math.min(CART_MAX_QUANTITY, item.quantity + lineQuantity) } : item)
      : [...current, {
          id,
          projectId: project.id,
          project: project.title,
          amount,
          quantity: lineQuantity,
          pricingVersion: 2,
          selections: selectionSummary,
        }];
    writeCart(next);
    window.dispatchEvent(new CustomEvent("iyilik-cart-updated", { detail: next }));
    window.dispatchEvent(new Event(openCheckout ? "iyilik-cart-checkout" : "iyilik-cart-open"));
    onNotice(openCheckout ? `${project.title} ödeme adımına hazır.` : `${project.title} sepete eklendi.`);
  }

  function runAction(action: ProjectAction) {
    if (action.requiresValidSelection && !validSelection) {
      onNotice(commerce.validationMessage);
      return;
    }
    if (action.kind === "add-to-cart" || action.kind === "checkout") {
      addConfiguredItem(action.kind === "checkout", action.requiresValidSelection);
      return;
    }
    const href = safeActionHref(action);
    if (!href) {
      onNotice("Bu düğmenin bağlantısı henüz ayarlanmamış.");
      return;
    }
    if (action.kind === "internal-link") window.location.assign(href);
    else window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.commerce}>
      {enabledGroups.length ? <div className={styles.optionGroups}>
        {enabledGroups.map((group) => {
        const groupVisible = visibleGroupIds.has(group.id);
        const sharedDesign = device === "mobile" ? commerce.optionDesignMobile : commerce.optionDesignDesktop;
        const ownDesign = device === "mobile" ? group.mobileDesign : group.desktopDesign;
        const optionDesign = group.useSharedDesign !== false ? sharedDesign : ownDesign || sharedDesign;
        const titleVisible = (device === "mobile" ? group.titleVisibleMobile : group.titleVisibleDesktop)
          ?? optionDesign.titleVisible;
        const descriptionVisible = (device === "mobile" ? group.descriptionVisibleMobile : group.descriptionVisibleDesktop)
          ?? optionDesign.descriptionVisible;
        const optionWidthMode = optionDesign.optionWidthMode;
        const horizontalScroll = optionDesign.horizontalScroll
          && (optionWidthMode === "auto" || optionWidthMode === "fixed");
        const widthModeClass = optionWidthMode === "fixed"
          ? styles.optionWidthFixed
          : optionWidthMode === "equal"
            ? styles.optionWidthEqual
            : optionWidthMode === "columns"
              ? styles.optionWidthColumns
              : styles.optionWidthAuto;
        const heightModeClass = optionDesign.optionHeightMode === "fixed"
          ? styles.optionHeightFixed
          : styles.optionHeightAuto;
        const hasHeader = titleVisible || (descriptionVisible && Boolean(group.description));
        const enabledOptions = group.options.filter((option) => option.enabled);
        const selectedOption = enabledOptions.find((option) => option.id === selections[group.id]);
        const selectedSelectStyle = selectedOption && !optionUsesSharedTextDesign(selectedOption, device)
          ? selectOptionStyle(resolveOptionTextDesign(selectedOption, optionDesign, device))
          : undefined;
        const choicesClassName = [
          styles.optionChoices,
          widthModeClass,
          heightModeClass,
          horizontalScroll ? styles.optionChoicesScroll : "",
          optionDesign.justify === "stretch" && optionWidthMode === "auto"
            ? styles.optionChoicesStretch
            : "",
        ].filter(Boolean).join(" ");
        const optionPrice = (priceMinor: number) => `+${money.format(priceMinor / 100)}`;
        return (
          <div
            aria-hidden={!groupVisible}
            className={styles.optionGroupMotion}
            data-visible={groupVisible}
            key={group.id}
          >
            <div className={styles.optionGroupMotionInner}>
              <fieldset
                aria-label={group.label}
                aria-required={group.required}
                className={`${styles.optionGroup} ${widthModeClass} ${heightModeClass}`}
                disabled={!groupVisible}
                style={optionGroupStyle(optionDesign)}
              >
            {hasHeader ? <div className={styles.optionGroupHeader}>
              {titleVisible ? <div className={styles.optionGroupTitle}>
                {group.label}
              </div> : null}
              {descriptionVisible && group.description
                ? <p className={styles.optionGroupDescription}>{group.description}</p>
                : null}
            </div> : null}
            {group.display === "select" ? (
              <select required={group.required} style={selectedSelectStyle} value={selections[group.id] || ""} onChange={(event) => chooseOption(group.id, event.target.value)}>
                <option value="">Seçiniz</option>
                {enabledOptions.map((option) => (
                  <option
                    key={option.id}
                    style={!optionUsesSharedTextDesign(option, device)
                      ? selectOptionStyle(resolveOptionTextDesign(option, optionDesign, device))
                      : undefined}
                    value={option.id}
                  >
                    {option.label}{optionDesign.priceVisible && option.priceMinor > 0 ? ` · ${optionPrice(option.priceMinor)}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div aria-label={group.label} aria-required={group.required} className={choicesClassName} role="radiogroup">
                {enabledOptions.map((option) => {
                  const showPrice = optionDesign.priceVisible && option.priceMinor > 0;
                  return (
                    <button
                      aria-checked={selections[group.id] === option.id}
                      className={selections[group.id] === option.id ? styles.selectedChoice : ""}
                      role="radio"
                      style={optionItemStyle(option, optionDesign, device)}
                      type="button"
                      key={option.id}
                      onClick={() => chooseOption(group.id, option.id)}
                    >
                      <strong className={styles.optionLabel}>
                        <span>{option.label}</span>
                        {showPrice && optionDesign.pricePosition === "inline"
                          ? <em className={styles.optionPriceInline}>{optionPrice(option.priceMinor)}</em>
                          : null}
                      </strong>
                      {optionDesign.optionDescriptionVisible && option.description
                        ? <small className={styles.optionDescription}>{option.description}</small>
                        : null}
                      {showPrice && optionDesign.pricePosition === "below"
                        ? <em className={styles.optionPriceBelow}>{optionPrice(option.priceMinor)}</em>
                        : null}
                      {showPrice && optionDesign.pricePosition === "badge"
                        ? <em className={styles.optionPriceBadge}>{optionPrice(option.priceMinor)}</em>
                        : null}
                    </button>
                  );
                })}
              </div>
            )}
              </fieldset>
            </div>
          </div>
        );
      })}
      </div> : null}

      {commerce.mode === "amount" ? (
        <div className={styles.amountArea}>
          <small>{commerce.sectionLabel}</small>
          {enabledPresets.length ? <div className={styles.choices}>
            {enabledPresets.map((preset) => (
              <button className={(activePreset?.id === preset.id && !typedMinor) ? styles.selectedChoice : ""} type="button" key={preset.id} onClick={() => { setPresetId(preset.id); setCustomAmount(""); }}>
                {preset.label || money.format(preset.amountMinor / 100)}
                {preset.featured ? <i>Popüler</i> : null}
              </button>
            ))}
          </div> : null}
          {commerce.customAmountEnabled ? <label className={styles.customAmount}>
            <span>₺</span>
            <input inputMode="decimal" value={customAmount} onChange={(event) => setCustomAmount(event.target.value.replace(/[^\d,.]/g, ""))} placeholder={commerce.customAmountPlaceholder} />
          </label> : null}
        </div>
      ) : null}

      {commerce.mode === "quantity" ? (
        <div className={styles.amountArea}>
          <small>{commerce.sectionLabel}</small>
          <div className={styles.choices}>
            {commerce.quantityPresets.map((value) => <button className={activeQuantity === value ? styles.selectedChoice : ""} type="button" key={value} onClick={() => setQuantity(value)}>{value}</button>)}
          </div>
        </div>
      ) : null}

      {commerce.mode === "configured" && commerce.customAmountEnabled ? (
        <div className={styles.amountArea}>
          <small>{commerce.sectionLabel}</small>
          <label className={styles.customAmount}>
            <span>₺</span>
            <input inputMode="decimal" value={customAmount} onChange={(event) => setCustomAmount(event.target.value.replace(/[^\d,.]/g, ""))} placeholder={commerce.customAmountPlaceholder} />
          </label>
        </div>
      ) : null}

      {commerce.mode !== "amount" || !commerce.customAmountEnabled ? (
        <div className={styles.resolvedPrice}><span>Toplam</span><strong>{money.format(totalMinor / 100)}</strong></div>
      ) : null}

      {!validSelection ? <p className={styles.commerceValidation}>{invalidCustomAmount ? commerce.validationMessage : commerce.validationMessage}</p> : null}
      <div className={`${styles.commerceActions} ${actionLayout === "stack" ? styles.commerceActionsStack : ""}`} style={{ gap: actionGap }}>
        {commerce.actions
          .filter((action) => action.enabled && action[deviceKey].visible)
          .sort((a, b) => a[deviceKey].order - b[deviceKey].order)
          .map((action) => {
            const deviceSettings = action[deviceKey];
            const variantClass = action.variant === "outline"
              ? styles.commerceButtonOutline
              : action.variant === "soft"
                ? styles.commerceButtonSoft
                : action.variant === "gradient"
                  ? styles.commerceButtonGradient
                  : "";
            return (
              <button
                className={`${styles.commerceButton}${variantClass ? ` ${variantClass}` : ""}`}
                type="button"
                key={action.id}
                style={actionButtonStyle(action, deviceSettings)}
                onClick={() => runAction(action)}
              >
                {action.icon !== "none" ? <i aria-hidden="true">{actionIcons[action.icon]}</i> : null}
                <span>{deviceSettings.label}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function CategoryImage({ category, src, className, sizes }: { category: DonationCategory; src: string; className: string; sizes: string }) {
  const alt = category.imageAlt;
  const title = category.imageTitle || category.label;
  if (!src) {
    return (
      // A native image intentionally preserves the browser's broken-image marker for an empty category image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src="/__missing-donation-category-image__.png"
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    );
  }
  return <Image className={className} src={src} alt={alt} title={title} fill sizes={sizes} />;
}

function BrokenMediaMarker({ className = "" }: { className?: string }) {
  return (
    // A native image intentionally preserves the browser's broken-image marker.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`${styles.cardMediaBroken}${className ? ` ${className}` : ""}`} src="/__missing-donation-project-media__.png" alt="" aria-hidden="true" />
  );
}

function CardMedia({
  media,
  title,
  preferences,
  imageHeight,
  imageRadius,
  imageFit,
  visible,
  onOpenVideo,
}: {
  media: DonationProjectMedia[];
  title: string;
  preferences: ResolvedCardMediaPreferences;
  imageHeight: number;
  imageRadius: number;
  imageFit: "cover" | "contain";
  visible: boolean;
  onOpenVideo: (media: DonationProjectMedia, trigger: HTMLButtonElement) => void;
}) {
  const [active, setActive] = useState(0);
  const pointerStart = useRef<{ x: number; y: number; id: number; captured: boolean } | null>(null);
  const swiped = useRef(false);
  const currentIndex = media.length ? Math.min(active, media.length - 1) : 0;
  const current = media[currentIndex];
  const select = (index: number) => setActive(Math.max(0, Math.min(media.length - 1, index)));
  const thumbnailSize = Math.min(preferences.thumbnailSize, Math.max(32, imageHeight - 30));
  const thumbnailHeight = Math.min(Math.max(24, Math.round(thumbnailSize * .72)), Math.max(24, imageHeight - 20));

  if (!visible) return null;

  return (
    <div
      className={styles.cardMedia}
      style={{
        "--dm-card-media-display": "block",
        "--dm-card-media-height": `${imageHeight}px`,
        "--dm-card-media-radius": `${imageRadius}px`,
        "--dm-card-media-fit": imageFit,
        "--dm-media-thumb-size": `${thumbnailSize}px`,
        "--dm-media-thumb-height": `${thumbnailHeight}px`,
        "--dm-media-thumb-gap": `${preferences.thumbnailGap}px`,
        "--dm-media-thumb-radius": `${preferences.thumbnailRadius}px`,
        "--dm-media-thumb-bottom": `${preferences.thumbnailBottom}px`,
      } as CSSProperties}
    >
      <div
        className={styles.cardMediaMain}
        onPointerDown={(event) => {
          if (!event.isPrimary) return;
          if ((event.target as HTMLElement).closest("[data-media-thumbnails='true']")) return;
          pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId, captured: false };
          swiped.current = false;
        }}
        onPointerMove={(event) => {
          const start = pointerStart.current;
          if (!start || start.id !== event.pointerId || start.captured) return;
          const distanceX = event.clientX - start.x;
          const distanceY = event.clientY - start.y;
          if (Math.abs(distanceX) < 8 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
          start.captured = true;
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          if (!start || start.id !== event.pointerId || media.length < 2) return;
          const distanceX = event.clientX - start.x;
          const distanceY = event.clientY - start.y;
          if (Math.abs(distanceX) < 35 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
          swiped.current = true;
          select(currentIndex + (distanceX < 0 ? 1 : -1));
          window.requestAnimationFrame(() => { swiped.current = false; });
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
          swiped.current = false;
        }}
      >
        {!current || !current.url ? <BrokenMediaMarker /> : current.type === "image" ? (
          <Image className={styles.cardMediaImage} src={current.url} alt={current.alt || title} fill sizes="(max-width: 640px) 92vw, (max-width: 1200px) 50vw, 700px" draggable={false} />
        ) : (
          <>
            {current.poster ? <Image className={styles.cardMediaImage} src={current.poster} alt="" fill sizes="(max-width: 640px) 92vw, (max-width: 1200px) 50vw, 700px" draggable={false} /> : <BrokenMediaMarker />}
            <button
              className={styles.cardMediaPlay}
              type="button"
              aria-label={`${title} videosunu oynat`}
              onClick={(event) => {
                if (swiped.current) return;
                onOpenVideo(current, event.currentTarget);
              }}
            >
              <span aria-hidden="true">▶</span>
            </button>
          </>
        )}
        {preferences.thumbnailsVisible && media.length > 1 ? (
          <div className={styles.cardMediaThumbs} role="group" data-media-thumbnails="true" aria-label={`${title} medya galerisi`}>
            {media.map((item, index) => {
              const thumbnail = item.type === "video" ? item.poster : item.url;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={index === currentIndex ? styles.activeMediaThumb : ""}
                  onClick={() => select(index)}
                  aria-label={`${index + 1}. medyayı göster${item.type === "video" ? " (video)" : ""}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                >
                  {thumbnail ? <Image src={thumbnail} alt="" fill sizes={`${preferences.thumbnailSize}px`} draggable={false} /> : <BrokenMediaMarker />}
                  {item.type === "video" ? <i aria-hidden="true">▶</i> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const shadowValue = {
  none: "none",
  soft: "0 7px 18px rgba(18,60,53,.08)",
  medium: "0 12px 28px rgba(18,60,53,.16)",
  strong: "0 18px 38px rgba(18,60,53,.26)",
} as const;
const arrowSymbols = {
  thin: ["←", "→"],
  chevron: ["‹", "›"],
  bold: ["❮", "❯"],
  long: ["⟵", "⟶"],
  triangle: ["◀", "▶"],
} as const;

function subscribeToMobileViewport(callback: () => void) {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const getMobileViewportSnapshot = () => window.matchMedia("(max-width: 640px)").matches;
const getDesktopServerSnapshot = () => false;

export default function DonationModule({ embedded = false, settings = defaultModuleSettings.donation, previewDevice, previewCategory, onCategoryChange }: { embedded?: boolean; settings?: DonationModuleSettings; previewDevice?: "desktop" | "mobile"; previewCategory?: string; onCategoryChange?: (category: string) => void }) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const categoryDirectionRef = useRef<1 | -1>(1);
  const categoryPausedRef = useRef(false);
  const categoryPositionRef = useRef(0);
  const categoryInitializedRef = useRef(false);
  const categoryPointerActiveRef = useRef(false);
  const categoryResumeAtRef = useRef(0);
  const categoryMouseDragRef = useRef({ active: false, moved: false, pointerId: -1, startX: 0, startScroll: 0 });
  const categoryLastDragAtRef = useRef(0);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [category, setCategory] = useState(previewCategory || settings.allCategoryId || settings.categories[0]?.id || "");
  const [notice, setNotice] = useState("");
  const [videoModal, setVideoModal] = useState<VideoModalState | null>(null);
  const videoModalPanelRef = useRef<HTMLDivElement>(null);
  const videoModalCloseRef = useRef<HTMLButtonElement>(null);
  const videoModalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const isMobileViewport = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getDesktopServerSnapshot,
  );
  useEffect(() => {
    if (!previewCategory) return;
    const frame = window.requestAnimationFrame(() => setCategory(previewCategory));
    return () => window.cancelAnimationFrame(frame);
  }, [previewCategory]);
  useEffect(() => {
    if (!videoModal) return;

    const body = document.body;
    const root = document.documentElement;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const originalBody = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    const originalRootOverflow = root.style.overflow;
    const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoModal(null);
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (scrollbarWidth) body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => videoModalCloseRef.current?.focus({ preventScroll: true }));

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      body.style.position = originalBody.position;
      body.style.top = originalBody.top;
      body.style.left = originalBody.left;
      body.style.right = originalBody.right;
      body.style.width = originalBody.width;
      body.style.overflow = originalBody.overflow;
      body.style.paddingRight = originalBody.paddingRight;
      root.style.overflow = originalRootOverflow;
      const originalScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(scrollX, scrollY);
      root.style.scrollBehavior = originalScrollBehavior;
      window.requestAnimationFrame(() => {
        if (videoModalTriggerRef.current?.isConnected) videoModalTriggerRef.current.focus({ preventScroll: true });
      });
    };
  }, [videoModal]);
  const activeDevice: Device = previewDevice || (isMobileViewport ? "mobile" : "desktop");
  const categories = settings.categories;
  const legacyVisibleCategories = settings.visibleCategories || categories.map((item) => item.id);
  const deviceVisibleCategories = activeDevice === "mobile"
    ? settings.mobileVisibleCategories || legacyVisibleCategories
    : settings.desktopVisibleCategories || legacyVisibleCategories;
  const deviceCategoryOrder = activeDevice === "mobile"
    ? settings.mobileCategoryOrder || categories.map((item) => item.id)
    : settings.desktopCategoryOrder || categories.map((item) => item.id);
  const visibleIds = new Set(deviceVisibleCategories);
  const orderedIds = [
    ...deviceCategoryOrder,
    ...categories.map((item) => item.id).filter((id) => !deviceCategoryOrder.includes(id)),
  ];
  const visibleCategories = orderedIds
    .filter((id, index) => visibleIds.has(id) && orderedIds.indexOf(id) === index)
    .map((id) => categories.find((item) => item.id === id))
    .filter((item): item is (typeof categories)[number] => Boolean(item));
  const effectiveCategory = visibleIds.has(category)
    ? category
    : visibleCategories.find((item) => item.id === settings.allCategoryId)?.id || visibleCategories[0]?.id || "";
  const isAllCategory = Boolean(settings.allCategoryId) && effectiveCategory === settings.allCategoryId;
  const categoryListKey = `${activeDevice}:${visibleCategories.map((item) => item.id).join(",")}`;
  const filtered = settings.projects
    .filter((project) => project.enabled && (isAllCategory || project.category === effectiveCategory))
    .sort((a, b) => isAllCategory
      ? (activeDevice === "mobile" ? (a.allOrderMobile ?? 0) - (b.allOrderMobile ?? 0) : (a.allOrderDesktop ?? 0) - (b.allOrderDesktop ?? 0))
      : 0);

  useEffect(() => {
    const rail = categoriesRef.current;
    categoryInitializedRef.current = false;
    categoryDirectionRef.current = 1;
    categoryPositionRef.current = 0;
    if (rail) rail.scrollLeft = 0;
  }, [categoryListKey]);

  useEffect(() => {
    const rail = categoriesRef.current;
    if (!rail) return;
    let animationFrame = 0;
    let previousTime = performance.now();
    const maxAtStart = Math.max(0, rail.scrollWidth - rail.clientWidth);
    if (!categoryInitializedRef.current && maxAtStart > 0) {
      categoryPositionRef.current = Math.min(maxAtStart, activeDevice === "mobile" ? settings.mobileEdgeScrollPadding : settings.desktopEdgeScrollPadding);
      rail.scrollLeft = categoryPositionRef.current;
      categoryInitializedRef.current = true;
    } else {
      categoryPositionRef.current = rail.scrollLeft;
    }
    const animate = (time: number) => {
      const elapsed = Math.min(68, Math.max(0, time - previousTime));
      previousTime = time;
      if (!settings.autoScroll || categoryPausedRef.current || time < categoryResumeAtRef.current || rail.scrollWidth <= rail.clientWidth) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }
      const max = rail.scrollWidth - rail.clientWidth;
      let next = categoryPositionRef.current + categoryDirectionRef.current * settings.autoScrollSpeed * (elapsed / 34);
      if (next >= max) {
        next = max;
        categoryDirectionRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        categoryDirectionRef.current = 1;
      }
      categoryPositionRef.current = next;
      rail.scrollLeft = next;
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activeDevice, categoryListKey, settings.autoScroll, settings.autoScrollSpeed, settings.desktopEdgeScrollPadding, settings.mobileEdgeScrollPadding]);

  function updateCategoryProgress() {
    const rail = categoriesRef.current;
    if (!rail) return;
    const time = performance.now();
    if (categoryPointerActiveRef.current || time < categoryResumeAtRef.current) {
      const nextPosition = rail.scrollLeft;
      if (nextPosition > categoryPositionRef.current + .25) categoryDirectionRef.current = 1;
      if (nextPosition < categoryPositionRef.current - .25) categoryDirectionRef.current = -1;
      categoryPositionRef.current = nextPosition;
      if (!categoryPointerActiveRef.current) categoryResumeAtRef.current = time + 900;
    }
    const max = rail.scrollWidth - rail.clientWidth;
    setCategoryProgress(max > 0 ? Math.min(100, Math.max(0, (rail.scrollLeft / max) * 100)) : 100);
  }

  function startCategoryInteraction() {
    categoryPointerActiveRef.current = true;
    categoryPausedRef.current = true;
    categoryResumeAtRef.current = Number.POSITIVE_INFINITY;
    categoryPositionRef.current = categoriesRef.current?.scrollLeft || 0;
  }

  function finishCategoryInteraction() {
    categoryPositionRef.current = categoriesRef.current?.scrollLeft || 0;
    categoryPointerActiveRef.current = false;
    categoryPausedRef.current = false;
    categoryResumeAtRef.current = performance.now() + 900;
  }

  function pauseCategoryForWheel() {
    categoryPositionRef.current = categoriesRef.current?.scrollLeft || 0;
    categoryResumeAtRef.current = performance.now() + 900;
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function moveCards(direction: -1 | 1) {
    cardsRef.current?.scrollBy({ left: direction * Math.min(760, cardsRef.current.clientWidth * .82), behavior: "smooth" });
  }

  const desktopExtraSide = settings.desktopProgressPosition === "both" ? settings.desktopProgressExtraSpace / 2 : 0;
  const mobileExtraSide = settings.mobileProgressPosition === "both" ? settings.mobileProgressExtraSpace / 2 : 0;
  const desktopTopSpace = settings.desktopProgressPosition === "bottom" ? 0 : settings.desktopProgressGap + settings.desktopProgressThickness + desktopExtraSide;
  const desktopBottomSpace = settings.desktopProgressPosition === "top" ? 0 : settings.desktopProgressGap + settings.desktopProgressThickness + desktopExtraSide;
  const mobileTopSpace = settings.mobileProgressPosition === "bottom" ? 0 : settings.mobileProgressGap + settings.mobileProgressThickness + mobileExtraSide;
  const mobileBottomSpace = settings.mobileProgressPosition === "top" ? 0 : settings.mobileProgressGap + settings.mobileProgressThickness + mobileExtraSide;

  return (
    <>
    <section
      className={`${styles.page}${embedded ? ` ${styles.embedded}` : ""}${previewDevice === "mobile" ? ` ${styles.forceMobile}` : ""}`}
      style={{
        "--dm-desktop-overlap": `${settings.desktopOverlap}px`,
        "--dm-mobile-overlap": `${settings.mobileOverlap}px`,
        "--dm-desktop-card-width": `${settings.desktopCardWidth}px`,
        "--dm-desktop-card-height": `${settings.desktopCardHeight}px`,
        "--dm-mobile-card-width": `${settings.mobileCardWidth}px`,
        "--dm-mobile-card-height": `${settings.mobileCardHeight}px`,
        "--dm-desktop-card-gap": `${settings.desktopCardGap}px`,
        "--dm-mobile-card-gap": `${settings.mobileCardGap}px`,
        "--dm-desktop-edge-scroll-padding": `${settings.desktopEdgeScrollPadding}px`,
        "--dm-mobile-edge-scroll-padding": `${settings.mobileEdgeScrollPadding}px`,
        "--dm-desktop-content-gap": `${settings.desktopContentGap}px`,
        "--dm-mobile-content-gap": `${settings.mobileContentGap}px`,
        "--dm-desktop-progress-start": settings.desktopProgressStartColor,
        "--dm-desktop-progress-end": settings.desktopProgressEndColor,
        "--dm-desktop-progress-track": settings.desktopProgressTrackColor,
        "--dm-mobile-progress-start": settings.mobileProgressStartColor,
        "--dm-mobile-progress-end": settings.mobileProgressEndColor,
        "--dm-mobile-progress-track": settings.mobileProgressTrackColor,
        "--dm-desktop-progress-top-space": `${desktopTopSpace}px`,
        "--dm-desktop-progress-bottom-space": `${desktopBottomSpace}px`,
        "--dm-mobile-progress-top-space": `${mobileTopSpace}px`,
        "--dm-mobile-progress-bottom-space": `${mobileBottomSpace}px`,
        "--dm-desktop-progress-thickness": `${settings.desktopProgressThickness}px`,
        "--dm-mobile-progress-thickness": `${settings.mobileProgressThickness}px`,
        "--dm-desktop-category-alignment": settings.desktopCategoryAlignment === "center" ? "safe center" : "flex-start",
        "--dm-desktop-image-fit": settings.desktopImageFit,
        "--dm-mobile-image-fit": settings.mobileImageFit,
        "--dm-desktop-image-position": settings.desktopImagePosition,
        "--dm-mobile-image-position": settings.mobileImagePosition,
        "--dm-desktop-radius": `${settings.desktopBorderRadius}px`,
        "--dm-mobile-radius": `${settings.mobileBorderRadius}px`,
        "--dm-desktop-border-width": `${settings.desktopBorderWidth}px`,
        "--dm-mobile-border-width": `${settings.mobileBorderWidth}px`,
        "--dm-desktop-border-color": settings.desktopBorderColor,
        "--dm-mobile-border-color": settings.mobileBorderColor,
        "--dm-desktop-shadow": shadowValue[settings.desktopShadow],
        "--dm-mobile-shadow": shadowValue[settings.mobileShadow],
        "--dm-desktop-image-bg": settings.desktopImageBackgroundColor,
        "--dm-mobile-image-bg": settings.mobileImageBackgroundColor,
        "--dm-lower-desktop-display": "block",
        "--dm-lower-mobile-display": "block",
        "--dm-lower-desktop-max": `${settings.lowerDesktop.sectionMaxWidth}px`,
        "--dm-lower-mobile-max": `${settings.lowerMobile.sectionMaxWidth}px`,
        "--dm-lower-desktop-padding": `${settings.lowerDesktop.sectionPadding}px`,
        "--dm-lower-mobile-padding": `${settings.lowerMobile.sectionPadding}px`,
        "--dm-lower-desktop-gap": `${settings.lowerDesktop.sectionGap}px`,
        "--dm-lower-mobile-gap": `${settings.lowerMobile.sectionGap}px`,
        "--dm-lower-desktop-heading-gap": `${settings.lowerDesktop.headingGap}px`,
        "--dm-lower-mobile-heading-gap": `${settings.lowerMobile.headingGap}px`,
        "--dm-lower-desktop-heading-display": settings.lowerDesktop.showHeading ? "flex" : "none",
        "--dm-lower-mobile-heading-display": settings.lowerMobile.showHeading ? "flex" : "none",
        "--dm-lower-desktop-bottom-gap": `${settings.lowerDesktop.sectionBottomGap}px`,
        "--dm-lower-mobile-bottom-gap": `${settings.lowerMobile.sectionBottomGap}px`,
        "--dm-lower-desktop-card-width": `${settings.lowerDesktop.cardWidth}px`,
        "--dm-lower-mobile-card-width": `${settings.lowerMobile.cardWidth}px`,
        "--dm-lower-desktop-card-gap": `${settings.lowerDesktop.cardGap}px`,
        "--dm-lower-mobile-card-gap": `${settings.lowerMobile.cardGap}px`,
        "--dm-lower-desktop-card-radius": `${settings.lowerDesktop.cardRadius}px`,
        "--dm-lower-mobile-card-radius": `${settings.lowerMobile.cardRadius}px`,
        "--dm-lower-desktop-card-padding": `${settings.lowerDesktop.cardPadding}px`,
        "--dm-lower-mobile-card-padding": `${settings.lowerMobile.cardPadding}px`,
        "--dm-lower-desktop-card-bg": settings.lowerDesktop.cardBackground,
        "--dm-lower-mobile-card-bg": settings.lowerMobile.cardBackground,
        "--dm-lower-desktop-border": `${settings.lowerDesktop.cardBorderWidth}px solid ${settings.lowerDesktop.cardBorderColor}`,
        "--dm-lower-mobile-border": `${settings.lowerMobile.cardBorderWidth}px solid ${settings.lowerMobile.cardBorderColor}`,
        "--dm-lower-desktop-shadow": shadowValue[settings.lowerDesktop.cardShadow],
        "--dm-lower-mobile-shadow": shadowValue[settings.lowerMobile.cardShadow],
        "--dm-lower-desktop-image-display": settings.lowerDesktop.imageVisible ? "block" : "none",
        "--dm-lower-mobile-image-display": settings.lowerMobile.imageVisible ? "block" : "none",
        "--dm-lower-desktop-image-height": `${settings.lowerDesktop.imageHeight}px`,
        "--dm-lower-mobile-image-height": `${settings.lowerMobile.imageHeight}px`,
        "--dm-lower-desktop-image-radius": `${settings.lowerDesktop.imageRadius}px`,
        "--dm-lower-mobile-image-radius": `${settings.lowerMobile.imageRadius}px`,
        "--dm-lower-desktop-image-fit": settings.lowerDesktop.imageFit,
        "--dm-lower-mobile-image-fit": settings.lowerMobile.imageFit,
        "--dm-lower-desktop-title-size": `${settings.lowerDesktop.titleSize}px`,
        "--dm-lower-mobile-title-size": `${settings.lowerMobile.titleSize}px`,
        "--dm-lower-desktop-title-color": settings.lowerDesktop.titleColor,
        "--dm-lower-mobile-title-color": settings.lowerMobile.titleColor,
        "--dm-lower-desktop-title-weight": settings.lowerDesktop.titleWeight,
        "--dm-lower-mobile-title-weight": settings.lowerMobile.titleWeight,
        "--dm-lower-desktop-title-display": settings.lowerDesktop.titleVisible ? "block" : "none",
        "--dm-lower-mobile-title-display": settings.lowerMobile.titleVisible ? "block" : "none",
        "--dm-lower-desktop-description-display": settings.lowerDesktop.descriptionVisible ? "block" : "none",
        "--dm-lower-mobile-description-display": settings.lowerMobile.descriptionVisible ? "block" : "none",
        "--dm-lower-desktop-description-size": `${settings.lowerDesktop.descriptionSize}px`,
        "--dm-lower-mobile-description-size": `${settings.lowerMobile.descriptionSize}px`,
        "--dm-lower-desktop-description-color": settings.lowerDesktop.descriptionColor,
        "--dm-lower-mobile-description-color": settings.lowerMobile.descriptionColor,
        "--dm-lower-desktop-choice-height": `${settings.lowerDesktop.priceButtonHeight}px`,
        "--dm-lower-mobile-choice-height": `${settings.lowerMobile.priceButtonHeight}px`,
        "--dm-lower-desktop-choice-radius": `${settings.lowerDesktop.priceButtonRadius}px`,
        "--dm-lower-mobile-choice-radius": `${settings.lowerMobile.priceButtonRadius}px`,
        "--dm-lower-desktop-choice-bg": settings.lowerDesktop.priceBackground,
        "--dm-lower-mobile-choice-bg": settings.lowerMobile.priceBackground,
        "--dm-lower-desktop-choice-color": settings.lowerDesktop.priceTextColor,
        "--dm-lower-mobile-choice-color": settings.lowerMobile.priceTextColor,
        "--dm-lower-desktop-selected-bg": settings.lowerDesktop.selectedPriceBackground,
        "--dm-lower-mobile-selected-bg": settings.lowerMobile.selectedPriceBackground,
        "--dm-lower-desktop-selected-color": settings.lowerDesktop.selectedPriceTextColor,
        "--dm-lower-mobile-selected-color": settings.lowerMobile.selectedPriceTextColor,
        "--dm-lower-desktop-action-height": `${settings.lowerDesktop.actionButtonHeight}px`,
        "--dm-lower-mobile-action-height": `${settings.lowerMobile.actionButtonHeight}px`,
        "--dm-lower-desktop-action-radius": `${settings.lowerDesktop.actionButtonRadius}px`,
        "--dm-lower-mobile-action-radius": `${settings.lowerMobile.actionButtonRadius}px`,
        "--dm-lower-desktop-action-bg": settings.lowerDesktop.actionButtonBackground,
        "--dm-lower-mobile-action-bg": settings.lowerMobile.actionButtonBackground,
        "--dm-lower-desktop-action-color": settings.lowerDesktop.actionButtonTextColor,
        "--dm-lower-mobile-action-color": settings.lowerMobile.actionButtonTextColor,
        "--dm-arrow-desktop-size": `${settings.lowerDesktop.arrowSize}px`,
        "--dm-arrow-mobile-size": `${settings.lowerMobile.arrowSize}px`,
        "--dm-arrow-desktop-icon-size": `${settings.lowerDesktop.arrowIconSize}px`,
        "--dm-arrow-mobile-icon-size": `${settings.lowerMobile.arrowIconSize}px`,
        "--dm-arrow-desktop-offset": `${settings.lowerDesktop.arrowOffset}px`,
        "--dm-arrow-mobile-offset": `${settings.lowerMobile.arrowOffset}px`,
        "--dm-arrow-desktop-y": `${settings.lowerDesktop.arrowVerticalPosition}%`,
        "--dm-arrow-mobile-y": `${settings.lowerMobile.arrowVerticalPosition}%`,
        "--dm-arrow-desktop-radius": `${settings.lowerDesktop.arrowRadius}%`,
        "--dm-arrow-mobile-radius": `${settings.lowerMobile.arrowRadius}%`,
        "--dm-arrow-desktop-bg": settings.lowerDesktop.arrowBackground,
        "--dm-arrow-mobile-bg": settings.lowerMobile.arrowBackground,
        "--dm-arrow-desktop-color": settings.lowerDesktop.arrowColor,
        "--dm-arrow-mobile-color": settings.lowerMobile.arrowColor,
        "--dm-arrow-desktop-opacity": settings.lowerDesktop.arrowOpacity / 100,
        "--dm-arrow-mobile-opacity": settings.lowerMobile.arrowOpacity / 100,
        "--dm-arrow-desktop-border": `${settings.lowerDesktop.arrowBorderWidth}px solid ${settings.lowerDesktop.arrowBorderColor}`,
        "--dm-arrow-mobile-border": `${settings.lowerMobile.arrowBorderWidth}px solid ${settings.lowerMobile.arrowBorderColor}`,
        "--dm-arrow-desktop-shadow": shadowValue[settings.lowerDesktop.arrowShadow],
        "--dm-arrow-mobile-shadow": shadowValue[settings.lowerMobile.arrowShadow],
      } as CSSProperties}
    >
      {!embedded && <div className={styles.previewBar}>
        <span><i /> DENEME ALANI</span>
        <p>Bu sayfada gerçek ödeme alınmaz.</p>
        <Link href="/">Siteye dön →</Link>
      </div>}

      <section className={styles.moduleShell}>
        <div className={styles.categoryScroller}>
          <div
            className={styles.categoryRail}
            aria-label="Bağış kategorileri"
            ref={categoriesRef}
            onScroll={updateCategoryProgress}
            onPointerDown={(event) => {
              startCategoryInteraction();
              if (event.pointerType === "mouse" && event.button === 0) {
                categoryMouseDragRef.current = {
                  active: true,
                  moved: false,
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startScroll: event.currentTarget.scrollLeft,
                };
              }
            }}
            onPointerMove={(event) => {
              const drag = categoryMouseDragRef.current;
              if (!drag.active || event.pointerType !== "mouse") return;
              const distance = event.clientX - drag.startX;
              if (!drag.moved && Math.abs(distance) < 6) return;
              if (!drag.moved) {
                drag.moved = true;
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }
              event.preventDefault();
              event.currentTarget.scrollLeft = drag.startScroll - distance;
              categoryPositionRef.current = event.currentTarget.scrollLeft;
            }}
            onPointerUp={(event) => {
              if (categoryMouseDragRef.current.moved) categoryLastDragAtRef.current = performance.now();
              categoryMouseDragRef.current.active = false;
              finishCategoryInteraction();
              if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={(event) => {
              if (categoryMouseDragRef.current.moved) categoryLastDragAtRef.current = performance.now();
              categoryMouseDragRef.current.active = false;
              finishCategoryInteraction();
              if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerLeave={(event) => {
              const drag = categoryMouseDragRef.current;
              if (!drag.active || drag.moved || event.currentTarget.hasPointerCapture?.(drag.pointerId)) return;
              drag.active = false;
              finishCategoryInteraction();
            }}
            onWheel={pauseCategoryForWheel}
          >
            {visibleCategories.map((item) => (
              <button
                className={effectiveCategory === item.id ? styles.activeCategory : ""}
                key={item.id}
                onClick={(event) => {
                  if (performance.now() - categoryLastDragAtRef.current < 180) {
                    event.preventDefault();
                    return;
                  }
                  setCategory(item.id);
                  onCategoryChange?.(item.id);
                }}
                aria-label={item.label}
                title={item.label}
              >
                <CategoryImage category={item} className={styles.desktopCategoryImage} src={settings.categoryImages[item.id]?.desktop ?? ""} sizes="(max-width: 640px) 1px, 190px" />
                <CategoryImage category={item} className={styles.mobileCategoryImage} src={settings.categoryImages[item.id]?.mobile ?? ""} sizes="(max-width: 640px) 118px, 1px" />
              </button>
            ))}
          </div>
          {settings.showProgress ? <>
            <span className={`${styles.categoryProgress} ${styles.categoryProgressTop}${settings.desktopProgressPosition === "bottom" ? ` ${styles.desktopProgressOff}` : ""}${settings.mobileProgressPosition === "bottom" ? ` ${styles.mobileProgressOff}` : ""}`} aria-hidden="true"><i style={{ width: `${categoryProgress}%` }} /></span>
            <span className={`${styles.categoryProgress} ${styles.categoryProgressBottom}${settings.desktopProgressPosition === "top" ? ` ${styles.desktopProgressOff}` : ""}${settings.mobileProgressPosition === "top" ? ` ${styles.mobileProgressOff}` : ""}`} aria-hidden="true"><i style={{ width: `${categoryProgress}%` }} /></span>
          </> : null}
        </div>

        <div className={`${styles.contentGrid}${settings.lowerDesktop.layout === "grid" ? ` ${styles.desktopGrid}` : ""}${settings.lowerMobile.layout === "grid" ? ` ${styles.mobileGrid}` : ""}`}>
            <div className={styles.sectionHeading}>
              <div className={styles.desktopLowerHeading} style={{ display: settings.lowerDesktop.showHeading ? undefined : "none" }}><span>{settings.lowerDesktop.headingEyebrow}</span><h2>{settings.lowerDesktop.headingTitle}</h2></div>
              <div className={styles.mobileLowerHeading} style={{ display: settings.lowerMobile.showHeading ? undefined : "none" }}><span>{settings.lowerMobile.headingEyebrow}</span><h2>{settings.lowerMobile.headingTitle}</h2></div>
            </div>
            <div className={styles.cardsViewport}>
              <button className={`${styles.sideArrow} ${styles.sideArrowLeft}${!settings.lowerDesktop.arrowsVisible || !settings.lowerDesktop.leftArrowVisible ? ` ${styles.desktopArrowOff}` : ""}${!settings.lowerMobile.arrowsVisible || !settings.lowerMobile.leftArrowVisible ? ` ${styles.mobileArrowOff}` : ""}`} type="button" aria-label="Önceki bağış projeleri" onClick={() => moveCards(-1)}><span className={styles.desktopArrowSymbol}>{arrowSymbols[settings.lowerDesktop.arrowIcon][0]}</span><span className={styles.mobileArrowSymbol}>{arrowSymbols[settings.lowerMobile.arrowIcon][0]}</span></button>
              <div className={styles.cards} ref={cardsRef}>
              {filtered.map((project) => {
                const sharedDesign = (projectDesign: typeof project.desktop, common: typeof settings.lowerDesktop) => projectDesign.useSharedDesign ? {
                  ...projectDesign,
                  cardWidth: common.cardWidth,
                  cardPadding: common.cardPadding,
                  cardBackground: common.cardBackground,
                  cardRadius: common.cardRadius,
                  cardBorderColor: common.cardBorderColor,
                  cardBorderWidth: common.cardBorderWidth,
                  imageHeight: common.imageHeight,
                  imageRadius: common.imageRadius,
                  titleColor: common.titleColor,
                  titleSize: common.titleSize,
                  titleWeight: common.titleWeight,
                  descriptionColor: common.descriptionColor,
                  descriptionSize: common.descriptionSize,
                } : projectDesign;
                const desktopDesign = sharedDesign(project.desktop, settings.lowerDesktop);
                const mobileDesign = sharedDesign(project.mobile, settings.lowerMobile);
                const activeProjectDesign = activeDevice === "mobile" ? project.mobile : project.desktop;
                const activeSharedDesign = activeDevice === "mobile" ? settings.lowerMobile : settings.lowerDesktop;
                const activeImageDesign = activeProjectDesign.useSharedImageDesign !== false ? activeSharedDesign : activeProjectDesign;
                const activeMedia = activeDevice === "mobile" ? project.mobileMedia || [] : project.desktopMedia || [];
                const mediaPreferences = resolveCardMediaPreferences(
                  activeProjectDesign as CardMediaPreferences & { useSharedImageDesign?: boolean },
                  activeSharedDesign as CardMediaPreferences,
                );
                return (
                  <article className={`${styles.card}${isAllCategory && project.showInAllDesktop === false ? ` ${styles.allDesktopHidden}` : ""}${isAllCategory && project.showInAllMobile === false ? ` ${styles.allMobileHidden}` : ""}`} key={project.id} style={{
                    "--dm-all-desktop-order": project.allOrderDesktop ?? 0,
                    "--dm-all-mobile-order": project.allOrderMobile ?? 0,
                    "--dm-lower-desktop-card-width": `${desktopDesign.cardWidth}px`,
                    "--dm-lower-mobile-card-width": `${mobileDesign.cardWidth}px`,
                    "--dm-lower-desktop-card-padding": `${desktopDesign.cardPadding}px`,
                    "--dm-lower-mobile-card-padding": `${mobileDesign.cardPadding}px`,
                    "--dm-lower-desktop-card-bg": desktopDesign.cardBackground,
                    "--dm-lower-mobile-card-bg": mobileDesign.cardBackground,
                    "--dm-lower-desktop-card-radius": `${desktopDesign.cardRadius}px`,
                    "--dm-lower-mobile-card-radius": `${mobileDesign.cardRadius}px`,
                    "--dm-lower-desktop-border": `${desktopDesign.cardBorderWidth}px solid ${desktopDesign.cardBorderColor}`,
                    "--dm-lower-mobile-border": `${mobileDesign.cardBorderWidth}px solid ${mobileDesign.cardBorderColor}`,
                    "--dm-lower-desktop-image-height": `${desktopDesign.useSharedImageDesign !== false ? settings.lowerDesktop.imageHeight : desktopDesign.imageHeight}px`,
                    "--dm-lower-mobile-image-height": `${mobileDesign.useSharedImageDesign !== false ? settings.lowerMobile.imageHeight : mobileDesign.imageHeight}px`,
                    "--dm-lower-desktop-image-display": desktopDesign.imageVisible === false ? "none" : "block",
                    "--dm-lower-mobile-image-display": mobileDesign.imageVisible === false ? "none" : "block",
                    "--dm-lower-desktop-image-fit": desktopDesign.useSharedImageDesign !== false ? settings.lowerDesktop.imageFit : desktopDesign.imageFit || "cover",
                    "--dm-lower-mobile-image-fit": mobileDesign.useSharedImageDesign !== false ? settings.lowerMobile.imageFit : mobileDesign.imageFit || "cover",
                    "--dm-lower-desktop-title-color": desktopDesign.titleColor,
                    "--dm-lower-mobile-title-color": mobileDesign.titleColor,
                    "--dm-lower-desktop-title-size": `${desktopDesign.titleSize}px`,
                    "--dm-lower-mobile-title-size": `${mobileDesign.titleSize}px`,
                    "--dm-lower-desktop-title-weight": desktopDesign.titleWeight,
                    "--dm-lower-mobile-title-weight": mobileDesign.titleWeight,
                    "--dm-lower-desktop-description-color": desktopDesign.descriptionColor,
                    "--dm-lower-mobile-description-color": mobileDesign.descriptionColor,
                    "--dm-lower-desktop-description-size": `${desktopDesign.descriptionSize}px`,
                    "--dm-lower-mobile-description-size": `${mobileDesign.descriptionSize}px`,
                    "--dm-lower-desktop-choice-height": `${desktopDesign.priceButtonHeight}px`,
                    "--dm-lower-mobile-choice-height": `${mobileDesign.priceButtonHeight}px`,
                    "--dm-lower-desktop-choice-radius": `${desktopDesign.priceButtonRadius}px`,
                    "--dm-lower-mobile-choice-radius": `${mobileDesign.priceButtonRadius}px`,
                    "--dm-lower-desktop-choice-bg": desktopDesign.priceBackground,
                    "--dm-lower-mobile-choice-bg": mobileDesign.priceBackground,
                    "--dm-lower-desktop-choice-color": desktopDesign.priceTextColor,
                    "--dm-lower-mobile-choice-color": mobileDesign.priceTextColor,
                    "--dm-lower-desktop-selected-bg": desktopDesign.selectedPriceBackground,
                    "--dm-lower-mobile-selected-bg": mobileDesign.selectedPriceBackground,
                    "--dm-lower-desktop-selected-color": desktopDesign.selectedPriceTextColor,
                    "--dm-lower-mobile-selected-color": mobileDesign.selectedPriceTextColor,
                    "--dm-lower-desktop-action-bg": desktopDesign.actionBackground,
                    "--dm-lower-mobile-action-bg": mobileDesign.actionBackground,
                    "--dm-lower-desktop-action-color": desktopDesign.actionTextColor,
                    "--dm-lower-mobile-action-color": mobileDesign.actionTextColor,
                    "--dm-lower-desktop-action-height": `${desktopDesign.actionHeight}px`,
                    "--dm-lower-mobile-action-height": `${mobileDesign.actionHeight}px`,
                    "--dm-lower-desktop-action-radius": `${desktopDesign.actionRadius}px`,
                    "--dm-lower-mobile-action-radius": `${mobileDesign.actionRadius}px`,
                  } as CSSProperties}>
                    <CardMedia
                      key={`${project.id}:${activeDevice}`}
                      media={activeMedia}
                      title={project.title}
                      preferences={mediaPreferences}
                      imageHeight={numberSetting(activeImageDesign.imageHeight, activeDevice === "mobile" ? 205 : 218, 80, 800)}
                      imageRadius={numberSetting(activeImageDesign.imageRadius, 0, 0, 100)}
                      imageFit={activeImageDesign.imageFit === "contain" ? "contain" : "cover"}
                      visible={activeProjectDesign.imageVisible !== false}
                      onOpenVideo={(media, trigger) => {
                        videoModalTriggerRef.current = trigger;
                        setVideoModal({
                          src: media.url,
                          poster: media.poster,
                          title: media.alt || `${project.title} videosu`,
                          preferences: mediaPreferences,
                        });
                      }}
                    />
                    <div className={styles.cardBody}>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <DonationCardCommerce project={project} device={activeDevice} onNotice={showNotice} />
                    </div>
                  </article>
                );
              })}
              </div>
              <button className={`${styles.sideArrow} ${styles.sideArrowRight}${!settings.lowerDesktop.arrowsVisible || !settings.lowerDesktop.rightArrowVisible ? ` ${styles.desktopArrowOff}` : ""}${!settings.lowerMobile.arrowsVisible || !settings.lowerMobile.rightArrowVisible ? ` ${styles.mobileArrowOff}` : ""}`} type="button" aria-label="Sonraki bağış projeleri" onClick={() => moveCards(1)}><span className={styles.desktopArrowSymbol}>{arrowSymbols[settings.lowerDesktop.arrowIcon][1]}</span><span className={styles.mobileArrowSymbol}>{arrowSymbols[settings.lowerMobile.arrowIcon][1]}</span></button>
            </div>
        </div>
      </section>
      {notice && <div className={styles.toast}>{notice}</div>}
    </section>
    {videoModal && typeof document !== "undefined" ? createPortal(
      <div
        className={styles.videoModalBackdrop}
        style={{
          "--dm-video-modal-width": `${videoModal.preferences.modalWidth}px`,
          "--dm-video-modal-radius": `${videoModal.preferences.modalRadius}px`,
          "--dm-video-modal-backdrop": `rgba(4, 18, 15, ${videoModal.preferences.modalBackdropOpacity / 100})`,
        } as CSSProperties}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setVideoModal(null);
        }}
      >
        <div
          className={styles.videoModal}
          ref={videoModalPanelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="donation-video-modal-title"
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const focusable = [...(videoModalPanelRef.current?.querySelectorAll<HTMLElement>("button, video[controls], [href], [tabindex]:not([tabindex='-1'])") || [])]
              .filter((element) => !element.hasAttribute("disabled"));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }}
        >
          <h2 id="donation-video-modal-title" className={styles.videoModalTitle}>{videoModal.title}</h2>
          <button ref={videoModalCloseRef} className={styles.videoModalClose} type="button" aria-label="Videoyu kapat" onClick={() => setVideoModal(null)}>×</button>
          <video key={videoModal.src} src={videoModal.src} poster={videoModal.poster} controls autoPlay playsInline preload="none" />
        </div>
      </div>,
      document.body,
    ) : null}
    </>
  );
}
