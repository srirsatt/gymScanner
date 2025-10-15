import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useColorScheme } from 'react-native';
import { Navigation } from './navigation';
import "../global.css"

import { loadTensorflowModel, useTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

Asset.loadAsync([
  ...NavigationAssets,
  require('./assets/home.png'),
  require('./assets/scanner.png'),
]);

SplashScreen.preventAutoHideAsync();

// TFLITE -> model context
type ModelCtx = { model: TensorflowModel | null; ready: boolean}; 
const ModelContext = React.createContext<ModelCtx>({ model: null, ready: false});
export const useTFLiteModel = () => React.useContext(ModelContext);

function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = React.useState<TensorflowModel | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const moduleId = require('./assets/model.tflite');
        const asset = Asset.fromModule(moduleId);
        await asset.downloadAsync();

        const m = await loadTensorflowModel(moduleId);
        if (!mounted) {
          return;
        }
        setModel(m);
        setReady(true);
      } catch (e) {
        console.error("model.tflite failed to load!", e);
      }
    })();

    return () => {
      mounted = false;

    };
  }, []);

  return (
    <ModelContext.Provider value = {{ model, ready }}>
      {children}
    </ModelContext.Provider>
  );
}


const prefix = createURL('/');

export function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme

  const [navReady, setNavReady] = React.useState(false);
  const { ready: modelReady } = useTFLiteModel();

  React.useEffect(() => {
    if (navReady && modelReady) {
      SplashScreen.hideAsync();
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

    <ModelProvider>
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
    </ModelProvider>

  );
}
