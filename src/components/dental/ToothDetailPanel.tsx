import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Stethoscope, Activity, Image, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ToothClinicalData } from "./types";
import type { ToothMeta } from "./constants";
import { EndoPanel } from "./EndoPanel";
import { PerioPanel } from "./PerioPanel";
import { ConditionsPanel } from "./ConditionsPanel";
import { XrayPanel } from "./XrayPanel";
import { ToothHistoryPanel } from "./ToothHistoryPanel";
import { cn } from "@/lib/utils";

interface ToothDetailPanelProps {
  tooth: ToothMeta;
  data: ToothClinicalData;
  onClose: () => void;
  onUpdate: (data: ToothClinicalData) => void;
}

export function ToothDetailPanel({ tooth, data, onClose, onUpdate }: ToothDetailPanelProps) {
  const [localData, setLocalData] = useState<ToothClinicalData>(data);
  const [activeTab, setActiveTab] = useState("conditions");

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleUpdate = useCallback(
    (patch: Partial<ToothClinicalData>) => {
      setLocalData((prev) => {
        const next = { ...prev, ...patch, lastUpdated: new Date().toISOString() };
        onUpdate(next);
        return next;
      });
    },
    [onUpdate]
  );

  const tabs = [
    { value: "conditions", label: "Conditions", icon: Stethoscope },
    { value: "endo", label: "Endodontic", icon: Activity },
    { value: "perio", label: "Periodontal", icon: Activity },
    { value: "xray", label: "X-Rays", icon: Image },
    { value: "history", label: "History", icon: History },
    { value: "notes", label: "Notes", icon: FileText },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="fixed inset-x-0 bottom-0 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-0 sm:w-[440px] sm:ml-4"
    >
      <div className="bg-card border border-border shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] sm:max-h-none flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20">
              {tooth.iso}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-card-foreground">{tooth.name}</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {tooth.type} · {tooth.jaw} {tooth.side}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-3 pt-3 border-b border-border bg-card">
            <TabsList className="w-full bg-muted p-1 h-auto flex flex-wrap gap-0.5 rounded-lg">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex-1 text-[11px] py-1.5 px-1.5 rounded-md transition-all border border-transparent",
                    "data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:border-border data-[state=active]:text-primary data-[state=active]:font-semibold",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  <tab.icon className="h-3 w-3 mr-1 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 max-h-[55vh] sm:max-h-[600px]">
            <div className="p-4">
              <TabsContent value="conditions" className="mt-0">
                <ConditionsPanel
                  data={localData}
                  onChange={(conditions, mobilityGrade, furcationGrade) =>
                    handleUpdate({ conditions, mobilityGrade, furcationGrade })
                  }
                />
              </TabsContent>

              <TabsContent value="endo" className="mt-0">
                <EndoPanel
                  tests={localData.endoTests}
                  onChange={(endoTests) => handleUpdate({ endoTests })}
                />
              </TabsContent>

              <TabsContent value="perio" className="mt-0">
                <PerioPanel
                  data={localData.perioData}
                  toothType={tooth.type}
                  onChange={(perioData) => handleUpdate({ perioData })}
                />
              </TabsContent>

              <TabsContent value="xray" className="mt-0">
                <XrayPanel toothNumber={tooth.number} />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <ToothHistoryPanel
                  history={[
                    {
                      id: "h1",
                      date: new Date().toISOString(),
                      type: "note",
                      title: "Initial examination",
                      description: "Tooth appears healthy with no visible caries.",
                      performedBy: "Dr. Smith",
                    },
                  ]}
                />
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground">Clinical Notes</label>
                  <Textarea
                    value={localData.notes || ""}
                    onChange={(e) => handleUpdate({ notes: e.target.value })}
                    placeholder="Enter clinical observations, findings, or treatment plans for this tooth..."
                    className="min-h-[200px] text-sm resize-none bg-card border-border focus:border-primary focus:ring-primary/20 text-foreground"
                  />
                  {localData.lastUpdated && (
                    <p className="text-[10px] text-muted-foreground text-right">
                      Last updated: {new Date(localData.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </motion.div>
  );
}
