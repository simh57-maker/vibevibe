/**
 * Zustand Global Store
 * 노드, 엣지, 레이어, 선택된 노드 상태 관리
 */

import { create } from 'zustand';
import { Edge } from 'reactflow';
import { CompanyNode, Layer } from './types';
import { generateId } from './utils';

interface StoreState {
  // 현재 활성 레이어
  currentLayerId: string | null;

  // 모든 레이어 목록
  layers: Layer[];

  // 현재 레이어의 노드/엣지
  nodes: CompanyNode[];
  edges: Edge[];

  // 선택된 노드 ID
  selectedNodeId: string | null;

  // Actions
  setNodes: (nodes: CompanyNode[]) => void;
  setEdges: (edges: Edge[]) => void;

  addNode: (node: CompanyNode) => void;
  updateNode: (nodeId: string, data: Partial<CompanyNode['data']>) => void;

  addEdge: (edge: Edge) => void;

  setSelectedNodeId: (nodeId: string | null) => void;

  // Layer Management
  createLayer: (companyName: string) => void;
  deleteLayer: (layerId: string) => void;
  switchLayer: (layerId: string) => void;
  updateLayerName: (layerId: string, name: string) => void;

  // 현재 레이어 저장
  saveCurrentLayer: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  currentLayerId: null,
  layers: [],
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setNodes: (nodes) => {
    console.log('🔄 Setting nodes in store:', nodes.length, 'nodes');
    set({ nodes });
  },

  setEdges: (edges) => {
    console.log('🔄 Setting edges in store:', edges.length, 'edges');
    set({ edges });
  },

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),

  updateNode: (nodeId, data) => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ),
  })),

  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge],
  })),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  createLayer: (companyName) => {
    const newLayer: Layer = {
      id: generateId(),
      name: `${companyName} 분석`,
      companyName,
      createdAt: Date.now(),
      nodes: [],
      edges: [],
    };

    console.log('📁 Creating new layer:', newLayer.id, 'for', companyName);

    set((state) => ({
      layers: [...state.layers, newLayer],
      currentLayerId: newLayer.id,
      nodes: [],
      edges: [],
      selectedNodeId: null,
    }));
  },

  deleteLayer: (layerId) => {
    const state = get();
    const newLayers = state.layers.filter((l) => l.id !== layerId);

    set({
      layers: newLayers,
      currentLayerId: newLayers.length > 0 ? newLayers[0].id : null,
      nodes: newLayers.length > 0 ? newLayers[0].nodes : [],
      edges: newLayers.length > 0 ? newLayers[0].edges : [],
      selectedNodeId: null,
    });
  },

  switchLayer: (layerId) => {
    const state = get();

    // 현재 레이어 저장
    if (state.currentLayerId) {
      const currentLayer = state.layers.find((l) => l.id === state.currentLayerId);
      if (currentLayer) {
        set({
          layers: state.layers.map((l) =>
            l.id === state.currentLayerId
              ? { ...l, nodes: state.nodes, edges: state.edges }
              : l
          ),
        });
      }
    }

    // 새 레이어 로드
    const targetLayer = state.layers.find((l) => l.id === layerId);
    if (targetLayer) {
      set({
        currentLayerId: layerId,
        nodes: targetLayer.nodes,
        edges: targetLayer.edges,
        selectedNodeId: null,
      });
    }
  },

  updateLayerName: (layerId, name) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, name } : l
      ),
    }));
  },

  saveCurrentLayer: () => {
    const state = get();
    if (!state.currentLayerId) return;

    set({
      layers: state.layers.map((l) =>
        l.id === state.currentLayerId
          ? { ...l, nodes: state.nodes, edges: state.edges }
          : l
      ),
    });
  },
}));
