// PWA Installation Guidance Data
// Platform-specific instructions for adding the app to home screen

export const pwaSteps = {
  ios: [
    {
      id: 1,
      title: "Tap Share Button",
      description: "Look for the square icon with an arrow pointing up",
      icon: "📤",
      illustration: "⬆️",
      voiceText: "Step 1: Tap the Share button at the bottom of your screen. It looks like a square with an arrow pointing up."
    },
    {
      id: 2,
      title: "Select Add to Home Screen",
      description: "Scroll down and tap 'Add to Home Screen'",
      icon: "🏠",
      illustration: "📱",
      voiceText: "Step 2: Scroll down in the menu and tap 'Add to Home Screen'"
    },
    {
      id: 3,
      title: "Confirm Installation",
      description: "Tap 'Add' to confirm and install the app",
      icon: "✅",
      illustration: "➕",
      voiceText: "Step 3: Tap 'Add' in the top right corner to install Makenna Lab to your home screen!"
    }
  ],
  android: [
    {
      id: 1,
      title: "Open Menu",
      description: "Tap the three dots menu in Chrome",
      icon: "☰",
      illustration: "⋮",
      voiceText: "Step 1: Tap the three dots menu icon in the top right corner of Chrome"
    },
    {
      id: 2,
      title: "Install App",
      description: "Tap 'Install' or 'Add to Home Screen'",
      icon: "📲",
      illustration: "⬇️",
      voiceText: "Step 2: Tap 'Install' or 'Add to Home Screen' from the menu"
    },
    {
      id: 3,
      title: "Confirm",
      description: "Follow the prompts to install",
      icon: "✅",
      illustration: "📱",
      voiceText: "Step 3: Tap 'Add' or 'Install' to confirm. Makenna Lab will be added to your home screen!"
    }
  ],
  desktop: [
    {
      id: 1,
      title: "Click Install Icon",
      description: "Look for the install icon in address bar",
      icon: "📥",
      illustration: "⭳",
      voiceText: "Step 1: Click the install icon in your browser's address bar. It looks like a downward arrow or plus sign."
    },
    {
      id: 2,
      title: "Confirm Installation",
      description: "Click 'Install' in the popup",
      icon: "✅",
      illustration: "🖱️",
      voiceText: "Step 2: Click 'Install' in the popup that appears to install Makenna Lab."
    }
  ],
  default: [
    {
      id: 1,
      title: "Add to Home Screen",
      description: "Use your browser's menu to add the app",
      icon: "🏠",
      illustration: "📱",
      voiceText: "To add Makenna Lab to your home screen, open your browser menu and look for 'Add to Home Screen' or 'Install' option."
    }
  ]
};

// Tips for parents
export const pwaTips = {
  ios: "💡 Tip: After adding, you can tap the Makenna Lab icon on your home screen just like a regular app!",
  android: "💡 Tip: The installed app will appear in your app drawer and you can add it to your home screen!",
  desktop: "💡 Tip: The installed app will work offline and open like a desktop program!",
  default: "💡 Tip: Once installed, the app works offline and loads faster!"
};