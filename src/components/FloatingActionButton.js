import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import config from '../config/config';

const { width } = Dimensions.get('window');

/**
 * Floating Action Button with expandable menu
 *
 * Shows a floating "+" button in the bottom-right corner.
 * When pressed, expands to show quick action options.
 * Only visible when user is logged in.
 */
export default function FloatingActionButton({ isLoggedIn, onNavigate, onCameraOpen }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Don't render if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;

    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue,
        useNativeDriver: true,
        friction: 8,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const handleAction = (menuItem) => {
    // Close menu
    toggleMenu();

    // Handle action after a short delay for smooth animation
    setTimeout(() => {
      if (menuItem.action === 'camera') {
        // Open camera
        if (onCameraOpen && typeof onCameraOpen === 'function') {
          onCameraOpen();
        }
      } else if (menuItem.path) {
        // Navigate to path
        if (onNavigate && typeof onNavigate === 'function') {
          onNavigate(menuItem.path);
        }
      }
    }, 200);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const menuActions = [
    {
      id: 'new-mood',
      label: 'New Mood',
      icon: '😊',
      path: '/mood/new',
    },
    {
      id: 'photo-selfie',
      label: 'Photo Selfie',
      icon: '📸',
      action: 'camera',
    },
  ];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop overlay when menu is open */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Menu items */}
      <View style={styles.menuContainer} pointerEvents="box-none">
        {menuActions.map((action, index) => (
          <Animated.View
            key={action.id}
            style={[
              styles.menuItemContainer,
              {
                opacity: scaleAnim,
                transform: [
                  {
                    translateY: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -(index + 1) * 65],
                    }),
                  },
                  {
                    scale: scaleAnim,
                  },
                ],
              },
            ]}
            pointerEvents={isExpanded ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleAction(action)}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemLabel}>{action.label}</Text>
                <View style={styles.menuItemIcon}>
                  <Text style={styles.iconText}>{action.icon}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Main FAB button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Text style={styles.fabIcon}>+</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  menuItemContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 150,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: config.COLORS.TEXT_PRIMARY,
    marginRight: 12,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: config.COLORS.PRIMARY + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: config.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabIcon: {
    fontSize: 32,
    fontWeight: '300',
    color: 'white',
    lineHeight: 32,
  },
});
