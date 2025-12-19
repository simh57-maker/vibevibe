'use client';

/**
 * Main Page
 * AdInsightMap 메인 화면
 */

import { ReactFlowProvider } from 'reactflow';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { FlowCanvas } from '@/components/FlowCanvas';
import { CompanyInput } from '@/components/CompanyInput';
import { useStore } from '@/lib/store';

export default function Home() {
  const { selectedNodeId, currentLayerId, nodes } = useStore();

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <CompanyInput />
          {currentLayerId ? (
            <FlowCanvas />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg px-6 mt-[-100px]">
                <div className="inline-flex p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  AdInsightMap에 오신 것을 환영합니다
                </h1>
                <p className="text-gray-600 mb-8">
                  위 입력창에 분석할 기업명을 입력하면<br/>
                  AI가 자동으로 경쟁사를 찾아 노드 맵으로 시각화합니다
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> 카카오, 네이버, 삼성 등 유명 브랜드로 시작해보세요
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        {selectedNodeId && <RightSidebar />}
      </div>
    </ReactFlowProvider>
  );
}
