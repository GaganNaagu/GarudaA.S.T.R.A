# REACT NATIVE + EXPO NATIVE UI RULES

## Native Ergonomics (Anti-Web-Slop)
- **Platform Fidelity:** Follow Apple Human Interface Guidelines (iOS) and Material 3 (Android). Never build web-style top navbars, web-style hover states, or HTML-like tables on mobile.
- **Navigation & Sheets:**
  - Use native stack headers (`headerLargeTitle` on iOS where appropriate) and native bottom tab bars (max 4–5 tabs).
  - Replace web modals/dialogs with native bottom sheets (`@gorhom/bottom-sheet` or native formSheet presentations).
- **Touch & Ergonomics:**
  - Every tappable element MUST have a minimum touch target of `44x44pt` (`hitSlop` if visually smaller).
  - Respect `SafeAreaView` / `useSafeAreaInsets` on every screen.
  - Keep primary actions within thumb reach (bottom third of the screen).
- **Lists & Performance:**
  - Use `FlashList` or `FlatList` for dynamic lists—never `.map()` inside a `ScrollView` for long datasets.
  - Use `expo-haptics` subtly on primary confirmations and tab/toggle switches.
  - Use React Native Reanimated worklets for smooth 60fps gesture and layout transitions.
