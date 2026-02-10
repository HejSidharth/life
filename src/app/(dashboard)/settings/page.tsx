"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, Suspense } from "react";
import { 
  Settings, 
  Target, 
  Key, 
  ChevronRight, 
  Plus, 
  Copy, 
  Trash2, 
  BookOpen,
  Check,
  Shield,
  Smartphone,
  ExternalLink
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser, UserButton, SignedIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { generateApiKey, hashApiKey } from "@/lib/utils";
import type { Id } from "convex/_generated/dataModel";

type GoalType = "calories" | "protein" | "carbs" | "fat" | "water" | "exercise_minutes";

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const goalLabels: Record<GoalType, { label: string; unit: string }> = {
  calories: { label: "Daily Calories", unit: "kcal" },
  protein: { label: "Daily Protein", unit: "g" },
  carbs: { label: "Daily Carbs", unit: "g" },
  fat: { label: "Daily Fat", unit: "g" },
  water: { label: "Daily Water", unit: "ml" },
  exercise_minutes: { label: "Daily Exercise", unit: "min" },
};

function SettingsContent() {
  const { user } = useUser();
  const userId = user?.id;

  // Convex Queries
  const goalsData = useQuery(api.stats.getTodayStats, userId ? { userId } : "skip") as any;
  const apiKeys = useQuery(api.apiKeys.getAll, userId ? { userId } : "skip") || [];

  // Convex Mutations
  const upsertGoal = useMutation(api.goals.upsert);
  const createApiKeyMutation = useMutation(api.apiKeys.create);
  const revokeApiKey = useMutation(api.apiKeys.remove);

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [goalFormData, setGoalFormData] = useState({
    type: "calories" as GoalType,
    target: "",
  });
  const [apiKeyName, setApiKeyName] = useState("");

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    await upsertGoal({
      userId,
      type: goalFormData.type,
      target: parseInt(goalFormData.target),
    });
    setIsGoalDialogOpen(false);
    setGoalFormData({ type: "calories", target: "" });
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const key = generateApiKey();
    const keyHash = hashApiKey(key);
    await createApiKeyMutation({
      userId,
      name: apiKeyName,
      keyHash,
      keyPrefix: key.slice(0, 12),
    });
    setNewApiKey(key);
    setApiKeyName("");
  };

  const handleCopyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeGoals = goalsData?.goals || {};

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your experience.</p>
      </motion.div>

      {/* Account Info */}
      <Card className="border-0 bg-zinc-900/30">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
              <Settings className="w-8 h-8 text-zinc-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.fullName || "Your Account"}</h2>
              <p className="text-sm text-zinc-500">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-12 h-12 ring-2 ring-white/10 ring-offset-4 ring-offset-black",
                },
              }}
            />
          </SignedIn>
        </CardContent>
      </Card>

      {/* Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-zinc-400" />
            Daily Goals
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsGoalDialogOpen(true)}
            className="text-zinc-400 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(activeGoals).map(([type, target]: [any, any]) => (
            <motion.div key={type} whileHover={{ scale: 1.02 }} transition={springTransition}>
              <Card className="border-0 bg-zinc-950/50 hover:bg-zinc-900/50 transition-all cursor-pointer shadow-sm border border-white/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {goalLabels[type as GoalType]?.label || type}
                    </p>
                    <p className="text-xl font-black mt-0.5">
                      {target}
                      <span className="text-sm font-bold text-zinc-500 ml-1">
                        {goalLabels[type as GoalType]?.unit}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* API Keys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5 text-zinc-400" />
            API Keys
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsApiKeyDialogOpen(true)}
            className="text-zinc-400 hover:text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>

        <div className="space-y-2">
          {apiKeys.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8 bg-zinc-950/30 rounded-3xl border border-zinc-900/50">
              No API keys created yet.
            </p>
          ) : (
            apiKeys.map((key: any) => (
              <Card key={key._id} className="border-0 bg-zinc-950/50 shadow-sm border border-white/5 group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-200">{key.name}</h3>
                      <p className="text-xs text-zinc-500 font-mono">
                        {key.keyPrefix}... · Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => revokeApiKey({ id: key._id as Id<"apiKeys"> })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Developer Documentation */}
      <Card className="border-0 bg-zinc-900/10 border border-white/5">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-zinc-400" />
            OpenClaw & API Access
          </h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Access your data from any application using your private API keys. Perfect for integration with OpenClaw health analysis.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold">
              View API Docs <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white text-xs font-bold">
              OpenClaw Setup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Set Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGoalSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Goal Type</Label>
              <Select
                value={goalFormData.type}
                onChange={(e) => setGoalFormData({ ...goalFormData, type: e.target.value as GoalType })}
                className="h-14 rounded-2xl bg-zinc-900 border-0"
              >
                {Object.entries(goalLabels).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                Target ({goalLabels[goalFormData.type].unit})
              </Label>
              <Input
                type="number"
                value={goalFormData.target}
                onChange={(e) => setGoalFormData({ ...goalFormData, target: e.target.value })}
                className="h-14 rounded-2xl bg-zinc-900 border-0 text-lg font-bold"
                placeholder="2000"
                required
              />
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-lg">
              Save Goal
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsApiKeyDialogOpen(false);
          setNewApiKey(null);
          setCopied(false);
        } else {
          setIsApiKeyDialogOpen(true);
        }
      }}>
        <DialogContent className="rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {newApiKey ? "Key Generated" : "New API Key"}
            </DialogTitle>
          </DialogHeader>
          
          {newApiKey ? (
            <div className="space-y-6 py-4 text-center">
              <div className="p-6 bg-zinc-900 rounded-2xl border border-white/5 relative group">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Your API Key</p>
                <code className="text-sm font-mono text-zinc-200 break-all select-all">
                  {newApiKey}
                </code>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleCopyKey}
                  className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold"
                >
                  {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                  {copied ? "Copied!" : "Copy Key"}
                </Button>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Store this safely. You won&apos;t be able to see it again.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateApiKey} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Key Name</Label>
                <Input
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  placeholder="My iPhone, OpenClaw, etc."
                  className="h-14 rounded-2xl bg-zinc-900 border-0 text-lg"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-lg">
                Generate Key
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
