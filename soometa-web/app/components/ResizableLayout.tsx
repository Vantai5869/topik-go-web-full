'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { ChevronLeft } from 'lucide-react';
import ChatSidebar from './ChatSidebar';

interface ResizableLayoutProps {
  leftContent: React.ReactNode;
  defaultLayout?: number;
  defaultCollapsed?: boolean;
}

export default function ResizableLayout({
  leftContent,
  defaultLayout = 20,
  defaultCollapsed = false
}: ResizableLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const panelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    onChange();
    setIsMounted(true);

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const togglePanel = () => {
    const panel = panelRef.current;
    if (panel) {
      if (isCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const onLayout = (sizes: number[]) => {
    document.cookie = `resizable-layout:layout=${JSON.stringify(sizes)}; path=/; max-age=31536000`;
  };

  const onCollapse = () => {
    setIsCollapsed(true);
    document.cookie = `resizable-layout:collapsed=true; path=/; max-age=31536000`;
  };

  const onExpand = () => {
    setIsCollapsed(false);
    document.cookie = `resizable-layout:collapsed=false; path=/; max-age=31536000`;
  };

  // Render mobile: chỉ hiển thị content, ẩn chat sidebar
  if (isMobile) {
    return (
      <div
        className="relative h-screen w-screen overflow-hidden"
        style={{
          opacity: isMounted ? 1 : 0,
          transition: 'opacity 150ms ease-in'
        }}
      >
        <div className="h-full w-full overflow-auto">
          {leftContent}
        </div>
      </div>
    );
  }

  // Render desktop: hiển thị resizable layout với chat sidebar
  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{
        opacity: isMounted ? 1 : 0,
        transition: 'opacity 150ms ease-in'
      }}
    >
      <PanelGroup
        direction="horizontal"
        className="h-full w-full"
        onLayout={onLayout}
      >
        <Panel
          defaultSize={100 - defaultLayout}
          minSize={30}
        >
          <div className="h-full w-full overflow-auto">
            {leftContent}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 cursor-col-resize bg-gray-200 hover:bg-blue-400 transition-colors relative group">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300 group-hover:bg-blue-500" />
        </PanelResizeHandle>

        <Panel
          ref={panelRef}
          defaultSize={defaultLayout}
          minSize={20}
          maxSize={40}
          collapsible={true}
          onCollapse={onCollapse}
          onExpand={onExpand}
        >
          <div className="h-full w-full overflow-hidden border-l border-gray-200 p-3">
            <ChatSidebar onClose={togglePanel} />
          </div>
        </Panel>
      </PanelGroup>

      {isCollapsed && (
        <button
          onClick={togglePanel}
          className="absolute z-50 right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 border-r-0 rounded-l-md p-1.5 shadow-md hover:bg-gray-50 transition-all group flex items-center justify-center"
          title="Open Sidebar"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
        </button>
      )}
    </div>
  );
}
