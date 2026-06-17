// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

/**
 * MediVac One icon mappings - SF Symbols to Material Icons
 */
const MAPPING: Record<string, MaterialIconName> = {
  // Tab bar icons
  "house.fill": "home",
  "person.2.fill": "people",
  "calendar": "event",
  "checklist": "checklist",
  "square.grid.2x2.fill": "apps",
  // Navigation icons
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  "xmark": "close",
  "plus": "add",
  // Medical icons
  "heart.fill": "favorite",
  "cross.fill": "local-hospital",
  "pills.fill": "medication",
  "stethoscope": "medical-services",
  "waveform.path.ecg": "monitor-heart",
  "bed.double.fill": "hotel",
  "syringe.fill": "vaccines",
  // Communication icons
  "message.fill": "message",
  "bell.fill": "notifications",
  "megaphone.fill": "campaign",
  "bubble.left.and.bubble.right.fill": "forum",
  // Task icons
  "checkmark.circle.fill": "check-circle",
  "clock.fill": "schedule",
  "flag.fill": "flag",
  // Analytics icons
  "chart.bar.fill": "bar-chart",
  "chart.pie.fill": "pie-chart",
  "arrow.up.right": "trending-up",
  // Settings icons
  "gear": "settings",
  "person.fill": "person",
  "lock.fill": "lock",
  "wifi": "wifi",
  // JEDI icons
  "network": "hub",
  "globe": "language",
  "shield.fill": "security",
  "arrow.triangle.2.circlepath": "sync",
  // General icons
  "magnifyingglass": "search",
  "paperplane.fill": "send",
  "doc.fill": "description",
  "folder.fill": "folder",
  "trash.fill": "delete",
  "pencil": "edit",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "xmark.circle.fill": "cancel",
  // Contact icons
  "phone.fill": "phone",
  "envelope.fill": "email",
  // Additional icons
  "star.fill": "star",
  "bolt.fill": "flash-on",
  "cube.fill": "inventory-2",
  "list.bullet": "list",
  "photo.fill": "photo",
  "camera.fill": "camera-alt",
  "qrcode": "qr-code-2",
  "link": "link",
  "arrow.down.circle.fill": "download",
  "arrow.up.circle.fill": "upload",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "hand.raised.fill": "pan-tool",
  "location.fill": "location-on",
  "map.fill": "map",
  "printer.fill": "print",
  "square.and.arrow.up.fill": "share",
  "bookmark.fill": "bookmark",
  "tag.fill": "label",
  "creditcard.fill": "credit-card",
  "dollarsign.circle.fill": "attach-money",
  // New v3.4 icons
  "face.smiling.fill": "sentiment-satisfied",
  "shield.checkerboard": "health-and-safety",
  "doc.text.fill": "assignment",
  "clipboard.fill": "content-paste",
  "virus.fill": "coronavirus",
  "hand.wave.fill": "waving-hand",
  // Production/Admin icons
  "server.rack": "dns",
  "cloud.fill": "cloud",
  "desktopcomputer": "computer",
  "iphone": "smartphone",
  // GP Integration icons
  "building.2.fill": "business",
  "arrow.left.arrow.right": "swap-horiz",
  "doc.badge.arrow.up.fill": "file-upload",
  "doc.badge.arrow.down.fill": "file-download",
  // AI Assistant icons
  "brain": "psychology",
  "sparkles": "auto-awesome",
  "wand.and.stars": "auto-fix-high",
  "bubble.left.fill": "chat-bubble",
  "mic.fill": "mic",
  "video.fill": "videocam",
  "figure.walk": "directions-walk",
  "flame.fill": "local-fire-department",
  // v4.4 Clinical icons
  "list.clipboard.fill": "assignment",
  "play.fill": "play-arrow",
  // v4.5 Dashboard and wearable icons
  "chart.line.uptrend.xyaxis": "show-chart",
  "applewatch": "watch",
  "antenna.radiowaves.left.and.right": "cell-tower",
  "heart.text.square.fill": "monitor-heart",
  "figure.run": "directions-run",
  "bed.double": "bed",
  "lungs.fill": "air",
  // v4.6 Authentication icons
  "key.fill": "vpn-key",
  "person.badge.key.fill": "admin-panel-settings",
  "lock.shield.fill": "verified-user",
  "rectangle.stack.person.crop.fill": "account-box",
  "person.crop.circle.badge.checkmark": "verified",
  "link.badge.plus": "add-link",
  // v4.8 JediTek Agent and Facebook icons
  "cpu": "memory",
  "f.square.fill": "facebook",
  "robot.fill": "smart-toy",
  "terminal.fill": "terminal",
  "command.fill": "keyboard-command-key",
  "bolt.horizontal.fill": "bolt",
  "gauge.high": "speed",
  "externaldrive.connected.to.line.below.fill": "storage",
  // v4.9 System Dashboard icons
  "rectangle.3.group.fill": "dashboard",
  "shield.lefthalf.filled": "shield",
  "lock.trianglebadge.exclamationmark.fill": "gpp-maybe",
  "exclamationmark.shield.fill": "gpp-bad",
  "checkmark.shield.fill": "gpp-good",
  // v5.2 Security and Admin icons
  "at": "alternate-email",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "minus": "remove",
};

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
