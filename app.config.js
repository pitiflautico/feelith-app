/**
 * Expo App Configuration
 *
 * This file dynamically generates the app configuration based on src/config/config.js
 * When creating a new app from this base:
 * 1. Update src/config/config.js with your app settings
 * 2. Update the values below (name, slug, bundleIdentifier, package)
 * 3. The deep linking configuration will be automatically applied from config.js
 */

const config = require('./src/config/config.js');

module.exports = {
  expo: {
    // ===== APP IDENTITY =====
    // Automatically configured from src/config/config.js
    name: config.APP_TITLE,
    slug: config.APP_SLUG,
    version: config.APP_VERSION,

    // ===== BASIC CONFIGURATION =====
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    // ===== DEEP LINKING =====
    // Automatically configured from src/config/config.js
    scheme: config.DEEP_LINK_SCHEME,

    // ===== IOS CONFIGURATION =====
    ios: {
      supportsTablet: true,
      bundleIdentifier: config.IOS_BUNDLE_ID,
      // Universal Links - automatically added if ASSOCIATED_DOMAINS is configured
      ...(config.ASSOCIATED_DOMAINS.length > 0 && {
        associatedDomains: config.ASSOCIATED_DOMAINS.map(
          domain => `applinks:${domain}`
        ),
      }),
    },

    // ===== ANDROID CONFIGURATION =====
    android: {
      package: config.ANDROID_PACKAGE,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // App Links - automatically added if ASSOCIATED_DOMAINS is configured
      ...(config.ASSOCIATED_DOMAINS.length > 0 && {
        intentFilters: config.ASSOCIATED_DOMAINS.map(domain => ({
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: domain,
            },
            {
              scheme: 'http',
              host: domain,
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        })),
      }),
    },

    // ===== PUSH NOTIFICATIONS =====
    notification: {
      icon: './assets/images/notification-icon.png',
      color: config.COLORS.PRIMARY,
      androidMode: 'default',
      androidCollapsedTitle: 'New notification',
    },

    // ===== WEB CONFIGURATION =====
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    // ===== PLUGINS =====
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-localization',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: config.COLORS.PRIMARY,
          defaultChannel: 'default',
        },
      ],
    ],

    // ===== EXPERIMENTS =====
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
