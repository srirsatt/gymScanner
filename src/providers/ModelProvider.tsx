// model provider -> loads model on start up

import { useSyncExternalStore } from "react";
import { Asset } from 'expo-asset';
import { TensorflowModel, loadTensorflowModel } from 'react-native-fast-tflite';

type Status = 'idle' | 'loading' | 'success' | 'error';

// state for load
type ModelState = {
    model: TensorflowModel | null,
    status: Status,
    error: Error | null,
}

let state: ModelState = { model: null, status: 'idle', error: null };
const listeners = new Set<() => void>();

function emit() {
    // notify subscribers (app) when state changes
    for (const l of Array.from(listeners)) {
        l();
    }
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return state;
}

export function useTensorflowModel(): ModelState {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let initPromise: Promise<void> | null = null;

export async function loadTensorflowModelOnce() {
    if (state.status === 'success') return;
    if (initPromise) return initPromise;

    state = { ...state, status: 'loading', error: null};
    emit();

    initPromise = (async() => {
        try {
            const asset = Asset.fromModule(require('../assets/model.tflite'));
            await asset.downloadAsync();
            const modelPath = asset.localUri ?? asset.uri;

            const model = await loadTensorflowModel({ url: modelPath });

            state = { model, status: 'success', error: null };
            emit();
        } catch (e) {
            state = { model: null, status: 'error', error: e as Error };
            emit();
        } finally {
            initPromise = null;
        }
    })();

    return initPromise;
}






