'use client';

/**
 * React Flow Canvas Component
 * 노드 기반 마인드맵 캔버스
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Connection,
  Edge,
  NodeTypes,
  useReactFlow,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useStore } from '@/lib/store';
import { CompanyNode } from '@/components/flow/CompanyNode';
import { CompanyNode as CompanyNodeType, NodeData } from '@/lib/types';

const nodeTypes: NodeTypes = {
  company: CompanyNode,
};

export function FlowCanvas() {
  const reactFlowInstance = useReactFlow();
  const [initialized, setInitialized] = useState(false);
  const prevNodesLengthRef = useRef(0);

  const storeNodes = useStore((state) => state.nodes);
  const storeEdges = useStore((state) => state.edges);
  const updateNode = useStore((state) => state.updateNode);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const saveCurrentLayer = useStore((state) => state.saveCurrentLayer);

  // ReactFlow 자체 상태 관리 사용
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Store에서 노드가 변경되면 ReactFlow 상태 업데이트
  useEffect(() => {
    if (storeNodes.length !== prevNodesLengthRef.current) {
      console.log('🔄 Syncing nodes from store:', storeNodes.length);
      setNodes(storeNodes);
      prevNodesLengthRef.current = storeNodes.length;
    }
  }, [storeNodes, setNodes]);

  // Store에서 엣지가 변경되면 ReactFlow 상태 업데이트
  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // ReactFlow가 마운트되면 fitView 실행
  useEffect(() => {
    if (nodes.length > 0 && !initialized) {
      console.log('🔄 Fitting view to nodes');
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
        setInitialized(true);
      }, 100);
    }
  }, [nodes, reactFlowInstance, initialized]);

  // 노드 선택 핸들러
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: CompanyNodeType) => {
      setSelectedNodeId(node.id);

      // 인사이트가 없으면 자동 생성
      if (!node.data.insights && !node.data.isAnalyzing && node.data.images.length > 0) {
        generateInsights(node.id, node.data);
      }
    },
    [setSelectedNodeId]
  );

  // 인사이트 자동 생성
  const generateInsights = async (nodeId: string, nodeData: NodeData) => {
    try {
      updateNode(nodeId, { isAnalyzing: true });

      // 이미지 설명 생성 (Mock 데이터의 description 사용)
      const imageDescriptions = await Promise.all(
        nodeData.images.map(async (url) => {
          // Mock: URL을 설명으로 변환
          return `${nodeData.label}의 광고 이미지 - 전문적인 비주얼과 강렬한 메시지`;
        })
      );

      const response = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: nodeData.label,
          images: imageDescriptions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();

      updateNode(nodeId, {
        insights: data.insights,
        isAnalyzing: false,
      });

      saveCurrentLayer();
    } catch (error) {
      console.error('Insight generation error:', error);
      updateNode(nodeId, { isAnalyzing: false });
    }
  };

  // 엣지 연결 핸들러
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdge: Edge = {
          id: `edge_${connection.source}_${connection.target}`,
          source: connection.source!,
          target: connection.target!,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        };
        return [...eds, newEdge];
      });
      saveCurrentLayer();
    },
    [setEdges, saveCurrentLayer]
  );

  // 패닝/줌 종료 시 레이어 저장
  const onMoveEnd = useCallback(() => {
    saveCurrentLayer();
  }, [saveCurrentLayer]);

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Debug overlay */}
      <div className="absolute top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
        <div className="text-sm font-mono">
          <div>Nodes: {nodes.length}</div>
          <div>Edges: {edges.length}</div>
          <div>Initialized: {initialized.toString()}</div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onMoveEnd={onMoveEnd}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-lg" />
        <MiniMap
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
          nodeColor={(node) => {
            return node.data.type === 'root' ? '#3b82f6' : '#94a3b8';
          }}
        />
      </ReactFlow>
    </div>
  );
}
