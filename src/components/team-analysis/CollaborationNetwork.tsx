import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Info } from 'lucide-react';
import { collaborationNodes, collaborationEdges, aiInsights } from '@/data/mockData';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

interface TooltipData {
  x: number;
  y: number;
  name: string;
  role: string;
  department: string;
  collabCount: number;
}

export default function CollaborationNetwork() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleNodeEnter = useCallback((nodeId: string, event: React.MouseEvent) => {
    const node = collaborationNodes.find((n) => n.id === nodeId);
    if (!node) return;
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    const connectedCount = collaborationEdges.filter(
      (e) => e.source === nodeId || e.target === nodeId,
    ).length;
    setHoveredNode(nodeId);
    setTooltip({
      x: (event.clientX - svgRect.left) + 10,
      y: (event.clientY - svgRect.top) - 10,
      name: node.name,
      role: node.role,
      department: node.department,
      collabCount: connectedCount,
    });
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
    setTooltip(null);
  }, []);

  const isEdgeHighlighted = (edge: typeof collaborationEdges[0]) => {
    if (!hoveredNode) return true;
    return edge.source === hoveredNode || edge.target === hoveredNode;
  };

  const isNodeHighlighted = (nodeId: string) => {
    if (!hoveredNode) return true;
    if (nodeId === hoveredNode) return true;
    return collaborationEdges.some(
      (e) => (e.source === hoveredNode && e.target === nodeId) || (e.target === hoveredNode && e.source === nodeId),
    );
  };

  return (
    <motion.section
      variants={fadeUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="bg-card rounded-xl p-5 relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-foreground text-xl font-semibold">团队协作网络</h2>
          <p className="text-muted-foreground text-xs mt-0.5">基于任务协作、评论互动和文件共享数据</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground bg-muted px-2 py-1 rounded">本周</span>
          <span className="text-muted-foreground bg-muted px-2 py-1 rounded">任务协作</span>
        </div>
      </div>

      {/* AI Insights */}
      <div className="flex flex-wrap gap-2 mb-4">
        {aiInsights.map((insight) => (
          <div
            key={insight.id}
            className="flex items-center gap-1.5 bg-muted border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-muted-foreground"
          >
            <Sparkles className="w-3 h-3 text-[#A855F7] shrink-0" />
            {insight.title}
          </div>
        ))}
      </div>

      {/* Network Graph */}
      <div className="relative" style={{ height: 400 }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 600 380"
          className="rounded-lg bg-card"
        >
          {/* Edges */}
          {collaborationEdges.map((edge, i) => {
            const source = collaborationNodes.find((n) => n.id === edge.source);
            const target = collaborationNodes.find((n) => n.id === edge.target);
            if (!source || !target) return null;
            const highlighted = isEdgeHighlighted(edge);
            const opacity = hoveredNode ? (highlighted ? 0.8 : 0.1) : 0.4;
            const strokeWidth = Math.max(1, edge.weight / 8);
            const color = edge.type === 'task' ? '#3B82F6' : edge.type === 'comment' ? '#94A3B8' : '#22C55E';
            return (
              <motion.line
                key={i}
                x1={source.x} y1={source.y}
                x2={target.x} y2={target.y}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.02, duration: 0.5 }}
              />
            );
          })}

          {/* Nodes */}
          {collaborationNodes.map((node, i) => {
            const highlighted = isNodeHighlighted(node.id);
            const isHovered = hoveredNode === node.id;
            const opacity = hoveredNode ? (highlighted ? 1 : 0.2) : 1;
            const scale = isHovered ? 1.3 : 1;
            return (
              <g key={node.id} style={{ opacity, transition: 'opacity 0.2s' }}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size * scale}
                  fill={node.color + '30'}
                  stroke={node.color}
                  strokeWidth={2}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.5, type: 'spring' }}
                  className="cursor-pointer"
                  onMouseEnter={(e) => handleNodeEnter(node.id, e)}
                  onMouseLeave={handleNodeLeave}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize={isHovered ? 11 : 9}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {node.name[0]}
                </text>
                <text
                  x={node.x + node.size + 6}
                  y={node.y + 3}
                  fill="#94A3B8"
                  fontSize={9}
                  className="pointer-events-none"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-muted border border-border rounded-lg p-3 shadow-xl z-10 pointer-events-none"
            style={{ left: Math.min(tooltip.x, 400), top: tooltip.y }}
          >
            <p className="text-foreground font-semibold text-sm">{tooltip.name}</p>
            <p className="text-muted-foreground text-xs">{tooltip.role} · {tooltip.department}</p>
            <p className="text-accent text-xs mt-1">本周协作: {tooltip.collabCount} 次</p>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-muted/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs">
          <div className="text-muted-foreground mb-1.5 font-medium">部门</div>
          {[
            { label: '开发', color: '#3B82F6' },
            { label: '设计', color: '#A855F7' },
            { label: '产品', color: '#06B6D4' },
            { label: '测试', color: '#22C55E' },
            { label: '运维', color: '#F97316' },
            { label: '数据', color: '#22C55E' },
          ].map((dept) => (
            <div key={dept.label} className="flex items-center gap-1.5 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
              <span className="text-muted-foreground">{dept.label}</span>
            </div>
          ))}
          <div className="border-t border-border mt-2 pt-2">
            <div className="text-muted-foreground mb-1 font-medium">连线类型</div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-[2px] bg-primary" />
              <span className="text-muted-foreground">任务协作</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-[2px] bg-[#94A3B8]" />
              <span className="text-muted-foreground">评论互动</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[2px] bg-[#22C55E]" />
              <span className="text-muted-foreground">文件共享</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-muted-foreground text-xs">
        <Info className="w-3 h-3" />
        <span>hover 节点查看详情，节点大小表示协作频次</span>
      </div>
    </motion.section>
  );
}
