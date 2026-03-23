import { useState, useEffect, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Zap, 
  Database, 
  Search, 
  Plus, 
  Save, 
  X, 
  ChevronRight, 
  Activity,
  Network,
  Cpu,
  FileText,
  Share2,
  Trash2,
  Maximize2,
  Video,
  Microscope,
  Library
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BrainNode, BrainLink, BrainMemory, MarketingSkill } from "../types";
import { brainService } from "../lib/supabase";
import { cn } from "../lib/utils";
import { ABSORBED_SKILLS } from "../constants";

interface AgentBrainProps {
  agent: MarketingSkill | null;
  onClose: () => void;
}

export function AgentBrain({ agent, onClose }: AgentBrainProps) {
  const [view, setView] = useState<"graph" | "vault" | "neural" | "skills">("graph");
  const [memories, setMemories] = useState<BrainMemory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<BrainMemory | null>(null);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [graphData, setGraphData] = useState<{ nodes: BrainNode[], links: BrainLink[] }>({ nodes: [], links: [] });
  const [isSyncing, setIsSyncing] = useState(false);
  const [neuralPulse, setNeuralPulse] = useState(0);

  const graphRef = useRef<any>(null);

  useEffect(() => {
    loadMemories();
    const interval = setInterval(() => {
      setNeuralPulse(prev => (prev + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, [agent]);

  const loadMemories = async () => {
    setIsSyncing(true);
    const { data } = await brainService.getMemories(agent?.id);
    if (data) {
      setMemories(data);
      generateGraph(data);
    }
    setTimeout(() => setIsSyncing(false), 800);
  };

  const generateGraph = (mems: BrainMemory[]) => {
    const nodes: BrainNode[] = [
      { id: "core", label: agent?.name || "Cérebro Central", type: "agent", val: 20, color: "#3b82f6" }
    ];
    const links: BrainLink[] = [];

    // Add concepts from memories
    mems.forEach(m => {
      nodes.push({ id: m.id, label: m.title, type: "concept", val: 10, color: "#f97316" });
      links.push({ source: "core", target: m.id, strength: 1 });

      // Link tags
      m.tags.forEach(tag => {
        if (!nodes.find(n => n.id === tag)) {
          nodes.push({ id: tag, label: `#${tag}`, type: "metric", val: 5, color: "#10b981" });
        }
        links.push({ source: m.id, target: tag, strength: 0.5 });
      });
    });

    setGraphData({ nodes, links });
  };

  const handleSaveNote = async () => {
    if (!newNote.title || !newNote.content) return;
    
    const memory: Partial<BrainMemory> = {
      agentId: agent?.id || "general",
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags.split(",").map(t => t.trim()).filter(t => t),
    };

    await brainService.saveMemory(memory);
    setNewNote({ title: "", content: "", tags: "" });
    setIsNewNoteOpen(false);
    loadMemories();
  };

  const handleObsidianSync = () => {
    if (!selectedMemory) return;
    const content = `---
agent: ${agent?.name || "Global"}
tags: ${selectedMemory.tags.join(", ")}
date: ${new Date(selectedMemory.createdAt).toISOString()}
---

# ${selectedMemory.title}

${selectedMemory.content}`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedMemory.title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 z-50 bg-[#141414] border border-[#E4E3E0]/20 rounded-xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#E4E3E0]/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center relative overflow-hidden">
            <Brain className="w-6 h-6 text-white relative z-10" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Cérebro Sináptico: {agent?.name || "Global"}
              {isSyncing && <Activity className="w-4 h-4 text-blue-400 animate-pulse" />}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-mono">
              Sincronizado com Obsidian & Supabase v2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setView("graph")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2",
                view === "graph" ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"
              )}
            >
              <Network className="w-3 h-3" /> Grafo
            </button>
            <button 
              onClick={() => setView("vault")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2",
                view === "vault" ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"
              )}
            >
              <Database className="w-3 h-3" /> Vault
            </button>
            <button 
              onClick={() => setView("neural")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2",
                view === "neural" ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"
              )}
            >
              <Cpu className="w-3 h-3" /> Neural
            </button>
            <button 
              onClick={() => setView("skills")}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all flex items-center gap-2",
                view === "skills" ? "bg-blue-600 text-white" : "text-white/50 hover:text-white"
              )}
            >
              <Library className="w-3 h-3" /> Skills
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Memories List */}
        <div className="w-80 border-r border-[#E4E3E0]/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-[#E4E3E0]/10">
            <button 
              onClick={() => setIsNewNoteOpen(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Nova Memória
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {memories.map(memory => (
              <button
                key={memory.id}
                onClick={() => setSelectedMemory(memory)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all border group",
                  selectedMemory?.id === memory.id 
                    ? "bg-blue-600/20 border-blue-600/50" 
                    : "bg-white/5 border-transparent hover:border-white/10"
                )}
              >
                <h3 className="text-sm font-bold text-white truncate">{memory.title}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {memory.tags.map(tag => (
                    <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded text-blue-300 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-[9px] text-white/40 mt-2 font-mono">
                  {new Date(memory.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Viewport */}
        <div className="flex-1 relative bg-[#0a0a0a]">
          {view === "graph" && (
            <div className="w-full h-full">
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel="label"
                nodeColor={n => (n as any).color}
                nodeVal={n => (n as any).val}
                linkColor={() => "rgba(255,255,255,0.1)"}
                linkWidth={l => (l as any).strength}
                backgroundColor="#0a0a0a"
                onNodeClick={(node: any) => {
                  const mem = memories.find(m => m.id === node.id);
                  if (mem) setSelectedMemory(mem);
                }}
              />
              <div className="absolute bottom-4 right-4 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
                <div className="flex items-center gap-4 text-[10px] uppercase font-mono tracking-widest text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Agente
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" /> Insight
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Métrica
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "vault" && selectedMemory && (
            <div className="w-full h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl font-bold tracking-tighter text-white italic serif">
                    {selectedMemory.title}
                  </h1>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleObsidianSync}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/50 flex items-center gap-2 group"
                      title="Sincronizar com Obsidian (Download .md)"
                    >
                      <Share2 className="w-5 h-5 group-hover:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase hidden md:inline">Obsidian</span>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-red-400">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedMemory.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{selectedMemory.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {view === "neural" && (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="relative w-96 h-96">
                {/* Mad Scientist Neural Visualization */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-blue-500/20 rounded-full border-dashed"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border border-orange-500/10 rounded-full"
                />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <Zap className="w-16 h-16 text-blue-500 mx-auto animate-pulse" />
                      <motion.div 
                        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-blue-400">Sinapses Ativas</p>
                      <p className="text-4xl font-bold text-white font-mono">{neuralPulse}%</p>
                    </div>
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                      <motion.div 
                        animate={{ width: `${neuralPulse}%` }}
                        className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                      />
                    </div>
                    <p className="text-[9px] text-white/40 font-mono max-w-[200px] mx-auto">
                      Processando padrões de marketing em tempo real via Supabase Vector Engine.
                    </p>
                  </div>
                </div>

                {/* Floating "Neurons" */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      x: [0, Math.cos(i) * 150, 0], 
                      y: [0, Math.sin(i) * 150, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 2, 
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                    className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}

          {view === "skills" && (
            <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Repositório de Habilidades Absorvidas</h2>
                  <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.3em]">Inteligência Coletiva do Enxame</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ABSORBED_SKILLS.map((group, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          {group.icon === "Cpu" && <Cpu className="w-6 h-6 text-blue-400 group-hover:text-white" />}
                          {group.icon === "Video" && <Video className="w-6 h-6 text-blue-400 group-hover:text-white" />}
                          {group.icon === "Microscope" && <Microscope className="w-6 h-6 text-blue-400 group-hover:text-white" />}
                          {group.icon === "Network" && <Network className="w-6 h-6 text-blue-400 group-hover:text-white" />}
                        </div>
                        <h3 className="text-xl font-bold text-white">{group.source}</h3>
                      </div>
                      <ul className="space-y-3">
                        {group.skills.map((skill, sIdx) => (
                          <li key={sIdx} className="flex items-center gap-3 text-sm text-white/60 group-hover:text-white/80 transition-colors">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-center space-y-4">
                  <Brain className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
                  <h3 className="text-xl font-bold text-white">Distribuição Automática Ativa</h3>
                  <p className="text-sm text-white/60 max-w-2xl mx-auto">
                    Estas habilidades foram absorvidas de repositórios globais e estão sendo distribuídas para todos os agentes do enxame. 
                    O Orquestrador gerencia a aplicação desses conhecimentos em cada tarefa delegada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Note Modal */}
          <AnimatePresence>
            {isNewNoteOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
              >
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-2xl space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Plus className="w-5 h-5 text-blue-500" /> Nova Memória Sináptica
                    </h3>
                    <button onClick={() => setIsNewNoteOpen(false)} className="text-white/40 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Título da Insight (ex: Padrão de Conversão Meta Ads)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                      value={newNote.title}
                      onChange={e => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <textarea 
                      placeholder="Conteúdo (Markdown suportado)..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white h-64 focus:outline-none focus:border-blue-500 transition-all resize-none font-mono text-sm"
                      value={newNote.content}
                      onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    />
                    <input 
                      type="text" 
                      placeholder="Tags (separadas por vírgula: roi, meta, conversion)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-blue-500 transition-all font-mono"
                      value={newNote.tags}
                      onChange={e => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setIsNewNoteOpen(false)}
                      className="px-6 py-2 text-white/60 hover:text-white text-xs font-bold uppercase"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveNote}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Gravar no Cérebro
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
