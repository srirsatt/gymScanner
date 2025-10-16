import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useColorScheme } from 'react-native';
import { Navigation } from './navigation';
import "../global.css"

import { ModelProvider, useTFLiteModel } from './providers/ModelProvider';

Asset.loadAsync([
  ...NavigationAssets,
  require('./assets/home.png'),
  require('./assets/scanner.png'),
]);

SplashScreen.preventAutoHideAsync();

// TFLITE -> model context


const prefix = createURL('/');

function AppInner() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme

    const [navReady, setNavReady] = React.useState(false);
    const { ready: modelReady } = useTFLiteModel();

    React.useEffect(() => {
      if (navReady && modelReady) {
        SplashScreen.hideAsync().catch(() => {});
      }
    }, [navReady, modelReady]);

    return (
      /*
      <Navigation
        theme={theme}
        linking={{
          enabled: 'auto',
          prefixes: [prefix],
        }}
        onReady={() => {
          SplashScreen.hideAsync();
        }}
      />
      */

      <Navigation 
        theme={theme}
        linking={{
          enabled: 'auto',
          prefixes: [prefix],
        }}      
        onReady={() => {
          setNavReady(true)
        }}
      />
  );
}

export default function App() {
  return (
    <ModelProvider>
      <Navigation />
    </ModelProvider>
  );
}

