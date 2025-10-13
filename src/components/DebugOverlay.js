import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import config from '../config/config';

/**
 * Debug Overlay Component
 *
 * Shows debug logs on screen - only visible in development mode
 */
export default function DebugOverlay() {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [filter, setFilter] = useState('important'); // 'all', 'important', 'errors'

  useEffect(() => {
    if (!config.DEBUG) {
      return;
    }

    // Override console.log to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const addLog = (level, args) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');

    // Use setTimeout to avoid updating state during render
    setTimeout(() => {
      setLogs(prevLogs => {
        const newLogs = [...prevLogs, { timestamp, level, message }];
        // Keep only last 50 logs
        return newLogs.slice(-50);
      });
    }, 0);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleVisible = () => {
    setIsVisible(!isVisible);
  };

  const copyToClipboard = async () => {
    const filteredLogs = getFilteredLogs();
    const text = filteredLogs.map(log =>
      `[${log.timestamp}] [${log.level}] ${log.message}`
    ).join('\n');

    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${filteredLogs.length} logs copied to clipboard`);
  };

  const getFilteredLogs = () => {
    if (filter === 'all') {
      return logs;
    } else if (filter === 'errors') {
      return logs.filter(log => log.level === 'ERROR');
    } else if (filter === 'important') {
      // Show HomeScreen, WebView, NativeApp, Auth, and Error logs
      return logs.filter(log => {
        const msg = log.message.toLowerCase();
        return (
          log.level === 'ERROR' ||
          msg.includes('[homescreen]') ||
          msg.includes('[webview]') ||
          msg.includes('[nativeapp]') ||
          msg.includes('auth') ||
          msg.includes('login') ||
          msg.includes('logout') ||
          msg.includes('token') ||
          msg.includes('bridge') ||
          msg.includes('reactnativewebview') ||
          msg.includes('🔵') ||
          msg.includes('🟢') ||
          msg.includes('🔴') ||
          msg.includes('❌') ||
          msg.includes('⚠️')
        );
      });
    }
    return logs;
  };

  const cycleFilter = () => {
    if (filter === 'important') {
      setFilter('all');
    } else if (filter === 'all') {
      setFilter('errors');
    } else {
      setFilter('important');
    }
  };

  const getFilterLabel = () => {
    if (filter === 'important') return 'Important';
    if (filter === 'all') return 'All';
    return 'Errors';
  };

  // Don't render in production
  if (!config.DEBUG) {
    return null;
  }

  if (!isVisible) {
    return (
      <TouchableOpacity style={styles.hiddenButton} onPress={toggleVisible}>
        <Text style={styles.hiddenButtonText}>🐛</Text>
      </TouchableOpacity>
    );
  }

  const filteredLogs = getFilteredLogs();

  return (
    <View style={[styles.container, !isExpanded && styles.containerCollapsed]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleExpanded} style={styles.headerButton}>
          <Text style={styles.headerText}>
            {isExpanded ? '▼' : '▶'} Debug ({filteredLogs.length}/{logs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={cycleFilter} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>{getFilterLabel()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
          <Text style={styles.copyButtonText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleVisible} style={styles.hideButton}>
          <Text style={styles.hideButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      {isExpanded && (
        <ScrollView style={styles.logsContainer}>
          {filteredLogs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <Text style={[styles.logLevel, styles[`log${log.level}`]]}>
                [{log.level}]
              </Text>
              <Text style={styles.logTimestamp}>{log.timestamp}</Text>
              <Text style={styles.logMessage}>{log.message}</Text>
            </View>
          ))}
          {filteredLogs.length === 0 && (
            <Text style={styles.emptyText}>
              {logs.length > 0 ? `No logs match filter "${getFilterLabel()}"` : 'No logs yet...'}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 2,
    borderTopColor: '#00ff00',
    maxHeight: '50%',
  },
  containerCollapsed: {
    maxHeight: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    flex: 1,
  },
  headerText: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#4444ff',
    borderRadius: 4,
    marginRight: 4,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  copyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#44aa44',
    borderRadius: 4,
    marginRight: 4,
  },
  copyButtonText: {
    fontSize: 14,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ff4444',
    borderRadius: 4,
    marginRight: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hideButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#444',
    borderRadius: 4,
  },
  hideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    padding: 8,
  },
  logEntry: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logLevel: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  logLOG: {
    color: '#00ff00',
  },
  logERROR: {
    color: '#ff4444',
  },
  logWARN: {
    color: '#ffaa00',
  },
  logTimestamp: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  logMessage: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Courier',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  hiddenButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  hiddenButtonText: {
    fontSize: 24,
  },
});
