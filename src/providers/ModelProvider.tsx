import * as React from 'react';
import { Asset } from 'expo-asset';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

type ModelCtx = { model: TensorflowModel | null; ready: boolean}; 
const ModelContext = React.createContext<ModelCtx>({ model: null, ready: false});
export const useTFLiteModel = () => React.useContext(ModelContext);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = React.useState<TensorflowModel | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const moduleId = require('../assets/model.tflite');
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